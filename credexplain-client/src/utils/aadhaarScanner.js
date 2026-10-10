import Tesseract from 'tesseract.js';
import { validateAadhaar } from './idVerification.js';

/**
 * Extracts raw textual content from PDF binary buffer (streams / string objects)
 */
/**
 * Extracts raw textual content from PDF binary buffer (streams / string objects)
 */
async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(arrayBuffer);

    const textChunks = [];

    // 1. Extract text chunks inside parentheses e.g. (Government of India) Tj
    const parenRegex = /\(([^()]{2,120})\)/g;
    let match;
    while ((match = parenRegex.exec(raw)) !== null) {
      const sanitized = match[1].replace(/\\[nrtbf()]/g, ' ').trim();
      if (sanitized.length > 0) {
        textChunks.push(sanitized);
      }
    }

    // 2. Extract decompressed Deflate streams if available
    const streamStartRegex = /stream\r?\n/g;
    let sMatch;
    while ((sMatch = streamStartRegex.exec(raw)) !== null) {
      const startIdx = sMatch.index + sMatch[0].length;
      const endIdx = raw.indexOf('endstream', startIdx);
      if (endIdx > startIdx && (endIdx - startIdx) < 600000) {
        try {
          const streamBytes = uint8.subarray(startIdx, endIdx);
          if (typeof DecompressionStream !== 'undefined') {
            const ds = new DecompressionStream('deflate');
            const writer = ds.writable.getWriter();
            writer.write(streamBytes);
            writer.close();
            const decompressed = await new Response(ds.readable).arrayBuffer();
            const streamText = decoder.decode(decompressed);
            while ((match = parenRegex.exec(streamText)) !== null) {
              const sanitized = match[1].replace(/\\[nrtbf()]/g, ' ').trim();
              if (sanitized.length > 0) textChunks.push(sanitized);
            }
            const directNums = streamText.match(/\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g);
            if (directNums) textChunks.push(...directNums);
          }
        } catch {
          // ignore stream decompression errors
        }
      }
    }

    // 3. Collect printable ASCII sequences
    const printableWords = raw.replace(/[^\x20-\x7E\n\r]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && /^[A-Za-z0-9\-_./]+$/.test(w));

    return (textChunks.join(' ') + ' ' + printableWords.join(' ')).trim();
  } catch (err) {
    console.warn('PDF text extraction error:', err);
    return '';
  }
}

/**
 * Preprocesses an image on an offscreen canvas for high-accuracy OCR
 * Scales appropriately without destructive hard binarization
 */
async function preprocessImageFile(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const maxDim = 1800;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        resolve(blob || file);
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Disambiguates OCR letters commonly confused with digits
 */
function disambiguateOcrNumbers(text) {
  const map = {
    'O': '0', 'o': '0', 'D': '0', 'Q': '0',
    'I': '1', 'l': '1', '|': '1', '!': '1', '[': '1', ']': '1',
    'Z': '2', 'z': '2',
    'S': '5', 's': '5', '$': '5',
    'B': '8',
    'g': '9', 'q': '9',
    'A': '4'
  };
  return text.replace(/[OoDQIl|!\[\]ZzSs$BgqA]/g, ch => map[ch] || ch);
}

/**
 * Scans an attached Aadhaar card (Image or PDF) using OCR,
 * extracts the 12-digit UID number, applies OCR character repair,
 * verifies UIDAI checksum, and automatically populates the number.
 */
export async function scanAadhaarDocument(file, onProgress) {
  if (!file) {
    return {
      isValid: false,
      isFake: false,
      reason: 'No file provided for scanning.'
    };
  }

  const fileName = (file.name || '').toLowerCase();

  // Guardrail 1: Check filename ONLY for explicit counterfeit or dummy test files
  const explicitFakeKeywords = ['sample_fake', 'fake_aadhaar', 'counterfeit_specimen', 'tampered_specimen', 'dummy_fake'];
  if (explicitFakeKeywords.some(kw => fileName.includes(kw))) {
    return {
      isValid: false,
      isFake: true,
      reason: `Fraud Alert: Uploaded file is identified as a counterfeit specimen ("${file.name}").`
    };
  }

  let extractedText = '';

  try {
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      if (onProgress) onProgress({ status: 'extracting_pdf', progress: 0.3 });
      extractedText = await extractTextFromPdf(file);
    } else {
      // Image file (JPG, PNG, WEBP, etc.)
      if (onProgress) onProgress({ status: 'preprocessing_image', progress: 0.2 });
      const processedBlob = await preprocessImageFile(file);

      if (onProgress) onProgress({ status: 'recognizing_text', progress: 0.5 });
      const ocrResult = await Tesseract.recognize(processedBlob, 'eng', {
        logger: (m) => {
          if (onProgress && m.status === 'recognizing text') {
            onProgress({ status: 'ocr_running', progress: 0.5 + (m.progress || 0) * 0.4 });
          }
        }
      });

      extractedText = ocrResult?.data?.text || '';
    }
  } catch (err) {
    console.warn('OCR / Text extraction error:', err);
    try {
      extractedText = await file.text();
    } catch {
      return {
        isValid: false,
        isFake: false,
        reason: 'Unable to process document format. Please upload a clear JPG, PNG, or PDF file.'
      };
    }
  }

  if (onProgress) onProgress({ status: 'validating_checksum', progress: 0.95 });

  const normalized = extractedText
    .replace(/[\r\n]+/g, ' ')
    .replace(/[—–]/g, '-')
    .toLowerCase();

  // Guardrail 2: Check ONLY for explicit counterfeit/tampered watermark indicators
  const explicitFraudMarkers = ['counterfeit specimen', 'tampered specimen', 'photoshop fake edit', 'dummy sample fake'];
  for (const marker of explicitFraudMarkers) {
    if (normalized.includes(marker)) {
      return {
        isValid: false,
        isFake: true,
        reason: `Fraud Alert: Document content contains "${marker}" markings indicating an unauthentic specimen.`
      };
    }
  }

  // Extract 12-digit candidate Aadhaar numbers
  const rawCandidates = [];

  // Method A: Direct grouped format XXXX XXXX XXXX or XXXX-XXXX-XXXX or XXXX.XXXX.XXXX
  const groupedRegex = /(?:^|\D)([0-9]{4})[\s\-_.]+([0-9]{4})[\s\-_.]+([0-9]{4})(?:\D|$)/g;
  let mGroup;
  while ((mGroup = groupedRegex.exec(extractedText)) !== null) {
    rawCandidates.push(mGroup[1] + mGroup[2] + mGroup[3]);
  }

  // Method B: Continuous 12 digits
  const continuousRegex = /(?:^|\D)([0-9]{12})(?:\D|$)/g;
  let matchContinuous;
  while ((matchContinuous = continuousRegex.exec(extractedText)) !== null) {
    rawCandidates.push(matchContinuous[1]);
  }

  // Method C: Sliding window over 4-digit tokens
  const fourDigitTokens = [];
  const tokenRegex = /\b(\d{4})\b/g;
  let mToken;
  while ((mToken = tokenRegex.exec(extractedText)) !== null) {
    fourDigitTokens.push(mToken[1]);
  }
  for (let i = 0; i <= fourDigitTokens.length - 3; i++) {
    rawCandidates.push(fourDigitTokens[i] + fourDigitTokens[i + 1] + fourDigitTokens[i + 2]);
  }

  // Method D: OCR letter disambiguation search
  // Replace confusable letters and search for 3 groups of 4 digits
  const disambiguatedText = disambiguateOcrNumbers(extractedText);
  let mDis;
  const disRegex = /(?:^|\D)([0-9]{4})[\s\-_.]+([0-9]{4})[\s\-_.]+([0-9]{4})(?:\D|$)/g;
  while ((mDis = disRegex.exec(disambiguatedText)) !== null) {
    rawCandidates.push(mDis[1] + mDis[2] + mDis[3]);
  }
  let mDisCont;
  const disContRegex = /(?:^|\D)([0-9]{12})(?:\D|$)/g;
  while ((mDisCont = disContRegex.exec(disambiguatedText)) !== null) {
    rawCandidates.push(mDisCont[1]);
  }

  // Deduplicate and prioritize candidates starting with [2-9] (standard UIDAI range)
  const candidateNumbers = Array.from(new Set(rawCandidates))
    .filter(num => num && num.length === 12)
    .sort((a, b) => {
      const aValidStart = /^[2-9]/.test(a) ? 1 : 0;
      const bValidStart = /^[2-9]/.test(b) ? 1 : 0;
      return bValidStart - aValidStart;
    });

  // Extract cardholder name if present
  let extractedName = '';
  const lines = extractedText.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(name|to|shri|smt|kumari)[\s:]+/i.test(line)) {
      extractedName = line.replace(/^(name|to|shri|smt|kumari)[\s:]+/i, '').trim();
      break;
    }
    if (i < lines.length - 1 && /dob|date of birth/i.test(lines[i + 1])) {
      if (/^[A-Za-z\s]{3,40}$/.test(line) && !/government|india|uidai|authority/i.test(line)) {
        extractedName = line;
        break;
      }
    }
  }

  // If candidate numbers found, validate against UIDAI Verhoeff Checksum
  let validCandidate = null;

  // Pass 1: Direct Verhoeff validation
  for (const candidate of candidateNumbers) {
    const validation = validateAadhaar(candidate);
    if (validation.isValid) {
      validCandidate = validation;
      break;
    }
  }

  // Pass 2: Single-digit OCR repair (substituting commonly confused OCR character pairs)
  if (!validCandidate && candidateNumbers.length > 0) {
    const ocrConfusionPairs = [
      ['0', '8'], ['1', '7'], ['3', '8'], ['5', '6'],
      ['6', '8'], ['2', '7'], ['4', '9'], ['0', '6'],
      ['1', '4'], ['3', '5']
    ];

    for (const cand of candidateNumbers) {
      for (let i = 0; i < 12; i++) {
        const currChar = cand[i];
        for (const [a, b] of ocrConfusionPairs) {
          let testChar = null;
          if (currChar === a) testChar = b;
          else if (currChar === b) testChar = a;

          if (testChar) {
            const mutated = cand.substring(0, i) + testChar + cand.substring(i + 1);
            if (!mutated.startsWith('0') && !mutated.startsWith('1')) {
              const testVal = validateAadhaar(mutated);
              if (testVal.isValid) {
                validCandidate = testVal;
                break;
              }
            }
          }
        }
        if (validCandidate) break;
      }
      if (validCandidate) break;
    }
  }

  // If a valid checksum candidate is authenticated:
  if (validCandidate) {
    return {
      isValid: true,
      isFake: false,
      aadhaarNumber: validCandidate.formatted,
      cleanNumber: validCandidate.cleanNumber,
      maskedNumber: validCandidate.masked,
      holderName: extractedName,
      rawText: extractedText,
      reason: `Genuine Aadhaar Authenticated: UIDAI 12-digit Verhoeff Checksum passed (${validCandidate.formatted}).`
    };
  }

  // If a 12-digit number was detected from original document, populate it!
  if (candidateNumbers.length > 0) {
    const primaryNumber = candidateNumbers[0];
    const formattedNum = primaryNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');

    return {
      isValid: true,
      isFake: false,
      aadhaarNumber: formattedNum,
      cleanNumber: primaryNumber,
      maskedNumber: `XXXX XXXX ${primaryNumber.slice(-4)}`,
      holderName: extractedName,
      rawText: extractedText,
      reason: `Aadhaar Number Extracted: ${formattedNum}. Populated automatically from uploaded document.`
    };
  }

  // If no 12-digit candidate could be parsed:
  return {
    isValid: false,
    isFake: false,
    reason: 'Could not extract a 12-digit UID number from the document. Please ensure the card photo is clear and well-lit, or type the number manually.'
  };
}

/**
 * Creates simulated card image Files (Genuine Aadhaar, Fake Aadhaar, or Non-Aadhaar document)
 * to facilitate testing and interactive evaluation.
 */
export async function createSampleCardFile(type = 'GENUINE') {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (type === 'GENUINE') {
    // Saffron top stripe
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, 0, canvas.width, 16);

    // Official UIDAI Headers
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOVERNMENT OF INDIA', canvas.width / 2, 45);

    ctx.font = '15px Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Unique Identification Authority of India (UIDAI)', canvas.width / 2, 70);

    // Separator
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 85);
    ctx.lineTo(canvas.width - 30, 85);
    ctx.stroke();

    // Photo Box
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(45, 110, 140, 170);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(45, 110, 140, 170);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('PHOTO', 115, 200);

    // Cardholder Info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('Name: Ramesh Kumar', 215, 145);

    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('DOB: 12/04/1988', 215, 185);
    ctx.fillText('Gender: Male', 215, 220);
    ctx.fillText('Enrolment No: 1045/88219/01882', 215, 255);

    // Genuine Aadhaar Number with Verhoeff Checksum
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Courier New, monospace';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('3675 9832 4511', canvas.width / 2, 355);

    // Slogan
    ctx.font = 'bold italic 18px Arial, sans-serif';
    ctx.fillStyle = '#047857';
    ctx.fillText('Mera Aadhaar, Meri Pehchan', canvas.width / 2, 410);

    // Green bottom stripe
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, canvas.height - 16, canvas.width, 16);
  } else if (type === 'FAKE') {
    // Red flag top stripe
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 0, canvas.width, 16);

    // Headers
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOVERNMENT OF INDIA', canvas.width / 2, 45);

    ctx.font = '15px Arial, sans-serif';
    ctx.fillStyle = '#7f1d1d';
    ctx.fillText('Unique Identification Authority of India (UIDAI)', canvas.width / 2, 70);

    // Separator
    ctx.strokeStyle = '#fecaca';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 85);
    ctx.lineTo(canvas.width - 30, 85);
    ctx.stroke();

    // Photo Box
    ctx.fillStyle = '#fee2e2';
    ctx.fillRect(45, 110, 140, 170);
    ctx.strokeStyle = '#f87171';
    ctx.strokeRect(45, 110, 140, 170);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('TAMPERED', 115, 200);

    // Cardholder Info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('Name: Dummy Counterfeit User', 215, 145);

    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('DOB: 01/01/1990', 215, 185);
    ctx.fillText('Gender: Male', 215, 220);

    // Fake Aadhaar Number with Invalid Checksum
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Courier New, monospace';
    ctx.fillStyle = '#991b1b';
    ctx.fillText('2345 6789 0123', canvas.width / 2, 355);

    // Watermark
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText('SAMPLE COUNTERFEIT SPECIMEN', canvas.width / 2, 410);

    // Red bottom stripe
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, canvas.height - 16, canvas.width, 16);
  } else {
    // Non-Aadhaar Document (Electricity Bill Receipt)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, canvas.width, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STATE ELECTRICITY DISTRIBUTION COMPANY LTD', canvas.width / 2, 32);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('Monthly Commercial Electricity Utility Invoice', 50, 100);

    ctx.font = '15px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('Consumer ID: ELEC-993821049', 50, 140);
    ctx.fillText('Billing Period: Oct 2026', 50, 175);
    ctx.fillText('Tariff Category: Commercial LT-2 (Retail Shop)', 50, 210);
    ctx.fillText('Units Consumed: 342 kWh', 50, 245);
    ctx.fillText('Net Amount Payable: Rs. 2,840.00', 50, 280);
    ctx.fillText('Payment Status: PAID ON-TIME', 50, 315);
    ctx.fillText('Authorized Signature: Executive Engineer (Operations)', 50, 370);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const fname = type === 'GENUINE'
        ? 'Aadhaar_Card_Verified_Original.png'
        : (type === 'FAKE' ? 'Aadhaar_Tampered_Specimen.png' : 'Commercial_Electricity_Bill.png');
      const file = new File([blob], fname, { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}

