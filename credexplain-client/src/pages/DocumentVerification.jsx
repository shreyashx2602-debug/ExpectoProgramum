import React, { useState, useEffect } from 'react';
import {
  FileCheck, Upload, Eye, CheckCircle2, AlertTriangle, AlertCircle,
  FileText, RefreshCw, X, Shield, Info, AlertOctagon, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { validateAndScanDocument } from '../utils/documentScanner';
import { evaluateDocumentBasedCreditScore } from '../utils/documentScoring';

export default function DocumentVerification({ currentApplicant, onApplicantUpdated }) {
  const app = currentApplicant || {};
  const appName = app.name || app.fullName || 'Applicant';
  const refId = app.refId || app.applicantRefId || 'APP-2026-081';

  // State for ingested documents
  const [documents, setDocuments] = useState(() => currentApplicant?.documents || []);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [processingDocType, setProcessingDocType] = useState(null);
  const [scanProgress, setScanProgress] = useState(null);

  // Sync documents on applicant change or fetch from backend
  useEffect(() => {
    if (currentApplicant?.documents && currentApplicant.documents.length > 0) {
      setDocuments(currentApplicant.documents);
    } else if (refId) {
      api.getDocuments(refId).then(docs => {
        if (Array.isArray(docs) && docs.length > 0) {
          setDocuments(docs);
        }
      }).catch(() => {});
    }
  }, [refId, currentApplicant?.applicantRefId]);

  // All 5 document options (any 3 required to verify applicant)
  const allDocumentOptions = [
    {
      type: 'INCOME_CERT',
      title: 'Income / Vending Certificate',
      subtitle: 'Document Proof #1',
      desc: 'Municipal vending license, street vending ID, or Tehsildar trade income certificate.'
    },
    {
      type: 'RENT_AGREEMENT',
      title: 'Rent / Tenancy Agreement',
      subtitle: 'Document Proof #2',
      desc: 'Premises commercial tenancy contract or registered commercial lease agreement.'
    },
    {
      type: 'ELECTRICITY_BILL',
      title: 'Electricity Bills (12 Mo)',
      subtitle: 'Document Proof #3',
      desc: 'Commercial address stability and 12-month power utility settlement discipline records.'
    },
    {
      type: 'BANK_PASSBOOK',
      title: 'Bank Passbook / Statements',
      subtitle: 'Document Proof #4',
      desc: 'Corroborating merchant QR settlements, bank savings entries, and working balance ledger.'
    },
    {
      type: 'EMI_HISTORY',
      title: 'Prior EMI / Loan History',
      subtitle: 'Document Proof #5',
      desc: 'Prior micro-credit liquidation certificates, MFI clearance, or no-dues closure records.'
    }
  ];

  // Process and validate an uploaded file
  const handleProcessFile = async (docType, file) => {
    if (!file) return;

    setProcessingDocType(docType);
    setScanProgress({ progress: 15, message: 'Initiating document intake...' });

    try {
      const scanResult = await validateAndScanDocument(file, docType, app, (p) => {
        setScanProgress({ progress: Math.round(p.progress * 100), message: p.message || 'Scanning content...' });
      });

      if (!scanResult.isValid) {
        // Document validation failed or mismatch detected
        const failedDoc = {
          id: Date.now(),
          applicantRefId: refId,
          documentType: docType,
          documentTypeName: allDocumentOptions.find(d => d.type === docType)?.title || docType,
          fileName: file.name,
          fileSize: scanResult.fileSize || '1.0 MB',
          uploadDate: new Date().toISOString().split('T')[0],
          status: scanResult.status || 'REJECTED',
          badge: 'badge-danger',
          error: scanResult.error,
          purpose: 'Uploaded for underwriting verification.',
          ocrDetails: scanResult.ocrDetails || 'Document rejected by automated validation pipeline.',
          consistencyNotes: scanResult.consistencyNotes || scanResult.error
        };

        const updatedDocs = [failedDoc, ...documents.filter(d => d.documentType !== docType)];
        setDocuments(updatedDocs);

        const failScoreAnalysis = evaluateDocumentBasedCreditScore(app, updatedDocs);

        setAlertMessage({
          type: 'danger',
          title: 'Validation Rejected / Document Mismatch Detected',
          text: `${scanResult.error} Risk score adjusted to ${failScoreAnalysis.creditScore} pts.`
        });

        // Sync with applicant
        if (onApplicantUpdated) {
          onApplicantUpdated({
            ...app,
            documents: updatedDocs,
            creditScore: failScoreAnalysis.creditScore,
            probabilityOfDefault: failScoreAnalysis.probabilityOfDefault,
            probabilityOfDefaultNum: failScoreAnalysis.probabilityOfDefaultNum,
            decisionBand: failScoreAnalysis.decisionBand,
            recommendation: failScoreAnalysis.recommendation,
            badgeColor: failScoreAnalysis.badgeColor,
            documentBreakdown: failScoreAnalysis.documentBreakdown,
            scoreBreakdown: failScoreAnalysis.scoreBreakdown,
            topPositiveFactors: failScoreAnalysis.topPositiveFactors,
            topNegativeFactors: failScoreAnalysis.topNegativeFactors
          });
        }
      } else {
        // Document validation passed successfully
        const validDoc = {
          id: Date.now(),
          applicantRefId: refId,
          documentType: docType,
          documentTypeName: allDocumentOptions.find(d => d.type === docType)?.title || docType,
          fileName: file.name,
          fileSize: scanResult.fileSize || '1.2 MB',
          uploadDate: scanResult.uploadDate || new Date().toISOString().split('T')[0],
          status: 'VERIFIED',
          badge: 'badge-success',
          purpose: scanResult.purpose,
          ocrDetails: scanResult.ocrDetails,
          consistencyNotes: scanResult.consistencyNotes
        };

        const updatedDocs = [validDoc, ...documents.filter(d => d.documentType !== docType)];
        setDocuments(updatedDocs);

        // Recompute document-based credit score
        const successScoreAnalysis = evaluateDocumentBasedCreditScore(app, updatedDocs);
        const ptsAwarded = successScoreAnalysis.documentBreakdown.find(d => d.type === docType)?.pointsAwarded || 50;

        setAlertMessage({
          type: 'success',
          title: 'Document Verified & Scored',
          text: `Success: ${file.name} passed authentic ${validDoc.documentTypeName} verification! Contributed +${ptsAwarded} points to credit score (New Score: ${successScoreAnalysis.creditScore} pts).`
        });

        // Persist to backend if running
        try {
          const formData = new FormData();
          formData.append('applicantRefId', refId);
          formData.append('documentType', docType);
          formData.append('file', file);
          api.uploadDocument(formData).catch(() => {});
        } catch (e) {}

        // Check if at least 3 documents are verified
        const verifiedDocs = updatedDocs.filter(d => d.status === 'VERIFIED');
        const uniqueVerifiedTypes = new Set(verifiedDocs.map(d => d.documentType));
        const hasThreeVerified = uniqueVerifiedTypes.size >= 3;

        if (onApplicantUpdated) {
          onApplicantUpdated({
            ...app,
            documents: updatedDocs,
            creditScore: successScoreAnalysis.creditScore,
            probabilityOfDefault: successScoreAnalysis.probabilityOfDefault,
            probabilityOfDefaultNum: successScoreAnalysis.probabilityOfDefaultNum,
            decisionBand: successScoreAnalysis.decisionBand,
            recommendation: successScoreAnalysis.recommendation,
            badgeColor: successScoreAnalysis.badgeColor,
            documentBreakdown: successScoreAnalysis.documentBreakdown,
            scoreBreakdown: successScoreAnalysis.scoreBreakdown,
            topPositiveFactors: successScoreAnalysis.topPositiveFactors,
            topNegativeFactors: successScoreAnalysis.topNegativeFactors,
            identityVerification: docType === 'INCOME_CERT' ? 'VERIFIED' : app.identityVerification,
            identityVerificationStatus: docType === 'INCOME_CERT' ? 'VERIFIED' : app.identityVerificationStatus,
            rentTenancyStatus: docType === 'RENT_AGREEMENT' ? 'VERIFIED_LEASE' : app.rentTenancyStatus,
            verificationStatus: hasThreeVerified ? 'VERIFIED' : 'IN_REVIEW'
          });
        }
      }
    } catch (err) {
      console.error('File verification error:', err);
      setAlertMessage({
        type: 'danger',
        title: 'Inspection Error',
        text: 'Failed to inspect document file: ' + (err.message || 'Unknown error')
      });
    } finally {
      setProcessingDocType(null);
      setScanProgress(null);
      setTimeout(() => {
        setAlertMessage(null);
      }, 7000);
    }
  };

  const handleSaveReview = () => {
    if (!selectedDoc) return;
    const updated = documents.map(d => {
      if (d.id === selectedDoc.id) {
        return {
          ...d,
          consistencyNotes: `${d.consistencyNotes} [Reviewer: ${reviewerNote || 'Approved'}]`
        };
      }
      return d;
    });
    setDocuments(updated);
    if (onApplicantUpdated) {
      onApplicantUpdated({ ...app, documents: updated });
    }
    setSelectedDoc(null);
    setReviewerNote('');
  };

  const verifiedCount = documents.filter(d => d.status === 'VERIFIED').length;
  const totalUploadedCount = documents.length;
  const isVerificationComplete = verifiedCount >= 3;
  const pendingCount = Math.max(0, 3 - verifiedCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 className="card-title">Document Ingestion & Verification Portal</h2>
            <span className="badge badge-teal">5 Verification Categories</span>
          </div>
          <p className="card-subtitle">
            Evaluating evidence for {appName} ({refId}). To qualify for credit assessment, 3 documents must be verified across the available categories.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${isVerificationComplete ? 'badge-success' : (verifiedCount > 0 ? 'badge-warning' : 'badge-danger')}`}>
            {verifiedCount} / 3 Verified
          </span>
          <span className="badge badge-info">
            {totalUploadedCount} / 5 Uploaded
          </span>
          {isVerificationComplete ? (
            <span className="badge badge-success">✓ Criteria Met</span>
          ) : (
            <span className="badge badge-warning">{pendingCount} Pending</span>
          )}
        </div>
      </div>

      {/* Prominent Alert Banner */}
      {alertMessage && (
        <div style={{
          padding: '0.9rem 1.25rem',
          borderRadius: '8px',
          border: `1px solid ${alertMessage.type === 'danger' ? '#fecaca' : '#a7f3d0'}`,
          backgroundColor: alertMessage.type === 'danger' ? '#fef2f2' : '#ecfdf5',
          color: alertMessage.type === 'danger' ? '#991b1b' : '#065f46',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
        }}>
          {alertMessage.type === 'danger' ? (
            <AlertOctagon size={20} color="#b91c1c" style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <CheckCircle2 size={20} color="#047857" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>{alertMessage.title}</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', lineHeight: 1.4 }}>{alertMessage.text}</div>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} color={alertMessage.type === 'danger' ? '#991b1b' : '#065f46'} />
          </button>
        </div>
      )}

      {/* Grid of All 5 Document Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.4rem' }}>
        {allDocumentOptions.map((card, idx) => {
          const matched = documents.find(d => d.documentType === card.type);
          const isVerified = matched?.status === 'VERIFIED';
          const isMismatch = matched?.status === 'MISMATCH_DETECTED';
          const isRejected = matched?.status === 'REJECTED' || isMismatch;
          const isProcessing = processingDocType === card.type;

          return (
            <div
              key={idx}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isRejected
                  ? '1.5px solid #f87171'
                  : (isVerified ? '1.5px solid #a7f3d0' : '1px solid var(--border-light)'),
                backgroundColor: '#ffffff'
              }}
            >
              <div>
                {/* Header with Category Tag */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#0d9488',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {card.subtitle}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a' }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.35 }}>
                      {card.desc}
                    </p>
                  </div>

                  {matched ? (
                    <span className={`badge ${isVerified ? 'badge-success' : 'badge-danger'}`} style={{ whiteSpace: 'nowrap' }}>
                      {isVerified ? 'VERIFIED' : (isMismatch ? 'MISMATCH DETECTED' : 'REJECTED')}
                    </span>
                  ) : (
                    <span className="badge" style={{ whiteSpace: 'nowrap', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                      Not Uploaded
                    </span>
                  )}
                </div>

                {/* Processing Overlay */}
                {isProcessing ? (
                  <div style={{
                    margin: '1rem 0', padding: '1.5rem', backgroundColor: '#f0fdfa',
                    borderRadius: '8px', border: '1.5px dashed #0d9488', textAlign: 'center'
                  }}>
                    <RefreshCw size={24} color="#0d9488" className="spin-animation" style={{ margin: '0 auto 0.6rem' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f766e' }}>
                      {scanProgress?.message || 'Inspecting document content...'}
                    </div>
                    <div style={{
                      height: '6px', backgroundColor: '#ccfbf1', borderRadius: '4px',
                      overflow: 'hidden', margin: '0.75rem auto 0', maxWidth: '200px'
                    }}>
                      <div style={{
                        height: '100%', width: `${scanProgress?.progress || 40}%`,
                        backgroundColor: '#0d9488', transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ) : matched ? (
                  /* Uploaded Status Box */
                  <div style={{
                    margin: '1rem 0', padding: '0.85rem',
                    backgroundColor: isVerified ? '#f8fafc' : '#fef2f2',
                    borderRadius: '8px',
                    border: `1px solid ${isVerified ? '#e2e8f0' : '#fecaca'}`,
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700, color: isVerified ? '#0f172a' : '#991b1b', wordBreak: 'break-all' }}>
                        {matched.fileName}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{matched.fileSize}</span>
                    </div>

                    <div style={{ color: '#64748b', fontSize: '0.725rem', marginTop: '0.25rem' }}>
                      Ingested: {matched.uploadDate}
                    </div>

                    {isRejected ? (
                      <div style={{
                        marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fee2e2',
                        borderRadius: '6px', color: '#991b1b', fontSize: '0.75rem', fontWeight: 600,
                        lineHeight: 1.35
                      }}>
                        {matched.error || matched.consistencyNotes}
                      </div>
                    ) : (
                      <div style={{ color: '#047857', fontSize: '0.75rem', marginTop: '0.5rem', lineHeight: 1.35, fontWeight: 500 }}>
                        ✓ {matched.consistencyNotes}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Drop / Upload Placeholder */
                  <div style={{
                    margin: '1rem 0', padding: '1.25rem', border: '2px dashed #cbd5e1',
                    borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc'
                  }}>
                    <Upload size={22} color="#94a3b8" style={{ margin: '0 auto 0.4rem' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                      Drop or select file to upload
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      PDF, JPG, PNG or WEBP (Max 10MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                {matched && isVerified && (
                  <button
                    onClick={() => {
                      setSelectedDoc(matched);
                      setReviewerNote(matched.consistencyNotes || '');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Eye size={13} />
                    <span>Inspect OCR</span>
                  </button>
                )}

                {/* Standard File Upload Button */}
                <label
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, cursor: isProcessing ? 'wait' : 'pointer', textAlign: 'center', opacity: isProcessing ? 0.6 : 1 }}
                >
                  <Upload size={13} />
                  <span>{matched ? 'Replace File' : 'Upload File'}</span>
                  <input
                    type="file"
                    disabled={isProcessing}
                    style={{ display: 'none' }}
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleProcessFile(card.type, e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Policy Notice Footer */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '0.85rem 1.25rem', backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.785rem', color: '#475569'
      }}>
        <Info size={16} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Underwriting Verification Rule:</strong> Verification requires 3 verified operational documents to establish borrower profile credentials and qualify for credit assessment.
        </div>
      </div>

      {/* Modal: Document Details & OCR Inspection */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Document Inspection & Verification Details
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {selectedDoc.fileName} • {selectedDoc.documentTypeName}
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Classification</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                    {selectedDoc.documentTypeName}
                  </div>
                </div>
                <span className={`badge ${selectedDoc.status === 'VERIFIED' ? 'badge-success' : 'badge-danger'}`}>
                  {selectedDoc.status}
                </span>
              </div>

              <div>
                <label className="form-label">Extracted OCR Text & Form Fields</label>
                <div style={{
                  padding: '0.85rem', backgroundColor: '#f1f5f9', borderRadius: '8px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.785rem', color: '#334155',
                  lineHeight: 1.5, maxHeight: '160px', overflowY: 'auto', whiteSpace: 'pre-wrap'
                }}>
                  {selectedDoc.ocrDetails}
                </div>
              </div>

              <div>
                <label className="form-label">Automated Consistency Evaluation</label>
                <div style={{
                  padding: '0.85rem', backgroundColor: selectedDoc.status === 'VERIFIED' ? '#ecfdf5' : '#fef2f2',
                  borderRadius: '8px', border: `1px solid ${selectedDoc.status === 'VERIFIED' ? '#a7f3d0' : '#fecaca'}`,
                  fontSize: '0.8rem', color: selectedDoc.status === 'VERIFIED' ? '#065f46' : '#991b1b'
                }}>
                  {selectedDoc.consistencyNotes}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Loan Officer Reviewer Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder="Record verification notes, discrepancy explanations, or confirmation remarks..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button onClick={() => setSelectedDoc(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSaveReview} className="btn btn-primary">
                  Save Review Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
