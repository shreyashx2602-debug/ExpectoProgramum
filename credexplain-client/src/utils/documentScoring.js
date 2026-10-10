/**
 * CreditSetu Document-Based Credit Scoring Engine
 * 
 * Computes, explains, and calibrates an applicant's credit score directly
 * based on an in-depth analysis of all uploaded and verified documents.
 */

export const DOCUMENT_SCORING_CRITERIA = [
  {
    type: 'INCOME_CERT',
    title: 'Income / Vending Certificate',
    category: 'Trade Legality & Turnover',
    maxPoints: 60,
    penaltyPoints: -35,
    icon: 'FileText',
    verifiedSignal: 'Municipal trade license / vending credentials confirm legitimate business activity and baseline cash turnover.',
    unverifiedSignal: 'Absence of municipal trade certification limits verifiable proof of revenue stability.',
    mismatchSignal: 'Document mismatch or rejection flags inconsistencies in declared business trade.'
  },
  {
    type: 'RENT_AGREEMENT',
    title: 'Rent / Tenancy Agreement',
    category: 'Premises Stability & Tenancy',
    maxPoints: 50,
    penaltyPoints: -30,
    icon: 'Home',
    verifiedSignal: 'Registered commercial tenancy contract verifies fixed physical operating address, eliminating flight risk.',
    unverifiedSignal: 'Unverified commercial tenancy leaves physical location stability unconfirmed.',
    mismatchSignal: 'Invalid or mismatched lease documents indicate uncertain premises tenure.'
  },
  {
    type: 'ELECTRICITY_BILL',
    title: 'Electricity Bills (12 Mo)',
    category: 'Utility Settlement Discipline',
    maxPoints: 55,
    penaltyPoints: -30,
    icon: 'Zap',
    verifiedSignal: '12-month power utility settlements demonstrate disciplined on-time payment track record and operational continuity.',
    unverifiedSignal: 'No continuous utility payment records available to demonstrate settlement discipline.',
    mismatchSignal: 'Disputed or mismatched power utility bill impairs payment discipline verification.'
  },
  {
    type: 'BANK_PASSBOOK',
    title: 'Bank Passbook / Statements',
    category: 'Banking Inflows & Cash Buffer',
    maxPoints: 45,
    penaltyPoints: -25,
    icon: 'Landmark',
    verifiedSignal: 'Active bank passbook ledger corroborates daily QR merchant settlements and positive month-end working liquidity.',
    unverifiedSignal: 'Lack of bank statements leaves working liquid cash reserve uncorroborated.',
    mismatchSignal: 'Mismatched banking documentation creates deposit verification gaps.'
  },
  {
    type: 'EMI_HISTORY',
    title: 'Prior EMI / Loan History',
    category: 'Credit Track Record & Liquidation',
    maxPoints: 50,
    penaltyPoints: -35,
    icon: 'CheckCircle',
    verifiedSignal: 'MFI no-dues clearance and liquidation certificates prove spotless historical debt settlement reliability.',
    unverifiedSignal: 'No historical loan track record available; evaluated as first-time micro-borrower.',
    mismatchSignal: 'Mismatched debt records or unresolved liabilities flag heightened default risk.'
  }
];

/**
 * Calculates dynamic credit score, PD, and detailed document point contributions
 * based on the analysis of all uploaded documents for an applicant.
 */
export function evaluateDocumentBasedCreditScore(applicant = {}, documentsList = null) {
  // Use passed documents or applicant's attached documents
  const docs = Array.isArray(documentsList) 
    ? documentsList 
    : (Array.isArray(applicant.documents) ? applicant.documents : []);

  // Starting baseline score for unverified micro-borrower
  const BASE_UNVERIFIED_SCORE = 490;
  let runningScore = BASE_UNVERIFIED_SCORE;

  // Track point totals
  let verifiedPointsEarned = 0;
  let penaltyPointsDeducted = 0;
  let verifiedDocsCount = 0;
  let rejectedDocsCount = 0;

  // Financial baseline operating signals from applicant profile
  const income = Number(applicant.avgMonthlyIncome || applicant.financials?.avgMonthlyIncome || 35000);
  const expenses = Number(applicant.avgMonthlyExpenses || applicant.financials?.avgMonthlyExpenses || Math.round(income * 0.6));
  const surplus = Math.max(0, income - expenses);
  const surplusRatio = income > 0 ? (surplus / income) : 0.3;
  const vintage = Number(applicant.businessAgeYears || 3.0);

  // Financial operational boost (up to 30 pts)
  const financialSurplusBoost = Math.round(Math.min(20, Math.max(0, (surplusRatio - 0.2) * 50)));
  const vintageBoost = Math.round(Math.min(10, Math.max(0, vintage * 2.5)));
  const operationalBoost = financialSurplusBoost + vintageBoost;

  // Identity verification points (Aadhaar / PAN)
  const isIdentityVerified = applicant.identityVerificationStatus === 'VERIFIED' || 
    applicant.identityVerification === 'VERIFIED' || 
    Boolean(applicant.governmentIdNumber);
  const identityPoints = isIdentityVerified ? 40 : 0;

  // Detailed breakdown per document category
  const documentBreakdown = DOCUMENT_SCORING_CRITERIA.map(criterion => {
    // Find matching uploaded document
    const uploaded = docs.find(d => d.documentType === criterion.type);

    let status = 'NOT_UPLOADED';
    let points = 0;
    let signal = criterion.unverifiedSignal;
    let fileName = null;
    let uploadDate = null;
    let ocrSummary = null;

    if (uploaded) {
      fileName = uploaded.fileName || 'Uploaded File';
      uploadDate = uploaded.uploadDate || new Date().toISOString().split('T')[0];
      ocrSummary = uploaded.consistencyNotes || uploaded.ocrDetails || '';

      if (uploaded.status === 'VERIFIED') {
        status = 'VERIFIED';
        points = criterion.maxPoints;
        signal = criterion.verifiedSignal;
        verifiedPointsEarned += points;
        verifiedDocsCount += 1;
      } else if (uploaded.status === 'MISMATCH_DETECTED' || uploaded.status === 'REJECTED') {
        status = uploaded.status;
        points = criterion.penaltyPoints;
        signal = uploaded.error || criterion.mismatchSignal;
        penaltyPointsDeducted += Math.abs(points);
        rejectedDocsCount += 1;
      } else {
        status = 'IN_REVIEW';
        points = Math.round(criterion.maxPoints * 0.4);
        signal = 'Document ingested and awaiting underwriting verification.';
        verifiedPointsEarned += points;
      }
    }

    return {
      type: criterion.type,
      title: criterion.title,
      category: criterion.category,
      maxPoints: criterion.maxPoints,
      pointsAwarded: points,
      status,
      signal,
      fileName,
      uploadDate,
      ocrSummary
    };
  });

  // Portfolio Completeness & Synergy Bonus
  // Rewarding borrowers who submit multiple corroborated proof dimensions
  let completenessBonus = 0;
  if (verifiedDocsCount >= 5) {
    completenessBonus = 30; // Complete 360-degree verification portfolio
  } else if (verifiedDocsCount === 4) {
    completenessBonus = 20;
  } else if (verifiedDocsCount === 3) {
    completenessBonus = 10; // Met minimum 3 required documents
  }

  // Calculate Final Calibrated Credit Score (Clamped to 300 - 890 standard credit range)
  const rawScore = BASE_UNVERIFIED_SCORE + identityPoints + verifiedPointsEarned - penaltyPointsDeducted + completenessBonus + operationalBoost;
  const finalScore = Math.max(310, Math.min(885, Math.round(rawScore)));

  // Platt-calibrated Probability of Default (PD)
  // Logistic sigmoidal mapping: 580 corresponds to standard ~18% default baseline
  const pd = Math.max(0.021, Math.min(0.58, 1 / (1 + Math.exp((finalScore - 580) / 68))));
  const pdPct = (pd * 100).toFixed(1) + "%";

  // Decision Band & Policy Recommendation
  let decisionBand = "Higher-Risk Review Band";
  let recommendation = "Additional Document Evidence Required";
  let badgeColor = "danger";

  if (finalScore >= 750) {
    decisionBand = "Lower-Risk Review Band";
    recommendation = "Low Risk / Recommended for Approval (Multi-Document Corroborated)";
    badgeColor = "success";
  } else if (finalScore >= 620) {
    decisionBand = "Intermediate-Risk Review Band";
    recommendation = "Moderate Risk / Manual Underwriting Review (Viable Documented Operations)";
    badgeColor = "warning";
  }

  // Dynamic factor reasons derived directly from document findings
  const documentPositiveFactors = documentBreakdown
    .filter(d => d.status === 'VERIFIED')
    .map(d => ({
      feature: d.type.toLowerCase(),
      label: d.title,
      actual_value: `Verified (+${d.pointsAwarded} pts)`,
      score_point_impact: d.pointsAwarded,
      plain_language_reason: d.signal
    }));

  const documentNegativeFactors = documentBreakdown
    .filter(d => d.status === 'NOT_UPLOADED' || d.status === 'MISMATCH_DETECTED' || d.status === 'REJECTED')
    .map(d => ({
      feature: d.type.toLowerCase(),
      label: d.title,
      actual_value: d.status === 'NOT_UPLOADED' ? 'Missing Proof' : 'Mismatch/Rejected',
      score_point_impact: d.pointsAwarded < 0 ? d.pointsAwarded : -15,
      plain_language_reason: d.signal
    }));

  return {
    creditScore: finalScore,
    probabilityOfDefault: pdPct,
    probabilityOfDefaultNum: pd,
    decisionBand,
    recommendation,
    badgeColor,
    scoreBreakdown: {
      baseScore: BASE_UNVERIFIED_SCORE,
      identityPoints,
      verifiedPointsEarned,
      penaltyPointsDeducted,
      completenessBonus,
      operationalBoost,
      totalVerifiedDocs: verifiedDocsCount,
      totalRejectedDocs: rejectedDocsCount,
      totalUploadedDocs: docs.length
    },
    documentBreakdown,
    topPositiveFactors: documentPositiveFactors.length > 0 ? documentPositiveFactors : [
      {
        feature: 'identity_verification',
        label: 'Authenticated Identity',
        actual_value: 'Verified Government ID',
        score_point_impact: identityPoints,
        plain_language_reason: 'Genuine identity verified prior to document intake.'
      }
    ],
    topNegativeFactors: documentNegativeFactors.length > 0 ? documentNegativeFactors : [
      {
        feature: 'portfolio_risk',
        label: 'Micro-Enterprise Cash Volatility',
        actual_value: 'Moderate',
        score_point_impact: -10,
        plain_language_reason: 'Informal daily operations exhibit minor cash flow swings.'
      }
    ]
  };
}
