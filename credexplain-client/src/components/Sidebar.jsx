import React from 'react';
import {
  LayoutDashboard, Users, FileCheck, ArrowLeftRight, BarChart3,
  Calculator, ShieldCheck, Sparkles, Sliders,
  FileText, Activity, Scale, Settings, LogOut, ChevronRight, UserCheck
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  currentApplicant,
  setCurrentApplicant,
  allApplicants,
  onOpenNewApplicant
}) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'applicants', label: 'Applicants', icon: Users },
    { id: 'documents', label: 'Document Verification', icon: FileCheck },
    { id: 'transactions', label: 'Transaction Verification', icon: ArrowLeftRight },
    { id: 'analytics', label: 'Financial Analytics', icon: BarChart3 },
    { id: 'income-synthesizer', label: 'Income Synthesizer', icon: Calculator },
    { id: 'credit-scoring', label: 'Credit Scoring', icon: ShieldCheck },
    { id: 'explainable-ai', label: 'Explainable AI', icon: Sparkles },
    { id: 'what-if', label: 'What-If Analysis', icon: Sliders },
    { id: 'reports', label: 'Reports & Notice', icon: FileText },
    { id: 'model-performance', label: 'Model Performance', icon: Activity },
    { id: 'fairness-audit', label: 'Fairness & Audit', icon: Scale },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '0.95rem'
          }}>
            CS
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.02em' }}>
              CreditSetu
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.1 }}>
              Explainable Credit Bridge
            </div>
          </div>
        </div>
      </div>

      {/* Applicant Selector & Add Borrower Action */}
      <div style={{ padding: '0.85rem 1.15rem', backgroundColor: '#131f37', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Borrower
          </div>
          <button
            onClick={onOpenNewApplicant}
            style={{
              background: 'none', border: 'none', color: '#38bdf8',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0
            }}
          >
            + Add New
          </button>
        </div>

        {allApplicants && allApplicants.length > 0 ? (
          <>
            <select
              value={currentApplicant?.applicantRefId || currentApplicant?.refId || currentApplicant?.slug || ''}
              onChange={(e) => {
                const found = allApplicants.find(a => 
                  (a.applicantRefId && a.applicantRefId === e.target.value) ||
                  (a.refId && a.refId === e.target.value) ||
                  (a.slug && a.slug === e.target.value) ||
                  (a.id && String(a.id) === e.target.value)
                );
                if (found) setCurrentApplicant(found);
              }}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '0.45rem 0.6rem',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {allApplicants.map((a, idx) => {
                const optVal = a?.applicantRefId || a?.refId || a?.slug || (a?.id ? String(a.id) : `app-${idx}`);
                const optLabel = `${a?.name || a?.fullName || 'Applicant'} (${a?.businessName || a?.occupation || 'Enterprise'})`;
                return (
                  <option key={optVal} value={optVal}>
                    {optLabel}
                  </option>
                );
              })}
            </select>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.7rem' }}>
              <span style={{ color: '#64748b' }}>ID: {currentApplicant?.refId || currentApplicant?.applicantRefId || 'N/A'}</span>
              <span style={{ color: (currentApplicant?.creditScore || 650) >= 740 ? '#34d399' : ((currentApplicant?.creditScore || 650) >= 620 ? '#fbbf24' : '#f87171'), fontWeight: 700 }}>
                Score: {currentApplicant?.creditScore || 'N/A'}
              </span>
            </div>
          </>
        ) : (
          <div style={{
            padding: '0.65rem 0.75rem', backgroundColor: '#0f172a',
            borderRadius: '6px', border: '1px dashed #334155', textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 0.4rem 0' }}>
              No borrower records present
            </p>
            <button
              onClick={onOpenNewApplicant}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}
            >
              + Add Applicant
            </button>
          </div>
        )}
      </div>

      {/* Nav Menu Items */}
      <nav style={{ flex: 1, padding: '0.85rem 0.75rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: isActive ? '#0d9488' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <Icon size={16} color={isActive ? '#ffffff' : '#64748b'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={14} color="#ffffff" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Status & Sign Out */}
      <div style={{ padding: '0.85rem 1.15rem', borderTop: '1px solid #1e293b', backgroundColor: '#0b1324' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #0d9488' }}
            />
          ) : (
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#0d9488', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700
            }}>
              {currentUser?.fullName?.[0] || 'U'}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {currentUser?.fullName || 'User'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
              <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600 }}>
                {currentUser?.role || 'USER'}
              </span>
              {currentUser?.authProvider === 'GOOGLE' && (
                <span style={{
                  fontSize: '0.62rem', backgroundColor: '#1e3a8a', color: '#93c5fd',
                  padding: '1px 5px', borderRadius: '4px', fontWeight: 700
                }}>
                  Google
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log Out"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
