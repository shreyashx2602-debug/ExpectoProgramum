import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import OverviewDashboard from './pages/OverviewDashboard';
import ApplicantProfile from './pages/ApplicantProfile';
import DocumentVerification from './pages/DocumentVerification';
import TransactionVerification from './pages/TransactionVerification';
import FinancialAnalytics from './pages/FinancialAnalytics';
import IncomeSynthesizer from './pages/IncomeSynthesizer';
import CreditScoring from './pages/CreditScoring';
import ExplainableAI from './pages/ExplainableAI';
import WhatIfAnalysis from './pages/WhatIfAnalysis';
import ReportsPage from './pages/ReportsPage';
import ModelPerformance from './pages/ModelPerformance';
import FairnessAudit from './pages/FairnessAudit';
import SettingsPage from './pages/SettingsPage';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import DecisionModal from './components/DecisionModal';
import NewApplicantModal from './components/NewApplicantModal';
import { UserPlus } from 'lucide-react';

import { api } from './services/api';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'dashboard'
  const [activeTab, setActiveTab] = useState('overview');
  const [applicants, setApplicants] = useState(() => {
    try {
      const raw = localStorage.getItem('creditsetu_applicants') || localStorage.getItem('credexplain_applicants');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [currentApplicant, setCurrentApplicant] = useState(() => {
    try {
      const raw = localStorage.getItem('creditsetu_current_applicant') || localStorage.getItem('credexplain_current_applicant');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.refId || parsed.name || parsed.fullName)) return parsed;
      }
      const listRaw = localStorage.getItem('creditsetu_applicants') || localStorage.getItem('credexplain_applicants');
      if (listRaw) {
        const parsedList = JSON.parse(listRaw);
        if (Array.isArray(parsedList) && parsedList.length > 0) return parsedList[0];
      }
    } catch (e) {}
    return null;
  });
  const [newApplicantModalOpen, setNewApplicantModalOpen] = useState(false);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('credexplain_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.fullName && !u.email?.includes('.demo') && !u.email?.includes('officer@credexplain.demo')) {
          return u;
        }
      }
    } catch (e) {}
    return {
      id: 1,
      email: 'officer@creditsetu.com',
      fullName: 'Loan Officer',
      role: 'LOAN_OFFICER',
      authProvider: 'LOCAL',
      token: 'LOCAL-TOKEN'
    };
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);

  // Initialize theme & interface preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem('credexplain_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme) {
          if (parsed.theme === 'system') {
            const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
          } else {
            document.documentElement.setAttribute('data-theme', parsed.theme);
          }
        }
        if (parsed.accent) document.documentElement.setAttribute('data-accent', parsed.accent);
        if (parsed.density) document.documentElement.setAttribute('data-density', parsed.density);
        if (parsed.fontSize) document.documentElement.setAttribute('data-font-size', parsed.fontSize);
      }
    } catch (e) {}
  }, []);

  // Fetch from backend and merge with local state
  useEffect(() => {
    api.getApplicants().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setApplicants(data);
        setCurrentApplicant(prev => {
          if (prev && (prev.refId || prev.applicantRefId || prev.slug)) {
            const matched = data.find(d => 
              (d.id && prev.id && d.id === prev.id) ||
              d.refId === prev.refId ||
              d.applicantRefId === prev.applicantRefId ||
              d.slug === prev.slug
            );
            if (matched) return { ...prev, ...matched };
          }
          return prev || data[0];
        });
      }
    }).catch(() => {});
  }, []);

  // Sync to local storage whenever applicants list updates
  useEffect(() => {
    try {
      if (applicants && applicants.length > 0) {
        localStorage.setItem('creditsetu_applicants', JSON.stringify(applicants));
        localStorage.setItem('credexplain_applicants', JSON.stringify(applicants));
      }
    } catch (e) {}
  }, [applicants]);

  // Sync to local storage whenever active applicant updates
  useEffect(() => {
    try {
      if (currentApplicant) {
        localStorage.setItem('creditsetu_current_applicant', JSON.stringify(currentApplicant));
        localStorage.setItem('credexplain_current_applicant', JSON.stringify(currentApplicant));
      }
    } catch (e) {}
  }, [currentApplicant]);

  const handleSelectApplicant = (app) => {
    setCurrentApplicant(app);
    try {
      localStorage.setItem('creditsetu_current_applicant', JSON.stringify(app));
      localStorage.setItem('credexplain_current_applicant', JSON.stringify(app));
    } catch (e) {}
  };

  const handleResetDemo = async () => {
    try {
      localStorage.removeItem('creditsetu_applicants');
      localStorage.removeItem('credexplain_applicants');
      localStorage.removeItem('creditsetu_current_applicant');
      localStorage.removeItem('credexplain_current_applicant');
    } catch (e) {}
    setApplicants([]);
    setCurrentApplicant(null);
    try {
      await fetch("http://localhost:8080/api/applicants/clear", { method: "POST" });
    } catch (e) {}
  };

  const handleApplicantCreated = (newApp) => {
    setApplicants(prev => {
      const filtered = prev.filter(a => 
        (!newApp.id || a.id !== newApp.id) &&
        a.refId !== newApp.refId && 
        a.applicantRefId !== newApp.applicantRefId && 
        a.slug !== newApp.slug
      );
      const updated = [newApp, ...filtered];
      try {
        localStorage.setItem('creditsetu_applicants', JSON.stringify(updated));
        localStorage.setItem('credexplain_applicants', JSON.stringify(updated));
        localStorage.setItem('creditsetu_current_applicant', JSON.stringify(newApp));
        localStorage.setItem('credexplain_current_applicant', JSON.stringify(newApp));
      } catch (e) {}
      return updated;
    });
    setCurrentApplicant(newApp);
    setActiveTab('overview');
  };

  const handleApplicantUpdated = (updatedApp) => {
    if (!updatedApp) return;
    setCurrentApplicant(prev => {
      const merged = { ...prev, ...updatedApp };
      try {
        localStorage.setItem('creditsetu_current_applicant', JSON.stringify(merged));
        localStorage.setItem('credexplain_current_applicant', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
    setApplicants(prev => {
      const matchIdx = prev.findIndex(a => 
        (updatedApp.id && a.id === updatedApp.id) ||
        (updatedApp.refId && (a.refId === updatedApp.refId || a.applicantRefId === updatedApp.refId)) ||
        (updatedApp.applicantRefId && (a.refId === updatedApp.applicantRefId || a.applicantRefId === updatedApp.applicantRefId)) ||
        (updatedApp.slug && a.slug === updatedApp.slug)
      );
      let updatedList;
      if (matchIdx >= 0) {
        updatedList = [...prev];
        updatedList[matchIdx] = { ...updatedList[matchIdx], ...updatedApp };
      } else {
        updatedList = [updatedApp, ...prev];
      }
      try {
        localStorage.setItem('creditsetu_applicants', JSON.stringify(updatedList));
        localStorage.setItem('credexplain_applicants', JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('credexplain_user', JSON.stringify(user));
    } catch (e) {}
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('credexplain_user');
    } catch (e) {}
    setView('landing');
  };

  const appName = currentApplicant?.name || currentApplicant?.fullName || 'Applicant';

  // Tab Title helper
  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return { title: 'Loan Officer Operations Overview', sub: 'High-level queue metrics, cash-flow volume, and recent verification audits' };
      case 'applicants': return { title: 'Applicant Profile & Verification', sub: `Profile metadata and premises tenancy evidence for ${appName}` };
      case 'documents': return { title: 'Financial Document Verification', sub: 'Technical OCR checks, consistency scoring, and issuer review' };
      case 'transactions': return { title: 'Transaction Verification & Ledger Audit', sub: 'Normalized transaction processing and verification rate breakdown' };
      case 'analytics': return { title: 'Financial Analytics Dashboard', sub: '12-month synthesized cash flows, surplus metrics, and utility discipline' };
      case 'income-synthesizer': return { title: 'Informal Income Synthesizer', sub: 'Classifying business receipts vs personal loans and non-business transfers' };
      case 'credit-scoring': return { title: 'Calibrated Credit Scoring', sub: 'Illustrative 300-900 score and Platt-calibrated probability of default' };
      case 'explainable-ai': return { title: 'Explainable AI (SHAP & LIME)', sub: 'Game-theoretic feature attributions and plain-language reason codes' };
      case 'what-if': return { title: 'What-If Counterfactual Simulator', sub: 'Interactive hypothetical scenario modeling for financial empowerment' };
      case 'reports': return { title: 'Audit Reports & Adverse Action Notice', sub: 'Downloadable PDF dossier and transparent decision explanations' };
      case 'model-performance': return { title: 'Model Diagnostics & Validation', sub: 'AUC-ROC, KS statistic, confusion matrix, and probability calibration' };
      case 'fairness-audit': return { title: 'Fairness, Privacy & Governance Audit', sub: 'Disparate impact 80% rule compliance and immutable audit history' };
      case 'settings': return { title: 'Application Preferences & System Settings', sub: 'Appearance, dark/light themes, underwriting preferences, and data governance controls' };
      default: return { title: 'CreditSetu Portal', sub: '' };
    }
  };

  // Render Public Landing Page
  if (view === 'landing') {
    return (
      <>
        <LandingPage
          onExploreDemo={() => {
            setView('dashboard');
            setActiveTab('overview');
          }}
          onOpenAuth={() => setAuthModalOpen(true)}
          currentUser={currentUser}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  const { title, sub } = getTabTitle();

  // Render Authenticated Dashboard
  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab === 'applicants' ? 'applicants' : activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        currentApplicant={currentApplicant}
        setCurrentApplicant={setCurrentApplicant}
        allApplicants={applicants}
        onOpenNewApplicant={() => setNewApplicantModalOpen(true)}
      />

      {/* Main Content Pane */}
      <div className="main-content">
        <Navbar
          pageTitle={title}
          pageSubtitle={sub}
          currentApplicant={currentApplicant}
          currentUser={currentUser}
          onResetDemo={handleResetDemo}
          onSwitchToLanding={() => setView('landing')}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenNewApplicant={() => setNewApplicantModalOpen(true)}
        />

        <main className="page-body">
          {!currentApplicant && activeTab !== 'model-performance' && activeTab !== 'fairness-audit' && activeTab !== 'settings' ? (
            <div style={{
              textAlign: 'center', padding: '4.5rem 2rem',
              backgroundColor: '#ffffff', borderRadius: '16px',
              border: '1.5px dashed #cbd5e1', maxWidth: '640px', margin: '2.5rem auto',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: '#f0fdfa', color: '#0d9488',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <UserPlus size={32} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                No Borrower Records Present
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '460px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
                All sample records have been removed. Provide borrower details by clicking below to run alternative credit scoring and explainable analytics on your data.
              </p>
              <button
                onClick={() => setNewApplicantModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.6rem', fontSize: '0.925rem', borderRadius: '8px' }}
              >
                <UserPlus size={16} style={{ marginRight: '6px' }} />
                <span>+ Add New Borrower Application</span>
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewDashboard
                  applicants={applicants}
                  onSelectApplicant={handleSelectApplicant}
                  currentApplicant={currentApplicant}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'applicants' && (
                <ApplicantProfile
                  currentApplicant={currentApplicant}
                  onNavigateTab={setActiveTab}
                  onApplicantUpdated={handleApplicantUpdated}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentVerification
                  currentApplicant={currentApplicant}
                  onApplicantUpdated={handleApplicantUpdated}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionVerification
                  currentApplicant={currentApplicant}
                  onApplicantUpdated={handleApplicantUpdated}
                />
              )}

              {activeTab === 'analytics' && (
                <FinancialAnalytics
                  currentApplicant={currentApplicant}
                />
              )}

              {activeTab === 'income-synthesizer' && (
                <IncomeSynthesizer
                  currentApplicant={currentApplicant}
                />
              )}

              {activeTab === 'credit-scoring' && (
                <CreditScoring
                  currentApplicant={currentApplicant}
                  onNavigateTab={setActiveTab}
                  onApplicantUpdated={handleApplicantUpdated}
                />
              )}

              {activeTab === 'explainable-ai' && (
                <ExplainableAI
                  currentApplicant={currentApplicant}
                />
              )}

              {activeTab === 'what-if' && (
                <WhatIfAnalysis
                  currentApplicant={currentApplicant}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsPage
                  currentApplicant={currentApplicant}
                  currentUser={currentUser}
                />
              )}
            </>
          )}

          {activeTab === 'model-performance' && (
            <ModelPerformance />
          )}

          {activeTab === 'fairness-audit' && (
            <FairnessAudit />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              onResetDemo={handleResetDemo}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <DecisionModal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        currentApplicant={currentApplicant}
        currentUser={currentUser}
        onDecisionSaved={(d) => {
          if (currentApplicant) {
            handleApplicantUpdated({
              ...currentApplicant,
              humanDecision: d.humanDecision,
              verificationStatus: d.humanDecision === 'APPROVED' ? 'VERIFIED' : currentApplicant.verificationStatus
            });
          }
        }}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <NewApplicantModal
        isOpen={newApplicantModalOpen}
        onClose={() => setNewApplicantModalOpen(false)}
        onApplicantCreated={handleApplicantCreated}
      />
    </div>
  );
}
