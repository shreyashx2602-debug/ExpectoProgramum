import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, AlertTriangle, AlertCircle, TrendingUp, Info,
  CheckCircle2, ArrowRight, Upload, FileText, Home, Zap,
  Landmark, Award, Shield, FileCheck, X, Eye, Sparkles
} from 'lucide-react';
import RiskScoreGauge from '../components/RiskScoreGauge';
import { evaluateDocumentBasedCreditScore } from '../utils/documentScoring';

export default function CreditScoring({ currentApplicant, onNavigateTab }) {
  const [selectedInspectionDoc, setSelectedInspectionDoc] = useState(null);
  const app = currentApplicant || {};
  const appName = app.name || app.fullName || 'Applicant';
  const refId = app.refId || app.applicantRefId || 'APP-2026-081';

  // Compute dynamic credit score and attribution strictly based on all uploaded documents
  const scoringAnalysis = useMemo(() => {
    return evaluateDocumentBasedCreditScore(app, app.documents || []);
  }, [app, app.documents]);

  const {
    creditScore,
    probabilityOfDefault,
    decisionBand,
    recommendation,
    scoreBreakdown,
    documentBreakdown
  } = scoringAnalysis;

  const isQualified = scoreBreakdown.totalVerifiedDocs >= 3;

  // Icon mapping helper
  const getDocIcon = (type) => {
    switch (type) {
      case 'INCOME_CERT': return <FileText size={18} color="#0d9488" />;
      case 'RENT_AGREEMENT': return <Home size={18} color="#2563eb" />;
      case 'ELECTRICITY_BILL': return <Zap size={18} color="#d97706" />;
      case 'BANK_PASSBOOK': return <Landmark size={18} color="#7c3aed" />;
      case 'EMI_HISTORY': return <Award size={18} color="#059669" />;
      default: return <FileCheck size={18} color="#64748b" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 className="card-title">Document-Driven Calibrated Credit Scoring</h2>
            <span className="badge badge-teal">Document Analysis Engine</span>
          </div>
          <p className="card-subtitle">
            Illustrative creditworthiness scoring for {appName} ({refId}) dynamically derived from OCR analysis, verification checks, and behavioral signals across all uploaded documents.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge badge-info">
            {scoreBreakdown.totalVerifiedDocs} / 5 Documents Verified
          </span>
          <span className={`badge ${scoreBreakdown.verifiedPointsEarned > 0 ? 'badge-success' : 'badge-warning'}`}>
            +{scoreBreakdown.verifiedPointsEarned} Evidence Pts
          </span>
          {isQualified ? (
            <span className="badge badge-success">✓ Criteria Met (3+ Verified)</span>
          ) : (
            <span className="badge badge-warning">Criteria Pending ({3 - scoreBreakdown.totalVerifiedDocs} needed)</span>
          )}
        </div>
      </div>

      {/* Qualification Alert Banner */}
      {!isQualified ? (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '8px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Underwriting Verification Criteria Pending ({scoreBreakdown.totalVerifiedDocs} / 3 Documents Verified)
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#b45309' }}>
                Credit line approval requires at least 3 verified operational documents. Upload remaining documents in the verification portal to unlock full underwriting eligibility and boost the credit score.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('documents')}
            className="btn btn-primary btn-sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            <Upload size={14} />
            <span>Upload Documents Now</span>
          </button>
        </div>
      ) : (
        <div style={{
          padding: '0.9rem 1.25rem',
          borderRadius: '8px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color="#047857" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Underwriting Criteria Met: {scoreBreakdown.totalVerifiedDocs} Documents Verified
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#047857' }}>
                Borrower credentials substantiated across multiple operating dimensions. Score calibrated with multi-document evidence portfolio.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('documents')}
            className="btn btn-secondary btn-sm"
          >
            <span>Manage Uploaded Documents</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Main Score & Decomposition Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Gauge & Recommendation */}
        <div className="card" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2.5rem 1.5rem', alignSelf: 'stretch'
        }}>
          <RiskScoreGauge
            score={creditScore}
            min={300}
            max={900}
            pd={probabilityOfDefault}
          />

          <div style={{ marginTop: '1.75rem', textAlign: 'center', maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              {decisionBand}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.35rem', lineHeight: 1.5 }}>
              {recommendation}.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => onNavigateTab && onNavigateTab('documents')}
              className="btn btn-primary btn-sm"
            >
              <Upload size={14} />
              <span>Upload / Verify Documents</span>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('explainable-ai')}
              className="btn btn-secondary btn-sm"
            >
              <span>SHAP Attribution</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('what-if')}
              className="btn btn-secondary btn-sm"
            >
              Simulate What-If
            </button>
          </div>
        </div>

        {/* Right Column: Detailed Document-Driven Score Decomposition */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                Score Decomposition Analysis
              </h3>
              <span className="badge badge-teal">Document Breakdown</span>
            </div>
            <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
              How uploaded documents and behavioral evidence form the credit score
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Baseline Unverified Score */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.825rem' }}>
                <span style={{ color: '#475569' }}>Unverified Baseline Starting Score</span>
                <span style={{ fontWeight: 700, color: '#334155' }}>{scoreBreakdown.baseScore} pts</span>
              </div>

              {/* Identity Verification */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: '#f0fdf4', borderRadius: '6px', fontSize: '0.825rem' }}>
                <span style={{ color: '#166534' }}>Identity Verification (Aadhaar / PAN)</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>+{scoreBreakdown.identityPoints} pts</span>
              </div>

              {/* Verified Documents Contribution */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: scoreBreakdown.verifiedPointsEarned > 0 ? '#ecfdf5' : '#f8fafc', borderRadius: '6px', fontSize: '0.825rem' }}>
                <span style={{ color: '#065f46' }}>
                  Verified Documents Evidence ({scoreBreakdown.totalVerifiedDocs} of 5)
                </span>
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  +{scoreBreakdown.verifiedPointsEarned} pts
                </span>
              </div>

              {/* Discrepancies / Rejection Penalties */}
              {scoreBreakdown.penaltyPointsDeducted > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', borderRadius: '6px', fontSize: '0.825rem' }}>
                  <span style={{ color: '#991b1b' }}>
                    Document Mismatches / Rejections ({scoreBreakdown.totalRejectedDocs})
                  </span>
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>
                    -{scoreBreakdown.penaltyPointsDeducted} pts
                  </span>
                </div>
              )}

              {/* Portfolio Synergy / Completeness Bonus */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: scoreBreakdown.completenessBonus > 0 ? '#f0fdfa' : '#f8fafc', borderRadius: '6px', fontSize: '0.825rem' }}>
                <span style={{ color: '#0f766e' }}>Multi-Document Portfolio Synergy Bonus</span>
                <span style={{ fontWeight: 700, color: scoreBreakdown.completenessBonus > 0 ? '#0d9488' : '#94a3b8' }}>
                  +{scoreBreakdown.completenessBonus} pts
                </span>
              </div>

              {/* Operating Cash-Flow Factor */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.825rem' }}>
                <span style={{ color: '#475569' }}>Operating Cash Surplus & Vintage Factor</span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>+{scoreBreakdown.operationalBoost} pts</span>
              </div>

              {/* Total Calibrated Score */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.85rem', backgroundColor: '#0f172a', color: '#ffffff',
                borderRadius: '8px', marginTop: '0.5rem'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Total Calibrated Credit Score</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Platt-calibrated default probability: {probabilityOfDefault}</div>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8' }}>
                  {creditScore}
                </div>
              </div>
            </div>
          </div>

          {/* Active Decision Band Indicator */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Active Decision Band Evaluation
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{
                padding: '0.5rem', borderRadius: '6px', fontSize: '0.72rem',
                border: creditScore >= 750 ? '2px solid #059669' : '1px solid #e2e8f0',
                backgroundColor: creditScore >= 750 ? '#ecfdf5' : '#f8fafc',
                fontWeight: creditScore >= 750 ? 800 : 500,
                color: creditScore >= 750 ? '#065f46' : '#64748b'
              }}>
                <div>750 – 900</div>
                <div style={{ fontSize: '0.68rem', marginTop: '2px' }}>Lower Risk</div>
              </div>

              <div style={{
                padding: '0.5rem', borderRadius: '6px', fontSize: '0.72rem',
                border: creditScore >= 620 && creditScore < 750 ? '2px solid #d97706' : '1px solid #e2e8f0',
                backgroundColor: creditScore >= 620 && creditScore < 750 ? '#fffbeb' : '#f8fafc',
                fontWeight: creditScore >= 620 && creditScore < 750 ? 800 : 500,
                color: creditScore >= 620 && creditScore < 750 ? '#92400e' : '#64748b'
              }}>
                <div>620 – 749</div>
                <div style={{ fontSize: '0.68rem', marginTop: '2px' }}>Moderate Review</div>
              </div>

              <div style={{
                padding: '0.5rem', borderRadius: '6px', fontSize: '0.72rem',
                border: creditScore < 620 ? '2px solid #dc2626' : '1px solid #e2e8f0',
                backgroundColor: creditScore < 620 ? '#fef2f2' : '#f8fafc',
                fontWeight: creditScore < 620 ? 800 : 500,
                color: creditScore < 620 ? '#991b1b' : '#64748b'
              }}>
                <div>300 – 619</div>
                <div style={{ fontSize: '0.68rem', marginTop: '2px' }}>Higher Risk</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Uploaded Document Analysis & Score Attribution Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                Uploaded Document Analysis & Point Attribution
              </h3>
              <span className="badge badge-info">Document Ingestion Audit</span>
            </div>
            <p className="card-subtitle">
              Every uploaded document is scanned, validated, and decomposed into quantifiable underwriting signals. Here is the exact impact of each document on the borrower's credit score.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('documents')}
            className="btn btn-secondary btn-sm"
          >
            <Upload size={14} />
            <span>Upload New Documents</span>
          </button>
        </div>

        {/* Document Attribution Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {documentBreakdown.map((doc, idx) => {
            const isVerified = doc.status === 'VERIFIED';
            const isRejected = doc.status === 'REJECTED' || doc.status === 'MISMATCH_DETECTED';
            const isNotUploaded = doc.status === 'NOT_UPLOADED';

            return (
              <div
                key={idx}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '8px',
                  border: isRejected
                    ? '1.5px solid #fecaca'
                    : (isVerified ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0'),
                  backgroundColor: isRejected ? '#fef2f2' : (isVerified ? '#f0fdf4' : '#fafafa'),
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left: Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: '280px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '8px',
                    backgroundColor: isVerified ? '#dcfce7' : (isRejected ? '#fee2e2' : '#f1f5f9'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getDocIcon(doc.type)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {doc.title}
                      </h4>
                      {isVerified ? (
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                          ✓ VERIFIED
                        </span>
                      ) : isRejected ? (
                        <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>
                          {doc.status === 'MISMATCH_DETECTED' ? 'MISMATCH DETECTED' : 'REJECTED'}
                        </span>
                      ) : (
                        <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                          NOT UPLOADED
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Underwriting Dimension: <strong style={{ color: '#334155' }}>{doc.category}</strong>
                      {doc.fileName && (
                        <span> • File: <strong style={{ color: '#0f172a' }}>{doc.fileName}</strong></span>
                      )}
                      {doc.uploadDate && (
                        <span> • Ingested: {doc.uploadDate}</span>
                      )}
                    </div>

                    {/* Analyzed Evidence Signal */}
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: isVerified ? '#15803d' : (isRejected ? '#b91c1c' : '#64748b'),
                      lineHeight: 1.4,
                      fontWeight: 500
                    }}>
                      {doc.signal}
                    </div>
                  </div>
                </div>

                {/* Right: Point Impact Pill & Action Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '160px' }}>
                  <div style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    backgroundColor: isVerified ? '#dcfce7' : (isRejected ? '#fee2e2' : '#f1f5f9'),
                    color: isVerified ? '#166534' : (isRejected ? '#991b1b' : '#64748b'),
                    border: `1px solid ${isVerified ? '#86efac' : (isRejected ? '#fca5a5' : '#cbd5e1')}`
                  }}>
                    {isVerified ? (
                      `+${doc.pointsAwarded} Score Points`
                    ) : isRejected ? (
                      `${doc.pointsAwarded} Point Penalty`
                    ) : (
                      `0 Points (Awaiting Upload)`
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {doc.fileName ? (
                      <button
                        onClick={() => setSelectedInspectionDoc(doc)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      >
                        <Eye size={12} />
                        <span>Inspect OCR</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigateTab && onNavigateTab('documents')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      >
                        <Upload size={12} />
                        <span>Upload File</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Underwriting Synthesis Insights */}
      <div className="card" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <h3 className="card-title" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#0d9488" />
          <span>Underwriting Evidence Synthesis</span>
        </h3>
        <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
          Corroborated findings from the applicant's uploaded documentation
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a', marginBottom: '0.25rem' }}>
              1. Trade Authority & Inflow Regularity
            </div>
            <div style={{ fontSize: '0.785rem', color: '#475569', lineHeight: 1.45 }}>
              Income/Vending certifications and active bank passbook records confirm authentic micro-retail operations and validate declared turnover against informal benchmarks.
            </div>
          </div>

          <div style={{ padding: '0.85rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a', marginBottom: '0.25rem' }}>
              2. Operating Stability & Physical Tenancy
            </div>
            <div style={{ fontSize: '0.785rem', color: '#475569', lineHeight: 1.45 }}>
              Registered commercial lease contracts and 12-month power utility settlements corroborate physical premises stability, eliminating flight risk and verifying continuous operation.
            </div>
          </div>

          <div style={{ padding: '0.85rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a', marginBottom: '0.25rem' }}>
              3. Debt Liquidation & Repayment Reliability
            </div>
            <div style={{ fontSize: '0.785rem', color: '#475569', lineHeight: 1.45 }}>
              Prior loan clearance records and MFI liquidation certificates prove borrower willingness-to-pay and historical settlement discipline without defaults.
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Document OCR Inspection */}
      {selectedInspectionDoc && (
        <div className="modal-overlay" onClick={() => setSelectedInspectionDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {selectedInspectionDoc.title}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {selectedInspectionDoc.fileName} • {selectedInspectionDoc.category}
                </div>
              </div>
              <button
                onClick={() => setSelectedInspectionDoc(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{
                padding: '0.75rem 1rem', backgroundColor: selectedInspectionDoc.status === 'VERIFIED' ? '#f0fdf4' : '#fef2f2',
                borderRadius: '8px', border: `1px solid ${selectedInspectionDoc.status === 'VERIFIED' ? '#bbf7d0' : '#fecaca'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Score Contribution
                  </div>
                  <div style={{ fontWeight: 800, color: selectedInspectionDoc.status === 'VERIFIED' ? '#15803d' : '#b91c1c', fontSize: '1rem' }}>
                    {selectedInspectionDoc.pointsAwarded > 0 ? `+${selectedInspectionDoc.pointsAwarded} Points` : `${selectedInspectionDoc.pointsAwarded} Points`}
                  </div>
                </div>
                <span className={`badge ${selectedInspectionDoc.status === 'VERIFIED' ? 'badge-success' : 'badge-danger'}`}>
                  {selectedInspectionDoc.status}
                </span>
              </div>

              <div>
                <label className="form-label">Underwriting Signal Extraction</label>
                <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: 1.45 }}>
                  {selectedInspectionDoc.signal}
                </div>
              </div>

              <div>
                <label className="form-label">Extracted OCR Metadata & Fields</label>
                <div style={{
                  padding: '0.85rem', backgroundColor: '#f1f5f9', borderRadius: '8px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#334155',
                  lineHeight: 1.5, maxHeight: '160px', overflowY: 'auto', whiteSpace: 'pre-wrap'
                }}>
                  {selectedInspectionDoc.ocrSummary || 'Extracted document ledger records and authentication metadata.'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button onClick={() => setSelectedInspectionDoc(null)} className="btn btn-secondary">
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
