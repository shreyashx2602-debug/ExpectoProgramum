import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Shield, ExternalLink, Database, LogOut, ChevronDown, UserCheck, UserPlus, Trash2, Sun, Moon } from 'lucide-react';

export default function Navbar({
  pageTitle,
  pageSubtitle,
  currentApplicant,
  currentUser,
  onResetDemo,
  onSwitchToLanding,
  onOpenAuth,
  onLogout,
  onOpenNewApplicant
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      const saved = localStorage.getItem('credexplain_settings');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed.theme = next;
      localStorage.setItem('credexplain_settings', JSON.stringify(parsed));
    } catch (e) {}
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="top-bar">
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {pageSubtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Add Applicant Button */}
        <button
          onClick={onOpenNewApplicant}
          className="btn btn-primary btn-sm"
          title="Provide New Borrower Information"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <UserPlus size={14} />
          <span>+ Add Applicant</span>
        </button>

        {/* Clear Data Button with Protective Confirmation */}
        <button
          onClick={() => setShowClearConfirm(true)}
          className="btn btn-secondary btn-sm"
          title="Clear all stored applicants"
        >
          <Trash2 size={13} />
          <span>Clear Records</span>
        </button>

        {/* Public Homepage Link */}
        <button
          onClick={onSwitchToLanding}
          className="btn btn-secondary btn-sm"
          title="View Public Landing Page"
        >
          <ExternalLink size={13} />
          <span>Public Portal</span>
        </button>

        {/* Quick Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{ padding: '0.4rem 0.6rem' }}
        >
          {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#64748b" />}
        </button>

        {/* User Pill & Interactive Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.55rem',
              padding: '0.35rem 0.75rem', backgroundColor: '#ffffff',
              borderRadius: '8px', border: '1px solid var(--border-light)',
              cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                backgroundColor: 'var(--primary-teal)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700
              }}>
                {currentUser?.fullName?.[0] || 'U'}
              </div>
            )}
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                {currentUser?.fullName || 'Loan Officer'}
              </span>
            </div>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {/* Profile Dropdown Card */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: '115%', right: 0, width: '280px',
              backgroundColor: '#ffffff', borderRadius: '12px',
              border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              padding: '1rem', zIndex: 100
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    backgroundColor: '#0d9488', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: 700
                  }}>
                    {currentUser?.fullName?.[0] || 'U'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser?.fullName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser?.email}
                  </div>
                </div>
              </div>

              {/* Status Details */}
              <div style={{
                backgroundColor: '#f8fafc', borderRadius: '8px',
                padding: '0.6rem 0.75rem', marginBottom: '0.85rem',
                fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '0.35rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Assigned Role:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{currentUser?.role || 'APPLICANT'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Auth Provider:</span>
                  <span style={{ fontWeight: 700, color: currentUser?.authProvider === 'GOOGLE' ? '#2563eb' : '#0d9488' }}>
                    {currentUser?.authProvider === 'GOOGLE' ? 'Google Account' : 'Database Account'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Storage:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>H2 Disk DB (Active)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
                >
                  <UserCheck size={14} />
                  <span>Switch / Google Sign-In</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', color: '#dc2626', borderColor: '#fecaca' }}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Prevent Accidental Deletions */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)} style={{ zIndex: 9999 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.5rem' }}>
              Clear All Stored Records?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to delete all borrower profiles, documents, and transaction records? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  if (onResetDemo) onResetDemo();
                }}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                Yes, Clear All Records
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
