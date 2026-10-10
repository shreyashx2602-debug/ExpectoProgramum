import React, { useState, useEffect } from 'react';
import {
  Sun, Moon, Monitor, Palette, Sliders, Shield, Bell,
  Lock, Eye, EyeOff, CheckCircle2, RotateCcw, Trash2,
  Download, Volume2, VolumeX, Sparkles, AlertTriangle,
  FileText, Check, DollarSign, Globe
} from 'lucide-react';

export default function SettingsPage({ onResetDemo }) {
  // Load settings from localStorage with defaults
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('credexplain_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      theme: 'light', // 'light' | 'dark' | 'system'
      accent: 'teal', // 'teal' | 'indigo' | 'purple' | 'rose'
      density: 'comfortable', // 'comfortable' | 'compact'
      fontSize: 'normal', // 'small' | 'normal' | 'large'
      currency: 'INR', // 'INR' | 'USD' | 'EUR'
      numberFormat: 'indian', // 'indian' | 'international'
      underwritingMode: 'balanced', // 'conservative' | 'balanced' | 'flexible'
      ocrStrictness: 'standard', // 'strict' | 'standard' | 'permissive'
      maskPii: true,
      soundAlerts: true,
      instantMismatchWarnings: true,
      autoSaveNotes: true,
      dailyDigest: false,
      sessionTimeout: '30m' // '15m' | '30m' | '1h' | 'never'
    };
  });

  const [resetting, setResetting] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Apply settings to DOM and persist
  const applySetting = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      localStorage.setItem('credexplain_settings', JSON.stringify(updated));
    } catch (e) {}

    // Apply immediate DOM effects
    if (key === 'theme') {
      if (value === 'system') {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', value);
      }
    }
    if (key === 'accent') {
      document.documentElement.setAttribute('data-accent', value);
    }
    if (key === 'density') {
      document.documentElement.setAttribute('data-density', value);
    }
    if (key === 'fontSize') {
      document.documentElement.setAttribute('data-font-size', value);
    }

    setSaveToast(`Preference updated: ${key}`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Sync initial DOM attributes on component mount
  useEffect(() => {
    if (settings.theme === 'system') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    }
    document.documentElement.setAttribute('data-accent', settings.accent || 'teal');
    document.documentElement.setAttribute('data-density', settings.density || 'comfortable');
    document.documentElement.setAttribute('data-font-size', settings.fontSize || 'normal');
  }, []);

  const handleResetDefaults = () => {
    const defaults = {
      theme: 'light',
      accent: 'teal',
      density: 'comfortable',
      fontSize: 'normal',
      currency: 'INR',
      numberFormat: 'indian',
      underwritingMode: 'balanced',
      ocrStrictness: 'standard',
      maskPii: true,
      soundAlerts: true,
      instantMismatchWarnings: true,
      autoSaveNotes: true,
      dailyDigest: false,
      sessionTimeout: '30m'
    };
    setSettings(defaults);
    localStorage.setItem('credexplain_settings', JSON.stringify(defaults));
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.removeAttribute('data-accent');
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-font-size');
    setSaveToast('Preferences reset to default values');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleClearRecords = async () => {
    setResetting(true);
    await onResetDemo();
    setResetting(false);
    setShowClearConfirm(false);
    setSaveToast('All borrower records cleared from database.');
    setTimeout(() => setSaveToast(null), 4000);
  };

  const exportAuditLog = () => {
    const sampleLog = [
      { timestamp: new Date().toISOString(), user: 'Loan Officer', action: 'SETTINGS_UPDATE', details: 'Updated user preferences' },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'Underwriter', action: 'DOCUMENT_SCAN', details: 'Verified premises lease agreement' },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'System', action: 'VERHOEFF_CHECKSUM', details: 'Aadhaar UID validated (12/12 digits authentic)' }
    ];
    const blob = new Blob([JSON.stringify(sampleLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credexplain_audit_log_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1100px' }}>
      {/* Top Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 className="card-title">Application Preferences & Settings</h2>
            <span className="badge badge-teal">User Configuration</span>
          </div>
          <p className="card-subtitle">
            Customize visual themes, underwriting strictness, notification alerts, and privacy governance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <button
            onClick={handleResetDefaults}
            className="btn btn-secondary btn-sm"
            title="Reset all settings to default"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Floating Save Toast */}
      {saveToast && (
        <div style={{
          padding: '0.75rem 1.25rem', backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0', borderRadius: '8px',
          color: '#065f46', fontSize: '0.825rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: 'var(--shadow-md)', transition: 'all 0.3s ease'
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* SECTION 1: Appearance & Themes */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <Palette size={20} color="var(--primary-teal)" />
          <h3 className="card-title" style={{ margin: 0 }}>Appearance & Themes</h3>
        </div>
        <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
          Personalize the look and feel of the underwriting workspace
        </p>

        {/* Theme Mode Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Theme Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginTop: '0.4rem' }}>
            {/* Light Mode */}
            <div
              onClick={() => applySetting('theme', 'light')}
              style={{
                padding: '1rem', borderRadius: '10px', cursor: 'pointer',
                border: settings.theme === 'light' ? '2px solid var(--primary-teal)' : '1px solid var(--border-light)',
                backgroundColor: settings.theme === 'light' ? 'rgba(13, 148, 136, 0.04)' : 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Sun size={20} color="#d97706" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Light Theme</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crisp daylight styling</div>
              </div>
              {settings.theme === 'light' && <Check size={18} color="var(--primary-teal)" />}
            </div>

            {/* Dark Mode */}
            <div
              onClick={() => applySetting('theme', 'dark')}
              style={{
                padding: '1rem', borderRadius: '10px', cursor: 'pointer',
                border: settings.theme === 'dark' ? '2px solid var(--primary-teal)' : '1px solid var(--border-light)',
                backgroundColor: settings.theme === 'dark' ? 'rgba(13, 148, 136, 0.08)' : 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Moon size={20} color="#38bdf8" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Dark Theme</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sleek night-shift mode</div>
              </div>
              {settings.theme === 'dark' && <Check size={18} color="var(--primary-teal)" />}
            </div>

            {/* System Default */}
            <div
              onClick={() => applySetting('theme', 'system')}
              style={{
                padding: '1rem', borderRadius: '10px', cursor: 'pointer',
                border: settings.theme === 'system' ? '2px solid var(--primary-teal)' : '1px solid var(--border-light)',
                backgroundColor: settings.theme === 'system' ? 'rgba(13, 148, 136, 0.04)' : 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Monitor size={20} color="#64748b" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>System Sync</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Follow OS preferences</div>
              </div>
              {settings.theme === 'system' && <Check size={18} color="var(--primary-teal)" />}
            </div>
          </div>
        </div>

        {/* Brand Accent Color */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Brand Color Accent</label>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {[
              { id: 'teal', label: 'Emerald Teal', color: '#0d9488' },
              { id: 'indigo', label: 'Sapphire Indigo', color: '#4f46e5' },
              { id: 'purple', label: 'Amethyst Purple', color: '#7c3aed' },
              { id: 'rose', label: 'Rose Coral', color: '#e11d48' }
            ].map(acc => (
              <button
                key={acc.id}
                onClick={() => applySetting('accent', acc.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.85rem', borderRadius: '8px',
                  border: settings.accent === acc.id ? `2px solid ${acc.color}` : '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-surface)', cursor: 'pointer',
                  fontWeight: settings.accent === acc.id ? 700 : 500, fontSize: '0.825rem',
                  color: 'var(--text-primary)'
                }}
              >
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: acc.color }} />
                <span>{acc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Density & Font Size Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label className="form-label">Interface Layout Density</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
              <button
                onClick={() => applySetting('density', 'comfortable')}
                className={`btn btn-sm ${settings.density === 'comfortable' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                Comfortable (Standard)
              </button>
              <button
                onClick={() => applySetting('density', 'compact')}
                className={`btn btn-sm ${settings.density === 'compact' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                Compact (High Density)
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Font Scale</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
              <button
                onClick={() => applySetting('fontSize', 'small')}
                className={`btn btn-sm ${settings.fontSize === 'small' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                Small (90%)
              </button>
              <button
                onClick={() => applySetting('fontSize', 'normal')}
                className={`btn btn-sm ${settings.fontSize === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                Normal (100%)
              </button>
              <button
                onClick={() => applySetting('fontSize', 'large')}
                className={`btn btn-sm ${settings.fontSize === 'large' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                Large (110%)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Underwriting & Scoring Configuration */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <Sliders size={20} color="var(--primary-teal)" />
          <h3 className="card-title" style={{ margin: 0 }}>Underwriting & Scoring Configuration</h3>
        </div>
        <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
          Operational rules for credit risk assessment and automated document checks
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label className="form-label">Decision Policy Threshold</label>
            <select
              value={settings.underwritingMode}
              onChange={(e) => applySetting('underwritingMode', e.target.value)}
              className="form-control"
            >
              <option value="conservative">Conservative (Approval Cutoff: 750 • Strict 3-Document Proof)</option>
              <option value="balanced">Balanced Standard (Approval Cutoff: 720 • Standard 3-Document Proof)</option>
              <option value="flexible">Growth / Inclusive (Approval Cutoff: 660 • 2+ Documents Minimum)</option>
            </select>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Determines automated recommendation cutoffs for credit line approval.
            </div>
          </div>

          <div>
            <label className="form-label">OCR Document Validation Strictness</label>
            <select
              value={settings.ocrStrictness}
              onChange={(e) => applySetting('ocrStrictness', e.target.value)}
              className="form-control"
            >
              <option value="strict">Strict (Requires Official Seals, Issuer Reg ID & Verhoeff Checksum)</option>
              <option value="standard">Standard (Validates Document Classification & Mandatory Fields)</option>
              <option value="permissive">Permissive (Accepts Informal Receipts & Unstructured Ledgers)</option>
            </select>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Defines sensitivity of automated mismatch detection pipeline.
            </div>
          </div>

          <div>
            <label className="form-label">Currency & Denomination Format</label>
            <select
              value={settings.currency}
              onChange={(e) => applySetting('currency', e.target.value)}
              className="form-control"
            >
              <option value="INR">₹ INR (Indian Rupee - Lakhs & Crores)</option>
              <option value="USD">$ USD (US Dollar - Millions)</option>
              <option value="EUR">€ EUR (Euro - Millions)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Number Notation System</label>
            <select
              value={settings.numberFormat}
              onChange={(e) => applySetting('numberFormat', e.target.value)}
              className="form-control"
            >
              <option value="indian">Indian Notation (₹1,50,000 / 1.5 Lakhs)</option>
              <option value="international">Western Standard (₹150,000 / 150K)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: Notifications & Reviewer Alerts */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <Bell size={20} color="var(--primary-teal)" />
          <h3 className="card-title" style={{ margin: 0 }}>Reviewer Notifications & Sound Alerts</h3>
        </div>
        <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
          Audio alerts and real-time warnings during underwriting evaluation
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              id: 'instantMismatchWarnings',
              title: 'Instant Document Mismatch Warnings',
              desc: 'Immediately display red banner when an uploaded file does not match the target document category.',
              value: settings.instantMismatchWarnings
            },
            {
              id: 'soundAlerts',
              title: 'Audio Chime on OCR Scan Completion',
              desc: 'Play a subtle acoustic tone when document scanning and checksum verification complete.',
              value: settings.soundAlerts
            },
            {
              id: 'autoSaveNotes',
              title: 'Auto-Save Loan Officer Review Notes',
              desc: 'Automatically commit reviewer annotations into borrower audit dossier during inspection.',
              value: settings.autoSaveNotes
            },
            {
              id: 'dailyDigest',
              title: 'Daily Underwriting Queue Digest',
              desc: 'Generate end-of-day summary reports of processed borrower applications.',
              value: settings.dailyDigest
            }
          ].map(item => (
            <div
              key={item.id}
              onClick={() => applySetting(item.id, !item.value)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.85rem 1rem', borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)', cursor: 'pointer',
                border: '1px solid var(--border-light)'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.desc}</div>
              </div>
              <div style={{
                width: '42px', height: '24px', borderRadius: '12px',
                backgroundColor: item.value ? 'var(--primary-teal)' : '#cbd5e1',
                position: 'relative', transition: 'background-color 0.2s ease', flexShrink: 0
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ffffff',
                  position: 'absolute', top: '3px',
                  left: item.value ? '21px' : '3px',
                  transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Privacy, Security & Data Governance */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <Shield size={20} color="var(--primary-teal)" />
          <h3 className="card-title" style={{ margin: 0 }}>Privacy, Security & Data Governance</h3>
        </div>
        <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
          Data masking, compliance governance, and audit trail export
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Mask Sensitive PII Toggle */}
          <div
            onClick={() => applySetting('maskPii', !settings.maskPii)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1rem', borderRadius: '8px',
              backgroundColor: 'var(--bg-subtle)', cursor: 'pointer',
              border: '1px solid var(--border-light)'
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {settings.maskPii ? <EyeOff size={15} color="var(--primary-teal)" /> : <Eye size={15} color="#64748b" />}
                <span>Mask Sensitive PII in Table Previews</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Conceals full 12-digit Aadhaar UID and PAN numbers across application lists (e.g., <code>XXXX XXXX 8901</code>) for DPDP Act 2023 compliance.
              </div>
            </div>
            <div style={{
              width: '42px', height: '24px', borderRadius: '12px',
              backgroundColor: settings.maskPii ? 'var(--primary-teal)' : '#cbd5e1',
              position: 'relative', transition: 'background-color 0.2s ease', flexShrink: 0
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ffffff',
                position: 'absolute', top: '3px',
                left: settings.maskPii ? '21px' : '3px',
                transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">Review Session Auto-Lock Timeout</label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => applySetting('sessionTimeout', e.target.value)}
                className="form-control"
              >
                <option value="15m">15 Minutes of Inactivity</option>
                <option value="30m">30 Minutes (Recommended)</option>
                <option value="1h">1 Hour</option>
                <option value="never">Never (Prototype Mode)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Compliance Audit Trail Export</label>
              <button
                onClick={exportAuditLog}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Download size={14} />
                <span>Export System Audit Log (.JSON)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Sandbox Records Management */}
      <div className="card" style={{ border: '1px solid #fecaca', backgroundColor: 'rgba(254, 242, 242, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <AlertTriangle size={18} color="#dc2626" />
              <h3 className="card-title" style={{ margin: 0, color: '#991b1b' }}>Sandbox Data Management</h3>
            </div>
            <p className="card-subtitle" style={{ color: '#b91c1c' }}>
              Clear applicant profiles, reset uploaded documents, and wipe test ledger entries.
            </p>
          </div>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: '#fca5a5', color: '#991b1b' }}
            disabled={resetting}
          >
            <Trash2 size={13} />
            <span>Clear All Borrower Records</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.5rem' }}>
              Clear All Stored Records?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              This action will delete all applicant profiles, uploaded verification documents, and transaction records from the sandbox database. This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleClearRecords}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                disabled={resetting}
              >
                {resetting ? 'Clearing...' : 'Yes, Wipe Sandbox Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
