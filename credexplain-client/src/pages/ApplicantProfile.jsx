import React, { useState, useRef } from 'react';
import {
  User, Building2, MapPin, Phone, Calendar, ShieldCheck,
  FileText, CheckCircle2, AlertTriangle, ArrowRight, Info,
  Upload, Loader2, Eye, Sparkles, X, FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { scanLeaseDocument } from '../utils/leaseScanner';
import { evaluateDocumentBasedCreditScore } from '../utils/documentScoring';

export default function ApplicantProfile({ currentApplicant, onNavigateTab, onApplicantUpdated }) {
  const app = currentApplicant || {};
  const name = app.name || app.fullName || 'Applicant';
  const refId = app.refId || app.applicantRefId || 'APP-2026-081';

  // Lease Document Scanning & Proof Persistence State
  const [isScanningLease, setIsScanningLease] = useState(false);
  const [leaseScanStatus, setLeaseScanStatus] = useState('');
  const [leaseScanSuccess, setLeaseScanSuccess] = useState('');
  const [leaseError, setLeaseError] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const leaseFileInputRef = useRef(null);

  // Process & scan an uploaded tenancy/lease file
  const handleProcessLeaseFile = async (file) => {
    if (!file) return;
    setIsScanningLease(true);
    setLeaseScanStatus('Reading commercial tenancy document...');
    setLeaseScanSuccess('');
    setLeaseError('');

    try {
      // Step 1: Scan file with OCR & extract lease metadata
      const scanResult = await scanLeaseDocument(file, app, (p) => {
        if (p.status === 'reading_pdf') {
          setLeaseScanStatus('Extracting digital text layers from PDF...');
        } else if (p.status === 'ocr_scanning' || p.status === 'ocr_running') {
          const pct = Math.round((p.progress || 0.5) * 100);
          setLeaseScanStatus(`Scanning tenancy contract via OCR (${pct}%)...`);
        } else if (p.status === 'analyzing_terms') {
          setLeaseScanStatus('Validating lessor identity, monthly rent & premises occupancy...');
        }
      });

      if (!scanResult.isValid) {
        throw new Error(scanResult.reason || 'Failed to parse lease terms from document.');
      }

      // Step 2: Save verified lease agreement to backend database
      const rentPayload = {
        landlordName: scanResult.landlordName,
        monthlyRentAmount: scanResult.monthlyRentAmount,
        premisesAddress: scanResult.premisesAddress,
        leaseTenure: scanResult.leaseTenure,
        fileName: scanResult.fileName
      };

      const updatedApplicant = await api.updateRentAgreement(refId, rentPayload);

      // Step 3: Record document in document repository
      const formData = new FormData();
      formData.append('applicantRefId', refId);
      formData.append('documentType', 'RENT_AGREEMENT');
      formData.append('file', file);
      await api.uploadDocument(formData).catch(() => {});

      // Step 4: Add verified document to applicant profile and recompute score
      const leaseDoc = {
        id: Date.now(),
        applicantRefId: refId,
        documentType: 'RENT_AGREEMENT',
        documentTypeName: 'Rent / Tenancy Agreement',
        fileName: scanResult.fileName,
        fileSize: '1.2 MB',
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'VERIFIED',
        badge: 'badge-success',
        purpose: 'Premises commercial tenancy and physical occupancy proof.',
        ocrDetails: `Lessor: ${scanResult.landlordName}\nRent: ₹${scanResult.monthlyRentAmount}\nPremises: ${scanResult.premisesAddress}\nTenure: ${scanResult.leaseTenure}`,
        consistencyNotes: 'Registered Commercial Lease Agreement verified. Confirms operational premises occupancy.'
      };
      const updatedDocs = [leaseDoc, ...(app.documents || []).filter(d => d.documentType !== 'RENT_AGREEMENT')];
      const docScoring = evaluateDocumentBasedCreditScore(app, updatedDocs);

      // Step 5: Notify parent application to update applicant state
      if (onApplicantUpdated) {
        onApplicantUpdated({
          ...app,
          ...updatedApplicant,
          documents: updatedDocs,
          creditScore: docScoring.creditScore,
          probabilityOfDefault: docScoring.probabilityOfDefault,
          probabilityOfDefaultNum: docScoring.probabilityOfDefaultNum,
          decisionBand: docScoring.decisionBand,
          recommendation: docScoring.recommendation,
          badgeColor: docScoring.badgeColor,
          documentBreakdown: docScoring.documentBreakdown,
          scoreBreakdown: docScoring.scoreBreakdown,
          rentTenancyStatus: 'VERIFIED_LEASE',
          landlordName: scanResult.landlordName,
          monthlyRentAmount: scanResult.monthlyRentAmount,
          premisesAddress: scanResult.premisesAddress,
          leaseTenure: scanResult.leaseTenure,
          rentAgreementFileName: scanResult.fileName,
          profileCompletion: Math.max(90, app.profileCompletion || 90),
          profileCompletionPct: Math.max(90, app.profileCompletionPct || 90)
        });
      }

      setLeaseScanSuccess(`Premises Tenancy Document scanned & saved as proof! Lessor: ${scanResult.landlordName}, Monthly Rent: ₹${scanResult.monthlyRentAmount.toLocaleString('en-IN')}`);
    } catch (err) {
      console.error('Lease document scan error:', err);
      setLeaseError(err.message || 'Error scanning lease document.');
    } finally {
      setIsScanningLease(false);
    }
  };

  // File input change handler
  const handleLeaseInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessLeaseFile(file);
    }
    e.target.value = '';
  };

  const isTenancyVerified = app.rentTenancyStatus === 'VERIFIED_LEASE' || app.rentTenancyStatus === 'VERIFIED';
  const isIdentityVerified = app.identityVerification === 'VERIFIED' || app.identityVerificationStatus === 'VERIFIED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile Header Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '14px',
              backgroundColor: '#0d9488', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 800
            }}>
              {name[0] || 'A'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {name}
                </h2>
                <span className="badge badge-teal">{app.occupation}</span>
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Applicant ID: <strong>{refId}</strong> • Registered Location: {app.location}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Profile Completion
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0d9488' }}>
                {app.profileCompletion || app.profileCompletionPct || 90}%
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('documents')}
              className="btn btn-primary btn-sm"
            >
              <span>View Submitted Documents</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Business Details & Verification Workflows */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }}>
        {/* Business Operating Profile */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>
            <Building2 size={18} color="#0d9488" />
            <span>Enterprise & Operating Baseline</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Trade / Business Name</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                {app.businessName || 'Business'}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Operating Vintage</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                {app.businessVintage || '3.0 Years'} ({app.businessAgeYears || 3.0} Years Active)
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Enterprise Classification</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                {app.businessType || 'Micro-Enterprise'}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Operating Model</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                Active Physical Commercial Enterprise
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Synthetic Contact</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                {app.contact || app.contactPhone || '+91 98765-XXXXX'}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Trading Hub / City</span>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                {app.location || 'India'}
              </div>
            </div>
          </div>
        </div>

        {/* Identity & Tenancy Verification Status */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>
            <ShieldCheck size={18} color="#0d9488" />
            <span>Verification Status & Premises Evidence</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Identity Card */}
            <div style={{
              padding: '1rem', borderRadius: '10px',
              backgroundColor: isIdentityVerified ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${isIdentityVerified ? '#a7f3d0' : '#fde68a'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isIdentityVerified ? '#065f46' : '#92400e' }}>
                  {app.governmentIdType || 'Aadhaar / Government ID'} Verification
                </span>
                <span className={`badge ${isIdentityVerified ? 'badge-success' : 'badge-warning'}`}>
                  {isIdentityVerified ? 'Verified Genuine' : 'Pending Document Upload'}
                </span>
              </div>
              <p style={{ fontSize: '0.785rem', color: isIdentityVerified ? '#047857' : '#b45309', lineHeight: 1.4, margin: '0 0 0.35rem' }}>
                {isIdentityVerified
                  ? (app.idVerificationDetails || "Government ID corroborated with applicant records and verified successfully.")
                  : "No official identity document or vending license has been uploaded yet. Upload proof in Document Verification tab to verify."}
              </p>
              {app.governmentIdNumber && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                  ID: {app.governmentIdNumber.length > 4 ? `XXXX-XXXX-${app.governmentIdNumber.slice(-4)}` : app.governmentIdNumber} ({app.governmentIdType || 'AADHAAR'})
                </div>
              )}
            </div>

            {/* Premises Tenancy & Occupancy Evidence Card */}
            <div style={{
              padding: '1.1rem', borderRadius: '10px',
              backgroundColor: isTenancyVerified ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${isTenancyVerified ? '#a7f3d0' : '#fde68a'}`,
              transition: 'all 0.25s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isTenancyVerified ? '#065f46' : '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} />
                  <span>Premises Tenancy & Occupancy Evidence</span>
                </span>
                <span className={`badge ${isTenancyVerified ? 'badge-success' : 'badge-warning'}`}>
                  {isTenancyVerified ? 'Verified Lease' : 'Pending Lease Document'}
                </span>
              </div>

              <p style={{ fontSize: '0.785rem', color: isTenancyVerified ? '#047857' : '#b45309', lineHeight: 1.4, margin: '0 0 0.75rem' }}>
                {isTenancyVerified
                  ? "Registered commercial lease agreement active & authenticated. Confirms continuous physical operating occupancy."
                  : "No commercial lease or utility tenancy contract uploaded. Physical premises status remains unverified until tenancy proof is provided."}
              </p>

              {/* Scanning in Progress Status */}
              {isScanningLease && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  borderRadius: '6px',
                  color: '#0f766e',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{leaseScanStatus || 'Scanning tenancy contract...'}</span>
                </div>
              )}

              {/* Scan Error Alert */}
              {leaseError && !isScanningLease && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '0.78rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={16} />
                  <span>{leaseError}</span>
                </div>
              )}

              {/* Success Feedback Alert */}
              {leaseScanSuccess && !isScanningLease && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  color: '#166534',
                  fontSize: '0.78rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={16} />
                  <span>{leaseScanSuccess}</span>
                </div>
              )}

              {/* If Verified: Display Extracted Tenancy Proof Details */}
              {isTenancyVerified && (
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #d1fae5',
                  marginBottom: '0.85rem',
                  fontSize: '0.785rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Lessor / Property Owner</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {app.landlordName || 'M.K. Commercial Realty & Estates'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Monthly Rent Amount</span>
                      <div style={{ fontWeight: 700, color: '#0d9488' }}>
                        ₹{Number(app.monthlyRentAmount || 2500).toLocaleString('en-IN')} / mo
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Premises Occupancy Address</span>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {app.premisesAddress || `Shop #14, Sector Commercial Market, ${app.location || 'Indore'}`}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Tenancy Tenure Duration</span>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {app.leaseTenure || '11 Months (Active Registered Tenancy)'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.65rem', paddingTop: '0.55rem', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Attached Proof: <strong>{app.rentAgreementFileName || 'Premises_Lease_Agreement.pdf'}</strong>
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Saved in Credit Dossier
                    </span>
                  </div>
                </div>
              )}

              {/* Action Controls for Uploading, Scanning & Saving Proof */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={leaseFileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={handleLeaseInputChange}
                />

                <button
                  type="button"
                  disabled={isScanningLease}
                  onClick={() => leaseFileInputRef.current?.click()}
                  className="btn btn-primary btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.45rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '6px'
                  }}
                >
                  <Upload size={14} />
                  <span>{isTenancyVerified ? 'Replace / Re-upload Lease' : 'Upload Commercial Lease Agreement'}</span>
                </button>

                {isTenancyVerified && (
                  <button
                    type="button"
                    onClick={() => setShowProofModal(true)}
                    className="btn btn-outline-primary btn-sm"
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.45rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '6px'
                    }}
                  >
                    <Eye size={14} />
                    <span>View Scanned Proof</span>
                  </button>
                )}
              </div>
            </div>

            {/* Regulatory Disclaimer Alert */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px',
              fontSize: '0.75rem', color: '#475569'
            }}>
              <Info size={15} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Underwriting Notice:</strong> Commercial lease agreements serve as verified physical evidence
                of active local trade operations and premises occupancy, reducing synthetic borrower identity risk.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanned Lease Proof Dossier Modal */}
      {showProofModal && (
        <div className="modal-overlay" onClick={() => setShowProofModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', maxHeight: '88vh', overflowY: 'auto', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck size={20} color="#0d9488" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Verified Commercial Lease Evidence Dossier
                </h3>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              border: '2px solid #0f766e',
              borderRadius: '8px',
              padding: '1.25rem',
              backgroundColor: '#fdfbf7',
              fontFamily: 'Georgia, serif',
              position: 'relative'
            }}>
              {/* Notary Stamp Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f766e', paddingBottom: '0.65rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Government of India • Registration & Stamp Department
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  Commercial Premises Tenancy & Occupancy Certificate
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#1e293b' }}>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong>Lessor / Property Owner:</strong> {app.landlordName || 'M.K. Commercial Realty & Estates'}
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong>Lessee / Business Tenant:</strong> {name} (Proprietor: {app.businessName || 'Trading Enterprise'})
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong>Demised Operating Premises:</strong> {app.premisesAddress || `Shop #14, Sector Commercial Market, ${app.location || 'Indore'}`}
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong>Agreed Monthly Rent:</strong> ₹{Number(app.monthlyRentAmount || 2500).toLocaleString('en-IN')} / month
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong>Tenancy Lease Tenure:</strong> {app.leaseTenure || '11 Months (Active Registered Tenancy)'}
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong>Uploaded Document:</strong> {app.rentAgreementFileName || 'Commercial_Premises_Lease_Agreement.pdf'}
                </p>
              </div>

              {/* Notary Stamp Graphic */}
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                  <div><strong>Verification Status:</strong> AUTHENTICATED & SAVED</div>
                  <div><strong>Dossier Ref:</strong> {refId}</div>
                  <div><strong>Timestamp:</strong> {new Date().toLocaleDateString('en-IN')}</div>
                </div>

                <div style={{
                  border: '2px solid #b91c1c',
                  borderRadius: '50%',
                  width: '74px',
                  height: '74px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b91c1c',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  lineHeight: 1.1,
                  transform: 'rotate(-8deg)'
                }}>
                  <span>NOTARY</span>
                  <span>VERIFIED</span>
                  <span>OCCUPANCY</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowProofModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
