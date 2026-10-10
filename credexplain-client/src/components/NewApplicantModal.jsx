import React, { useState, useMemo, useRef } from 'react';
import {
  UserPlus, X, CheckCircle2, Building, MapPin, Phone, Briefcase,
  DollarSign, Zap, Calendar, Package, ShieldCheck, ShieldAlert,
  CreditCard, FileCheck, Upload, AlertCircle, Info, Hash, FileText,
  Scan, Loader2, FileWarning
} from 'lucide-react';
import { api } from '../services/api';
import {
  validateAadhaar, validatePan
} from '../utils/idVerification';
import {
  scanAadhaarDocument, createSampleCardFile
} from '../utils/aadhaarScanner';

export default function NewApplicantModal({ isOpen, onClose, onApplicantCreated }) {
  // Identity & Business Profile
  const [fullName, setFullName] = useState('');
  const [occupation, setOccupation] = useState('Street Food Vendor');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Food & Beverage Micro-Enterprise');
  const [location, setLocation] = useState('Indore, Madhya Pradesh');
  const [contactPhone, setContactPhone] = useState('+91 98765-43210');
  const [businessAgeYears, setBusinessAgeYears] = useState(3.0);
  const [hasInventory, setHasInventory] = useState(false);

  // Mandatory Government ID Verification
  const [idType, setIdType] = useState('AADHAAR'); // 'AADHAAR' | 'PAN'
  const [idNumber, setIdNumber] = useState('');
  const [idDocumentName, setIdDocumentName] = useState('');
  const [touchedId, setTouchedId] = useState(false);

  // Aadhaar OCR & Authenticity Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');

  // Informal Financial & Behavioral Assumptions
  const [avgMonthlyIncome, setAvgMonthlyIncome] = useState(35000);
  const [avgMonthlyExpenses, setAvgMonthlyExpenses] = useState(20000);
  const [onTimeUtilityRatio, setOnTimeUtilityRatio] = useState(0.92);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Real-time Government ID Validation
  const idValidation = useMemo(() => {
    if (!idNumber.trim()) {
      return {
        isValid: false,
        reason: `${idType === 'AADHAAR' ? '12-digit Aadhaar UID' : '10-character PAN card number'} is required for mandatory identity verification.`
      };
    }

    if (idType === 'AADHAAR') {
      return validateAadhaar(idNumber);
    } else {
      return validatePan(idNumber, fullName);
    }
  }, [idType, idNumber, fullName]);

  if (!isOpen) return null;

  // Process and scan attached Aadhaar card file (Images & PDF)
  const handleProcessCardFile = async (file) => {
    if (!file) return;
    setIsScanning(true);
    setScanStatusText('Scanning document with OCR engine...');
    setScanError('');
    setScanSuccess('');
    setTouchedId(true);
    setError('');

    try {
      const result = await scanAadhaarDocument(file, (p) => {
        if (p.status === 'extracting_pdf') {
          setScanStatusText('Extracting digital text layers from PDF...');
        } else if (p.status === 'preprocessing_image') {
          setScanStatusText('Preprocessing image contrast for high-accuracy OCR...');
        } else if (p.status === 'recognizing_text' || p.status === 'ocr_running') {
          const pct = Math.round((p.progress || 0.5) * 100);
          setScanStatusText(`Scanning card text via OCR (${pct}%)...`);
        } else if (p.status === 'validating_checksum') {
          setScanStatusText('Validating UIDAI Verhoeff Checksum & security markers...');
        }
      });

      if (result.isFake) {
        // Explicit counterfeit or tampered document detected
        setIdNumber('');
        setIdDocumentName('');
        setScanSuccess('');
        setScanError(result.reason);
        setError(`Identity Verification Failed: ${result.reason}`);
      } else if (result.aadhaarNumber) {
        // Extracted Aadhaar UID: populate field automatically
        setIdNumber(result.aadhaarNumber);
        setIdDocumentName(file.name);
        setScanSuccess(result.reason);
        setScanError('');
        setError('');
        if (!fullName.trim() && result.holderName) {
          setFullName(result.holderName);
        }
      } else {
        // Unreadable or no 12-digit number found
        setScanSuccess('');
        setScanError(result.reason);
      }
    } catch (err) {
      const msg = err.message || 'Error occurred while scanning document.';
      setScanError(msg);
      setError(`Scanning Error: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Document file selection via input
  const handleDocFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (idType === 'AADHAAR') {
        handleProcessCardFile(file);
      } else {
        setIdDocumentName(file.name);
      }
    }
    // reset input so same file can be reselected if needed
    e.target.value = '';
  };

  // Quick sample test handler
  const handleTestSampleFile = async (sampleType) => {
    const sampleFile = await createSampleCardFile(sampleType);
    if (sampleFile) {
      handleProcessCardFile(sampleFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouchedId(true);

    if (!fullName.trim()) {
      setError('Please provide borrower full name.');
      return;
    }

    // Strict Guardrail: Profile CANNOT be created without genuine Aadhaar or PAN
    if (!idValidation.isValid) {
      setError(`Identity Verification Failed: ${idValidation.reason}. Borrower profile can only be created with an authenticated genuine government ID.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const applicantPayload = {
        fullName: fullName.trim(),
        occupation,
        businessName: businessName.trim() || `${fullName}'s Enterprise`,
        businessType,
        location,
        contactPhone,
        businessAgeYears: Number(businessAgeYears),
        businessVintage: `${businessAgeYears} Years`,
        hasInventory: Boolean(hasInventory),
        avgMonthlyIncome: Number(avgMonthlyIncome),
        avgMonthlyExpenses: Number(avgMonthlyExpenses),
        onTimeUtilityRatio: Number(onTimeUtilityRatio),
        bufferRatio: avgMonthlyExpenses > 0
          ? Number(Math.max(0.1, (avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyExpenses).toFixed(2))
          : 0.35,
        // Verified Identity Attributes
        governmentIdType: idType,
        governmentIdNumber: idValidation.cleanNumber || idNumber,
        identityVerificationStatus: "VERIFIED",
        idVerificationDetails: idValidation.reason,
        rentTenancyStatus: "UNVERIFIED",
        verificationStatus: "PENDING_DOCUMENTS",
        profileCompletionPct: 75
      };

      const created = await api.createApplicant(applicantPayload);
      onApplicantCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to verify identity or save borrower profile to database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              backgroundColor: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserPlus size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Add New Borrower Application
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Mandatory identity verification required prior to credit file generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem', backgroundColor: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: '8px',
            color: '#991b1b', fontSize: '0.825rem', marginBottom: '1.25rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Verification Blocker:</strong> {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Borrower Identity */}
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            1. Identity & Business Profile
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Borrower Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Occupation / Trade *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Street Food Vendor, Tailor, Kirana"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Business / Trade Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Kumar Provision Store"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Business Sector</label>
              <select
                className="form-control"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              >
                <option value="Food & Beverage Micro-Enterprise">Food & Beverage Micro-Enterprise</option>
                <option value="Grocery & Daily Essentials Retail">Grocery & Daily Essentials Retail</option>
                <option value="On-Demand Delivery Logistics">On-Demand Delivery Logistics</option>
                <option value="Apparel & Tailoring Services">Apparel & Tailoring Services</option>
                <option value="Artisan & Handicraft Production">Artisan & Handicraft Production</option>
                <option value="Repair & Technical Services">Repair & Technical Services</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Location (City, State)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Indore, Madhya Pradesh"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Operating Vintage (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="30"
                className="form-control"
                value={businessAgeYears}
                onChange={(e) => setBusinessAgeYears(parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Section 2: Mandatory Government Identity Verification */}
          <div style={{
            padding: '1.1rem',
            backgroundColor: '#f8fafc',
            border: `2px solid ${idValidation.isValid ? '#10b981' : (touchedId ? '#f59e0b' : '#cbd5e1')}`,
            borderRadius: '10px',
            marginBottom: '1.5rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color={idValidation.isValid ? '#10b981' : '#64748b'} />
                <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  2. Mandatory Government Identity Verification *
                </span>
              </div>
              <span className={`badge ${idValidation.isValid ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                {idValidation.isValid ? 'VERIFIED GENUINE' : 'VERIFICATION REQUIRED'}
              </span>
            </div>

            <p style={{ fontSize: '0.765rem', color: '#64748b', margin: '0 0 0.85rem', lineHeight: 1.4 }}>
              The borrower must provide a verified <strong>Aadhaar Card</strong> (UIDAI Verhoeff Checksum) or <strong>PAN Card</strong> (Income Tax NSDL Schema). Profiles are only created upon successful checksum authenticity validation.
            </p>

            {/* ID Type Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIdType('AADHAAR');
                  setIdNumber('');
                  setTouchedId(false);
                }}
                className={`btn btn-sm ${idType === 'AADHAAR' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.775rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <CreditCard size={13} />
                <span>Aadhaar Card (12-Digit UID)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdType('PAN');
                  setIdNumber('');
                  setTouchedId(false);
                }}
                className={`btn btn-sm ${idType === 'PAN' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.775rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <FileText size={13} />
                <span>PAN Card (10-Char NSDL)</span>
              </button>
            </div>

            {/* ID Number Input Field */}
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                <span>{idType === 'AADHAAR' ? 'Aadhaar UID Number (12 Digits) *' : 'Permanent Account Number (PAN) *'}</span>
                <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.725rem' }}>
                  {idType === 'AADHAAR' ? 'Format: XXXX XXXX XXXX' : 'Format: ABCPK1234F'}
                </span>
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="form-control"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    borderColor: idValidation.isValid ? '#10b981' : (touchedId ? '#f59e0b' : '#cbd5e1'),
                    paddingRight: '2.5rem'
                  }}
                  placeholder={idType === 'AADHAAR' ? 'e.g. 3675 9832 4511' : 'e.g. ABCPK1234F'}
                  value={idNumber}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (idType === 'AADHAAR') {
                      val = val.replace(/\D/g, '').slice(0, 12);
                      val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                    } else {
                      val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                    }
                    setIdNumber(val);
                    setTouchedId(true);
                  }}
                />
                <div style={{ position: 'absolute', right: '10px', top: '9px' }}>
                  {idValidation.isValid ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : (
                    touchedId && <AlertCircle size={18} color="#f59e0b" />
                  )}
                </div>
              </div>
            </div>

            {/* Real-time Validation Status Banner */}
            {touchedId && (
              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.775rem',
                marginBottom: '0.85rem',
                backgroundColor: idValidation.isValid ? '#ecfdf5' : '#fffbeb',
                border: `1px solid ${idValidation.isValid ? '#a7f3d0' : '#fde68a'}`,
                color: idValidation.isValid ? '#065f46' : '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {idValidation.isValid ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                <span><strong>{idValidation.isValid ? 'Authentic' : 'Validation'}:</strong> {idValidation.reason}</span>
              </div>
            )}

            {/* Attach Aadhaar Card Section with Real OCR Scanning & Fake Detection */}
            <div style={{
              padding: '0.85rem',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Scan size={14} color="#0d9488" />
                  <span>Attach Aadhaar Card (Automatic OCR & Authenticity Scan)</span>
                </span>
                {idDocumentName && !isScanning && !scanError && (
                  <span className="badge badge-success" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={11} /> Attached & Verified
                  </span>
                )}
              </div>

              {/* Upload Action & Drop Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary btn-sm"
                  style={{
                    fontSize: '0.785rem',
                    padding: '0.45rem 0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '6px'
                  }}
                >
                  {isScanning ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Scanning Aadhaar...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>{idDocumentName ? 'Replace Attached Aadhaar Card' : 'Attach Aadhaar Card (Scan & Extract)'}</span>
                    </>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={handleDocFileSelect}
                />

                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {idDocumentName ? `File: ${idDocumentName}` : 'Supports e-Aadhaar PDF, JPG, PNG'}
                </span>
              </div>

              {/* Scanning in Progress Status Banner */}
              {isScanning && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  borderRadius: '6px',
                  color: '#0f766e',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{scanStatusText || 'Analyzing document credentials...'}</span>
                </div>
              )}

              {/* Scanned Genuine Success Feedback */}
              {scanSuccess && !isScanning && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  color: '#065f46',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  lineHeight: 1.4
                }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Aadhaar Card Scanned & Authenticated Successfully</div>
                    <div style={{ fontSize: '0.74rem', marginTop: '2px' }}>
                      {scanSuccess} The 12-digit number has been populated automatically.
                    </div>
                  </div>
                </div>
              )}

              {/* Fake / Invalid Document Detection Alert */}
              {scanError && !isScanning && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  lineHeight: 1.4
                }}>
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Document Security Alert: Non-Genuine Document Detected</div>
                    <div style={{ fontSize: '0.74rem', marginTop: '2px' }}>
                      {scanError}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Document Testing Presets */}
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.65rem',
                borderTop: '1px dashed #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.4rem'
              }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                  Or verify with test document samples:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => handleTestSampleFile('GENUINE')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#047857', borderColor: '#a7f3d0' }}
                    title="Upload genuine Aadhaar card with valid UIDAI Verhoeff Checksum"
                  >
                    ✓ Test Genuine Card
                  </button>
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => handleTestSampleFile('FAKE')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#b91c1c', borderColor: '#fecaca' }}
                    title="Test fake document with invalid check-digit checksum"
                  >
                    ⚠ Test Fake Card
                  </button>
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => handleTestSampleFile('NON_AADHAAR')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#475569', borderColor: '#cbd5e1' }}
                    title="Test non-Aadhaar document (utility invoice)"
                  >
                    ✕ Test Non-Aadhaar File
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Informal Financial & Behavioral Assumptions */}
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            3. Financial Baseline & Cashflow Assumptions
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Claimed Monthly Inflow (₹) *</label>
              <input
                type="number"
                step="500"
                min="5000"
                max="250000"
                className="form-control"
                value={avgMonthlyIncome}
                onChange={(e) => setAvgMonthlyIncome(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Avg Monthly Operating Outflows (₹) *</label>
              <input
                type="number"
                step="500"
                min="2000"
                max="200000"
                className="form-control"
                value={avgMonthlyExpenses}
                onChange={(e) => setAvgMonthlyExpenses(parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Utility Bill On-Time Payment Discipline */}
          <div className="form-group" style={{ marginBottom: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, margin: 0 }}>
                Utility Payment Discipline (Electricity & Commercial Utilities)
              </label>
              <span className="badge badge-teal" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                {Math.round(onTimeUtilityRatio * 100)}% On-Time Settlement
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.01"
              className="form-control"
              style={{ padding: '4px', cursor: 'pointer' }}
              value={onTimeUtilityRatio}
              onChange={(e) => setOnTimeUtilityRatio(parseFloat(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
              <span>50% (Frequent Bill Delays)</span>
              <span>75% (Moderate Settlement Track)</span>
              <span>100% (Strict Continuous On-Time)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !idValidation.isValid}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                opacity: (!idValidation.isValid && touchedId) ? 0.6 : 1
              }}
            >
              {loading ? (
                <span>Authenticating Identity...</span>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Verify Identity & Create Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
