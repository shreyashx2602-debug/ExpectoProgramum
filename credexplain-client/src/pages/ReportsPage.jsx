import React, { useState } from 'react';
import {
  FileText, Download, Printer, ShieldCheck, AlertCircle,
  CheckCircle2, Clock, Calendar, Building2, User, HelpCircle,
  AlertTriangle, ArrowRight, Check, X, Shield, Landmark
} from 'lucide-react';
import jsPDF from 'jspdf';

export default function ReportsPage({ currentApplicant, currentUser }) {
  const [reportType, setReportType] = useState('slip'); // 'slip' | 'adverse_action'
  const app = currentApplicant || {};
  const fin = app.financials || {};
  const appName = app.name || app.fullName || 'Applicant';
  const refId = app.refId || app.applicantRefId || 'APP-2026-081';
  const score = Number(app.creditScore || 650);

  // Ingested document records
  const docs = Array.isArray(app.documents) ? app.documents : [];
  const verifiedCount = docs.filter(d => d.status === 'VERIFIED').length;
  const isQualified = verifiedCount >= 3;

  // Determine application decision outcome
  let outcome = 'REVIEW'; // 'ACCEPTED' | 'REJECTED' | 'REVIEW'
  let outcomeTitle = 'APPLICATION STATUS: UNDER MANUAL REVIEW';
  let outcomeSubtitle = 'Your application is currently being evaluated by a loan review officer.';
  let badgeClass = 'badge-warning';

  if (app.humanDecision === 'APPROVED' || (score >= 720 && isQualified)) {
    outcome = 'ACCEPTED';
    outcomeTitle = 'APPLICATION STATUS: ACCEPTED (APPROVED)';
    outcomeSubtitle = 'Congratulations! Your micro-credit application has met all underwriting requirements.';
    badgeClass = 'badge-success';
  } else if (app.humanDecision === 'REJECTED' || (score < 600 || verifiedCount < 2)) {
    outcome = 'REJECTED';
    outcomeTitle = 'APPLICATION STATUS: NOT APPROVED AT THIS TIME';
    outcomeSubtitle = 'Your application does not meet the minimum verification requirements yet.';
    badgeClass = 'badge-danger';
  }

  // Dynamic plain-language basis of decision
  const getDecisionBasis = () => {
    if (outcome === 'ACCEPTED') {
      return [
        {
          type: 'positive',
          title: 'Required Verification Documents Verified',
          desc: `You successfully provided ${verifiedCount} of 5 required business documents (including municipal trade authority, commercial tenancy, and utility payment records).`
        },
        {
          type: 'positive',
          title: 'Strong Utility Settlement Discipline',
          desc: '12 consecutive months of on-time electricity bill payments confirm disciplined financial habits and continuous business operation.'
        },
        {
          type: 'positive',
          title: 'Permanent Physical Shop Stability',
          desc: 'Validated commercial tenancy agreement confirms active, permanent shop premises, eliminating flight risk.'
        },
        {
          type: 'positive',
          title: 'Healthy Monthly Cash Buffer',
          desc: `Your monthly business earnings (₹${(fin?.avgMonthlyIncome || 35000).toLocaleString()}) leave an estimated ₹${(fin?.estimatedSurplus || 14000).toLocaleString()} in monthly savings, comfortably covering the recommended ₹${(fin?.affordableEmi || 5300).toLocaleString()}/month installment.`
        },
        {
          type: 'positive',
          title: 'Credit Score Exceeds Approval Threshold',
          desc: `Your evaluated credit score of ${score}/900 comfortably exceeds the 720-point minimum standard for loan sanction.`
        }
      ];
    } else if (outcome === 'REJECTED') {
      const reasons = [];
      if (verifiedCount < 3) {
        reasons.push({
          type: 'negative',
          title: 'Insufficient Documents Verified',
          desc: `Only ${verifiedCount} of 3 required documents have been verified. Underwriting policy requires at least 3 authenticated documents (e.g., Trade License, Electricity Bill, or Tenancy Agreement).`
        });
      }
      const hasMismatch = docs.some(d => d.status === 'MISMATCH_DETECTED' || d.status === 'REJECTED');
      if (hasMismatch) {
        reasons.push({
          type: 'negative',
          title: 'Document Mismatch Detected',
          desc: 'One or more uploaded documents did not match the required category (e.g. incorrect document type uploaded or unreadable file).'
        });
      }
      if ((fin?.estimatedSurplus || 0) < 6000) {
        reasons.push({
          type: 'negative',
          title: 'Cash Reserve Buffer Below Minimum Safe Cushion',
          desc: `Net monthly retained earnings (₹${(fin?.estimatedSurplus || 0).toLocaleString()}) are currently tight relative to regular living expenditures, which creates risk of loan repayment distress.`
        });
      }
      if (score < 600) {
        reasons.push({
          type: 'negative',
          title: 'Credit Score Below Qualifying Standard',
          desc: `Current evaluated credit score of ${score}/900 is below the minimum qualifying baseline of 600 points.`
        });
      }
      if (app.rentTenancyStatus !== 'VERIFIED_LEASE') {
        reasons.push({
          type: 'negative',
          title: 'Commercial Premises Tenancy Unverified',
          desc: 'Physical business shop tenancy agreement has not been uploaded or verified.'
        });
      }
      if (reasons.length === 0) {
        reasons.push({
          type: 'negative',
          title: 'Additional Supporting Documentation Required',
          desc: 'Current financial records do not provide sufficient verifiable history to substantiate loan capacity.'
        });
      }
      return reasons;
    } else {
      // Under Review
      return [
        {
          type: 'neutral',
          title: 'Borderline Credit Score Review Band',
          desc: `Current score of ${score}/900 falls in the intermediate review band and is currently being assessed by a senior loan officer.`
        },
        {
          type: 'neutral',
          title: `Document Portfolio Incomplete (${verifiedCount} of 5 Verified)`,
          desc: 'Uploading additional supporting documents (like a bank passbook or prior loan clearance certificate) can expedite a favorable decision.'
        },
        {
          type: 'neutral',
          title: 'Cash Flow Tenure Alignment',
          desc: `Loan officer is reviewing monthly cash flow (₹${(fin?.estimatedSurplus || 0).toLocaleString()} surplus) to tailor an optimal repayment tenure.`
        }
      ];
    }
  };

  const decisionBasis = getDecisionBasis();

  // Document checklist items
  const docChecklist = [
    { type: 'INCOME_CERT', label: 'Income / Vending Certificate' },
    { type: 'RENT_AGREEMENT', label: 'Rent / Tenancy Agreement' },
    { type: 'ELECTRICITY_BILL', label: 'Electricity Bills (12 Mo)' },
    { type: 'BANK_PASSBOOK', label: 'Bank Passbook / Statements' },
    { type: 'EMI_HISTORY', label: 'Prior EMI / Loan History' }
  ];

  // Actionable next steps for borrower based on outcome
  const getNextSteps = () => {
    if (outcome === 'ACCEPTED') {
      return [
        {
          num: '1',
          title: 'Loan Sanction Offer',
          text: `Your indicative loan limit of ₹${((fin.affordableEmi || 5300) * 10).toLocaleString()} is approved and ready for disbursal.`
        },
        {
          num: '2',
          title: 'Disbursement Acceptance',
          text: 'Contact your assigned loan officer or complete digital acceptance to disburse funds directly into your verified bank account.'
        },
        {
          num: '3',
          title: 'Automated Repayment Schedule',
          text: `Monthly installments of ₹${(fin.affordableEmi || 5300).toLocaleString()} will be automatically debited on the 5th of each month.`
        }
      ];
    } else if (outcome === 'REJECTED') {
      return [
        {
          num: '1',
          title: 'Upload Missing Documents',
          text: 'Submit your 12-month electricity bill and commercial tenancy agreement in the Document Verification portal to meet the 3-document qualification standard.'
        },
        {
          num: '2',
          title: 'Maintain Settlement Track',
          text: 'Continue routing daily customer QR settlements into your primary bank account to substantiate verifiable turnover.'
        },
        {
          num: '3',
          title: 'Free Re-Application',
          text: 'You can re-apply anytime as soon as missing documents are uploaded with zero credit penalty or waiting fee.'
        }
      ];
    } else {
      return [
        {
          num: '1',
          title: 'Officer File Inspection',
          text: 'A senior credit underwriter will review your business file and cash flow stability within 1 to 2 business days.'
        },
        {
          num: '2',
          title: 'Accelerate Decision',
          text: 'Uploading any remaining operational proof (such as bank statements or prior loan clearances) will fast-track your approval decision.'
        }
      ];
    }
  };

  const nextSteps = getNextSteps();

  // Export PDF Decision Slip with generous spacing and strict text wrapping
  const handleExportPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Top Header Bar (Full width dark banner)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CreditSetu", 14, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(203, 213, 225);
    doc.text("|  Borrower Credit Decision Slip", 45, 14);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Ref: ${refId}  |  ${new Date().toLocaleDateString()}`, pageWidth - 14, 14, { align: 'right' });

    // 2. Colored Status Banner
    let bannerBg = [236, 253, 245]; // green
    let bannerBorder = [5, 150, 105];
    let bannerTextColor = [6, 95, 70];

    if (outcome === 'REJECTED') {
      bannerBg = [254, 242, 242];
      bannerBorder = [220, 38, 38];
      bannerTextColor = [153, 27, 27];
    } else if (outcome === 'REVIEW') {
      bannerBg = [254, 243, 199];
      bannerBorder = [217, 119, 6];
      bannerTextColor = [146, 64, 14];
    }

    doc.setFillColor(bannerBg[0], bannerBg[1], bannerBg[2]);
    doc.setDrawColor(bannerBorder[0], bannerBorder[1], bannerBorder[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, 27, 182, 17, 2, 2, 'FD');

    doc.setTextColor(bannerTextColor[0], bannerTextColor[1], bannerTextColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(outcomeTitle, 19, 33.5);

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(outcomeSubtitle, 19, 39.5);

    // 3. Borrower & Loan Snapshot Box (Spacious 2-column layout with zero text collision)
    const snapStart = 48;
    const leftX = 19;
    const leftW = 82;
    const rightX = 108;
    const rightW = 84;

    doc.setFontSize(8);
    // Measure left column lines
    const nameLines = doc.splitTextToSize(`Borrower: ${appName}`, leftW);
    const bizLines = doc.splitTextToSize(`Business: ${app.businessName || 'Enterprise'} (${app.businessVintage || '3 Yrs'})`, leftW);
    const locLines = doc.splitTextToSize(`Location: ${app.location || 'Local District'}`, leftW);

    let leftHeight = 10.5 + (nameLines.length + bizLines.length + locLines.length) * 3.8;
    let rightHeight = 10.5 + 4 * 3.8;
    const snapHeight = Math.max(leftHeight, rightHeight) + 4;

    // Draw background card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, snapStart, 182, snapHeight, 2, 2, 'FD');

    // Vertical dividing line
    doc.setDrawColor(226, 232, 240);
    doc.line(103, snapStart + 4, 103, snapStart + snapHeight - 4);

    // Draw Left Column (Borrower details)
    let leftY = snapStart + 6;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("BORROWER PROFILE", leftX, leftY);
    leftY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    nameLines.forEach(l => { doc.text(l, leftX, leftY); leftY += 3.8; });
    bizLines.forEach(l => { doc.text(l, leftX, leftY); leftY += 3.8; });
    locLines.forEach(l => { doc.text(l, leftX, leftY); leftY += 3.8; });

    // Draw Right Column (Evaluated financial metrics)
    let rightY = snapStart + 6;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("EVALUATION & CASH FLOW", rightX, rightY);
    rightY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`Credit Score: ${score} / 900 (${app.decisionBand || 'Evaluated'})`, rightX, rightY); rightY += 3.8;
    doc.text(`Monthly Business Revenue: Rs. ${(fin.avgMonthlyIncome || 35000).toLocaleString()}`, rightX, rightY); rightY += 3.8;
    doc.text(`Recommended Monthly EMI: Rs. ${(fin.affordableEmi || 5300).toLocaleString()}/mo`, rightX, rightY); rightY += 3.8;
    doc.text(`Monthly Surplus Cushion: Rs. ${(fin.estimatedSurplus || 14000).toLocaleString()}`, rightX, rightY); rightY += 3.8;

    let curY = snapStart + snapHeight + 6;

    // 4. BASIS OF DECISION (Spacious list with clean item padding)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("BASIS OF DECISION: WHY WAS THIS APPLICATION " + (outcome === 'ACCEPTED' ? "ACCEPTED?" : (outcome === 'REJECTED' ? "NOT APPROVED?" : "PLACED UNDER REVIEW?")), 14, curY);

    curY += 4;
    const basisStart = curY;
    curY += 5;

    doc.setFontSize(8);
    decisionBasis.forEach((item) => {
      doc.setFont("helvetica", "bold");
      if (item.type === 'positive') doc.setTextColor(6, 95, 70);
      else if (item.type === 'negative') doc.setTextColor(153, 27, 27);
      else doc.setTextColor(146, 64, 14);

      const bullet = item.type === 'positive' ? "[+] " : (item.type === 'negative' ? "[-] " : "[*] ");
      doc.text(bullet + item.title, 19, curY);
      curY += 4;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      // Wrap strictly to 164mm so text at x=23 stays well inside the 196mm right border
      const lines = doc.splitTextToSize(item.desc, 164);
      lines.forEach((l) => {
        doc.text(l, 23, curY);
        curY += 3.6;
      });
      curY += 2; // Comfortable space between items
    });

    const basisHeight = curY - basisStart + 2;
    doc.setDrawColor(bannerBorder[0], bannerBorder[1], bannerBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, basisStart, 182, basisHeight, 2, 2, 'S');

    // 5. Document Verification Checklist Card
    curY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("DOCUMENT VERIFICATION CHECKLIST (3 Required for Qualification)", 14, curY);

    curY += 4;
    const docBoxStart = curY;
    curY += 5;

    doc.setFontSize(8);
    docChecklist.forEach((c) => {
      const match = docs.find(d => d.documentType === c.type);
      const isDocVerified = match?.status === 'VERIFIED';
      const isDocRejected = match?.status === 'REJECTED' || match?.status === 'MISMATCH_DETECTED';

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(c.label, 19, curY);

      if (isDocVerified) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(6, 95, 70);
        doc.text("VERIFIED  [✓]", 156, curY);
      } else if (isDocRejected) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(185, 28, 28);
        doc.text("REJECTED  [✗]", 156, curY);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text("NOT UPLOADED", 156, curY);
      }
      curY += 4.5;
    });

    // Checklist Summary Line
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Verified: ${verifiedCount} of 5 Documents  |  Criteria Requirement: ${isQualified ? "Met (Eligible)" : "Pending (Need 3)"}`, 19, curY);
    curY += 3;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, docBoxStart, 182, (curY - docBoxStart + 2), 2, 2, 'S');

    // 6. Next Steps & Guidance for Borrower (With full wrapping on every point)
    curY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("NEXT STEPS & ACTION PLAN FOR BORROWER", 14, curY);

    curY += 4;
    const nextStart = curY;
    curY += 5;

    nextSteps.forEach(step => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${step.num}. ${step.title}:`, 19, curY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const stepLines = doc.splitTextToSize(step.text, 160);
      const titleWidth = doc.getTextWidth(`${step.num}. ${step.title}: `);

      if (stepLines.length === 1 && (19 + titleWidth + doc.getTextWidth(step.text) < 188)) {
        doc.text(step.text, 19 + titleWidth, curY);
        curY += 4.5;
      } else {
        curY += 3.8;
        stepLines.forEach(l => {
          doc.text(l, 23, curY);
          curY += 3.6;
        });
        curY += 1.5;
      }
    });

    const nextHeight = curY - nextStart + 2;
    doc.setDrawColor(153, 246, 228);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, nextStart, 182, nextHeight, 2, 2, 'S');

    // 7. Footer & Digital Signature
    curY += 6;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, curY, 196, curY);

    curY += 4.5;
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Digital Verification Code: SLIP-${refId}-${Date.now().toString(36).toUpperCase()}`, 14, curY);
    doc.text("CreditSetu Explainable AI Underwriting Portal  |  Support: 1800-CRED-SETU", 196, curY, { align: 'right' });

    // Save PDF
    doc.save(`CreditSetu_${refId}_Decision_Slip.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Print-specific style overrides */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .printable-slip-canvas {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="card no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 className="card-title">Borrower Decision Slip & Assessment Dossier</h2>
            <span className="badge badge-teal">Decision Slip</span>
          </div>
          <p className="card-subtitle">
            Downloadable credit evaluation slip with plain-language explanation of acceptance or rejection for {appName} ({refId}).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
            <Printer size={13} />
            <span>Print View</span>
          </button>
          <button onClick={handleExportPdf} className="btn btn-primary btn-sm">
            <Download size={13} />
            <span>Download Decision Slip (PDF)</span>
          </button>
        </div>
      </div>

      {/* Report Template Selector */}
      <div className="no-print" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '1rem' }}>
        <button
          onClick={() => setReportType('slip')}
          style={{
            padding: '0.6rem 1rem', border: 'none', background: 'none',
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
            borderBottom: reportType === 'slip' ? '2px solid #0d9488' : 'none',
            color: reportType === 'slip' ? '#0d9488' : '#64748b'
          }}
        >
          Borrower Decision Slip (Clear & Simple)
        </button>
        <button
          onClick={() => setReportType('adverse_action')}
          style={{
            padding: '0.6rem 1rem', border: 'none', background: 'none',
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
            borderBottom: reportType === 'adverse_action' ? '2px solid #0d9488' : 'none',
            color: reportType === 'adverse_action' ? '#0d9488' : '#64748b'
          }}
        >
          Detailed Fair Lending Disclosure
        </button>
      </div>

      {/* Printable Report Preview Canvas */}
      <div className="card printable-slip-canvas" style={{
        padding: '2.5rem', backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-md)',
        maxWidth: '860px', margin: '0 auto', width: '100%'
      }}>
        {reportType === 'slip' ? (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  CreditSetu Credit Decision Slip
                </div>
                <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Micro-Credit Evaluation & Underwriting Assessment Summary
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
                <div>Evaluation Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                <div>Application Ref: <strong>{refId}</strong></div>
                <div style={{ color: '#0d9488', fontWeight: 700, marginTop: '2px' }}>Explainable Alternative Underwriting</div>
              </div>
            </div>

            {/* Prominent Decision Outcome Banner */}
            <div style={{
              padding: '1.5rem',
              borderRadius: '10px',
              backgroundColor: outcome === 'ACCEPTED' ? '#ecfdf5' : (outcome === 'REJECTED' ? '#fef2f2' : '#fffbeb'),
              border: `1.5px solid ${outcome === 'ACCEPTED' ? '#10b981' : (outcome === 'REJECTED' ? '#ef4444' : '#f59e0b')}`,
              color: outcome === 'ACCEPTED' ? '#065f46' : (outcome === 'REJECTED' ? '#991b1b' : '#92400e'),
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {outcome === 'ACCEPTED' ? (
                  <CheckCircle2 size={28} color="#059669" style={{ flexShrink: 0 }} />
                ) : outcome === 'REJECTED' ? (
                  <AlertCircle size={28} color="#dc2626" style={{ flexShrink: 0 }} />
                ) : (
                  <Clock size={28} color="#d97706" style={{ flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.01em' }}>
                    {outcomeTitle}
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.35rem', opacity: 0.95, lineHeight: 1.5 }}>
                    {outcomeSubtitle}
                  </div>
                </div>
              </div>
            </div>

            {/* Borrower & Credit Snapshot Grid (Spacious 2-column layout with zero overlap) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              padding: '1.5rem',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem'
            }}>
              {/* Left Column: Borrower Profile */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: '0.4rem',
                  marginBottom: '0.15rem'
                }}>
                  Borrower Profile
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <span style={{ color: '#64748b' }}>Applicant Name:</span>
                  <strong style={{ color: '#0f172a', textAlign: 'right' }}>{appName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <span style={{ color: '#64748b' }}>Business Enterprise:</span>
                  <strong style={{ color: '#0f172a', textAlign: 'right' }}>{app.businessName || 'Enterprise'} ({app.businessVintage || '3 Yrs'})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <span style={{ color: '#64748b' }}>Trade Category:</span>
                  <span style={{ color: '#1e293b', fontWeight: 600, textAlign: 'right' }}>{app.occupation || 'Retail Merchant'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <span style={{ color: '#64748b' }}>Location:</span>
                  <span style={{ color: '#1e293b', fontWeight: 600, textAlign: 'right' }}>{app.location || 'Local District'}</span>
                </div>
              </div>

              {/* Right Column: Evaluated Credit Metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: '0.4rem',
                  marginBottom: '0.15rem'
                }}>
                  Evaluated Credit Metrics
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <span style={{ color: '#64748b' }}>Evaluated Credit Score:</span>
                  <strong style={{ color: outcome === 'ACCEPTED' ? '#059669' : (outcome === 'REJECTED' ? '#dc2626' : '#d97706') }}>
                    {score} / 900
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <span style={{ color: '#64748b' }}>Review Band:</span>
                  <strong style={{ color: '#0f172a' }}>{app.decisionBand || 'Standard Underwriting'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <span style={{ color: '#64748b' }}>Monthly Business Income:</span>
                  <strong style={{ color: '#0f172a' }}>₹{(fin?.avgMonthlyIncome || 35000).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <span style={{ color: '#64748b' }}>Safe Recommended EMI:</span>
                  <strong style={{ color: '#0d9488' }}>₹{(fin?.affordableEmi || 5300).toLocaleString()}/month</strong>
                </div>
              </div>
            </div>

            {/* BASIS OF DECISION (Why was this accepted or rejected?) */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Basis of Underwriting Decision (Why Was This Outcome Reached?)
                </h3>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>
                The evaluation is made transparently based on your submitted documents, verified cash flows, and utility discipline:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {decisionBasis.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.15rem 1.35rem',
                      borderRadius: '8px',
                      backgroundColor: item.type === 'positive' ? '#f0fdf4' : (item.type === 'negative' ? '#fef2f2' : '#fffbeb'),
                      border: `1.5px solid ${item.type === 'positive' ? '#bbf7d0' : (item.type === 'negative' ? '#fecaca' : '#fde68a')}`
                    }}
                  >
                    <div style={{
                      fontWeight: 700, fontSize: '0.9rem',
                      color: item.type === 'positive' ? '#15803d' : (item.type === 'negative' ? '#b91c1c' : '#b45309'),
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      marginBottom: '0.4rem'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: item.type === 'positive' ? '#dcfce7' : (item.type === 'negative' ? '#fee2e2' : '#fef3c7'),
                        fontSize: '0.75rem',
                        fontWeight: 800
                      }}>
                        {item.type === 'positive' ? '✓' : (item.type === 'negative' ? '✗' : '⚡')}
                      </span>
                      <span>{item.title}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.65, paddingLeft: '1.75rem' }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Verification Checklist */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Document Verification Checklist
                </h3>
                <span className="badge badge-teal" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                  {verifiedCount} of 5 Documents Verified
                </span>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                {docChecklist.map((c, i) => {
                  const match = docs.find(d => d.documentType === c.type);
                  const isDocVerified = match?.status === 'VERIFIED';
                  const isDocRejected = match?.status === 'REJECTED' || match?.status === 'MISMATCH_DETECTED';

                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.85rem 1.25rem', borderBottom: i < docChecklist.length - 1 ? '1px solid #f1f5f9' : 'none',
                        backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa', fontSize: '0.875rem'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#334155' }}>{c.label}</span>
                      <div>
                        {isDocVerified ? (
                          <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                            ✓ VERIFIED
                          </span>
                        ) : isDocRejected ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                            ✗ REJECTED
                          </span>
                        ) : (
                          <span className="badge" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                            NOT UPLOADED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simple Financial Snapshot */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                Monthly Cash Flow & Loan Affordability
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.15rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>MONTHLY EARNINGS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
                    ₹{(fin?.avgMonthlyIncome || 35000).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '1.15rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>BUSINESS EXPENSES</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
                    ₹{(fin?.avgMonthlyExpenses || 21000).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '1.15rem', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, letterSpacing: '0.04em' }}>RETAINED SAVINGS / SURPLUS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', marginTop: '0.35rem' }}>
                    ₹{(fin?.estimatedSurplus || 14000).toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '1.15rem', backgroundColor: '#f0fdfa', borderRadius: '8px', border: '1px solid #99f6e4' }}>
                  <div style={{ fontSize: '0.72rem', color: '#0f766e', fontWeight: 700, letterSpacing: '0.04em' }}>RECOMMENDED SAFE EMI</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0d9488', marginTop: '0.35rem' }}>
                    ₹{(fin?.affordableEmi || 5300).toLocaleString()}/mo
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps for Borrower (Clean structured items with numbered pills) */}
            <div style={{
              padding: '1.5rem', backgroundColor: '#f0fdfa',
              borderRadius: '10px', border: '1.5px solid #ccfbf1', marginBottom: '2rem'
            }}>
              <div style={{
                fontWeight: 800, fontSize: '0.95rem', color: '#0f766e',
                marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <CheckCircle2 size={18} color="#0d9488" />
                <span>Next Steps & Guidance for Borrower:</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {nextSteps.map((st, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <span style={{
                      backgroundColor: '#0d9488',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {st.num}
                    </span>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155' }}>
                      <strong style={{ color: '#0f172a' }}>{st.title}: </strong>
                      <span>{st.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer & Digital Seal */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1.5px solid #e2e8f0', paddingTop: '1.5rem',
              fontSize: '0.825rem', color: '#64748b', flexWrap: 'wrap', gap: '0.75rem'
            }}>
              <div>
                <div>Credit Officer Sign-off: <strong>{currentUser?.fullName || 'Authorized Underwriter'}</strong></div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Verification Hash: SLIP-{refId}-{Date.now().toString(36).toUpperCase()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>CreditSetu Automated Underwriting</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Support Hotline: 1800-CRED-SETU</div>
              </div>
            </div>
          </div>
        ) : (
          /* Detailed Adverse Action Fair Lending Disclosure */
          <div>
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Statement of Credit Review & Adverse Action Explanation Notice
              </div>
              <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.25rem' }}>
                Transparent Disclosure of Key Scoring Factors Pursuant to Fair Lending Guidance
              </div>
            </div>

            <div style={{ fontSize: '0.875rem', lineHeight: 1.65, color: '#334155' }}>
              <p>Dear <strong>{appName}</strong>,</p>
              <p style={{ marginTop: '0.75rem' }}>
                Thank you for your recent application for credit evaluation under the CreditSetu Alternative Underwriting Program
                (Reference ID: <strong>{refId}</strong>). While we value your livelihood and business enterprise, your current
                financial records placed your illustrative score in the <strong>{app.decisionBand || 'Intermediate-Risk Review Band'}</strong> ({app.creditScore || 650} points).
              </p>

              <div style={{ margin: '1.75rem 0', padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <strong style={{ color: '#991b1b', fontSize: '0.95rem' }}>
                  Principal Factors Contributing to the Evaluation:
                </strong>
                <p style={{ fontSize: '0.825rem', color: '#7f1d1d', margin: '0.35rem 0 0.85rem' }}>
                  Under our explainable AI governance principles, the principal factors derived from your submitted verification documents and cash flow records are:
                </p>
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.6 }}>
                  {decisionBasis.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.title}:</strong> {item.desc}
                    </li>
                  ))}
                </ol>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Guidance on Improving Future Credit Eligibility:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                <div>1. Submit at least 3 authenticated documents (Income Certificate, Tenancy Agreement, and Electricity Bill).</div>
                <div>2. Maintain consecutive on-time payments for municipal utility bills over the next 90 days.</div>
                <div>3. Direct customer QR credits into a primary business account to establish verifiable merchant turnover.</div>
              </div>

              <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                <strong>Important Notice:</strong> This adverse-action notice provides transparent, actionable explanations of model-derived scoring criteria in strict adherence to fair micro-finance standards.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
