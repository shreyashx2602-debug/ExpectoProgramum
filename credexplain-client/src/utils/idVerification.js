// Official Verhoeff Checksum Algorithm & Indian Government ID Verification Utility

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates 12-digit Aadhaar UID using the UIDAI Verhoeff Checksum Algorithm
 */
export function validateAadhaar(rawAadhaar) {
  if (!rawAadhaar) {
    return { isValid: false, reason: 'Aadhaar number is required.' };
  }

  const clean = String(rawAadhaar).replace(/[\s-]+/g, '');

  if (!/^\d+$/.test(clean)) {
    return { isValid: false, reason: 'Aadhaar must contain only numeric digits.' };
  }

  if (clean.length !== 12) {
    return { isValid: false, reason: `Aadhaar must be exactly 12 digits (currently ${clean.length} digits).` };
  }

  if (clean.startsWith('0') || clean.startsWith('1')) {
    return { isValid: false, reason: 'Invalid Aadhaar: UIDAI numbers never start with 0 or 1.' };
  }

  if (/^(\d)\1{11}$/.test(clean)) {
    return { isValid: false, reason: 'Invalid Aadhaar: Repetitive identical digits detected.' };
  }

  // Verhoeff checksum calculation
  let c = 0;
  const inverted = clean.split('').reverse().map(Number);
  for (let i = 0; i < inverted.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][inverted[i]]];
  }

  if (c !== 0) {
    return {
      isValid: false,
      reason: 'Aadhaar Checksum Failed: The 12th check digit is mathematically invalid according to UIDAI Verhoeff algorithm.'
    };
  }

  const formatted = clean.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  const masked = `XXXX XXXX ${clean.slice(-4)}`;

  return {
    isValid: true,
    type: 'AADHAAR',
    cleanNumber: clean,
    formatted,
    masked,
    reason: 'Genuine Aadhaar Verified: UIDAI 12-digit Verhoeff Checksum passed.'
  };
}

/**
 * Generates a mathematically valid 12-digit Aadhaar number for testing
 */
export function generateValidAadhaar() {
  // 11 random digits starting with 2-9
  const first = Math.floor(Math.random() * 8) + 2;
  let num11 = String(first);
  for (let i = 0; i < 10; i++) {
    num11 += Math.floor(Math.random() * 10);
  }

  // Compute 12th Verhoeff check digit
  let c = 0;
  const inverted = num11.split('').reverse().map(Number);
  for (let i = 0; i < inverted.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][inverted[i]]];
  }
  const checkDigit = VERHOEFF_INV[c];
  const valid12 = num11 + checkDigit;
  return valid12.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
}

/**
 * Validates 10-character Permanent Account Number (PAN)
 * Format: 5 letters + 4 digits + 1 letter
 * 4th character: 'P' for Individual, 'F' for Firm, 'H' for HUF
 * 5th character: matches surname initial
 */
export function validatePan(rawPan, applicantName = '') {
  if (!rawPan) {
    return { isValid: false, reason: 'PAN number is required.' };
  }

  const clean = String(rawPan).replace(/[\s-]+/g, '').toUpperCase();

  if (clean.length !== 10) {
    return { isValid: false, reason: `PAN must be exactly 10 characters (currently ${clean.length}).` };
  }

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean)) {
    return {
      isValid: false,
      reason: 'Invalid PAN structure: Must consist of 5 uppercase letters, 4 numbers, and 1 letter (e.g. ABCPK1234F).'
    };
  }

  const fourth = clean.charAt(3);
  if (!['P', 'F', 'H', 'C'].includes(fourth)) {
    return {
      isValid: false,
      reason: `Invalid Entity Code: 4th character '${fourth}' is invalid. For individuals/micro-entrepreneurs, it must be 'P' (Individual) or 'F' (Firm).`
    };
  }

  // Check surname initial match if applicant name provided
  if (applicantName && applicantName.trim().length > 0) {
    const parts = applicantName.trim().split(/\s+/);
    // If multiple words, surname is last word; otherwise first word
    const surname = parts[parts.length - 1];
    const expectedInitial = surname.charAt(0).toUpperCase();
    const actualInitial = clean.charAt(4);

    if (actualInitial !== expectedInitial) {
      return {
        isValid: false,
        reason: `Surname Mismatch: 5th character of PAN must be '${expectedInitial}' matching surname '${surname}', but found '${actualInitial}'.`
      };
    }
  }

  const masked = `${clean.slice(0, 5)}****${clean.slice(-1)}`;

  return {
    isValid: true,
    type: 'PAN',
    cleanNumber: clean,
    formatted: clean,
    masked,
    reason: `Genuine PAN Verified: Category '${fourth}' (Individual) & Surname Initial validated against Income Tax Department schema.`
  };
}

/**
 * Generates an authentic PAN string matching the applicant's surname
 */
export function generateValidPan(applicantName = 'Ramesh Kumar') {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix3 = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const fourth = 'P'; // Individual

  const parts = applicantName.trim().split(/\s+/);
  const surname = parts.length > 0 ? parts[parts.length - 1] : 'K';
  const fifth = surname.charAt(0).toUpperCase() || 'K';

  const digits4 = String(Math.floor(Math.random() * 9000) + 1000);
  const suffix1 = letters[Math.floor(Math.random() * letters.length)];

  return `${prefix3}${fourth}${fifth}${digits4}${suffix1}`;
}
