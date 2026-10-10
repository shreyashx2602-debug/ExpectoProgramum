import React from 'react';
import {
  ShieldCheck, Calculator, FileCheck, ArrowRight, Activity, Scale,
  ChevronRight, Lock, CheckCircle2, TrendingUp, Sparkles, Building2, HelpCircle
} from 'lucide-react';

export default function LandingPage({ onExploreDemo, onOpenAuth, currentUser }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#0f172a' }}>
      {/* Top Navigation */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 3rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '1rem'
          }}>
            CS
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
              CreditSetu
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Explainable Alternative Credit Bridge
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
          <a href="#problem" style={{ color: 'inherit', textDecoration: 'none' }}>Overview</a>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
          <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How It Works</a>
          <a href="#explainability" style={{ color: 'inherit', textDecoration: 'none' }}>Explainable AI</a>
          <a href="#fairness" style={{ color: 'inherit', textDecoration: 'none' }}>Responsible AI</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => onOpenAuth('login')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>{currentUser ? 'Switch Account' : 'Sign in with Google'}</span>
          </button>
          <button
            onClick={onExploreDemo}
            className="btn btn-primary btn-sm"
            style={{ boxShadow: '0 2px 4px rgba(13, 148, 136, 0.25)' }}
          >
            <span>{currentUser ? `Go to Dashboard (${currentUser.fullName.split(' ')[0]})` : 'Enter Portal'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '5rem 2rem 4rem',
        maxWidth: '1200px', margin: '0 auto', textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '3.2rem', fontWeight: 900, color: '#0f172a',
          lineHeight: 1.15, letterSpacing: '-0.03em', maxWidth: '980px', margin: '0 auto 1.5rem'
        }}>
          Explainable Alternative Credit Scoring & Income Synthesis
        </h1>

        <p style={{
          fontSize: '1.25rem', color: '#475569', lineHeight: 1.6,
          maxWidth: '820px', margin: '0 auto 2.5rem'
        }}>
          Millions of micro-entrepreneurs—street food vendors, grocery shopkeepers, delivery riders, and artisans—earn
          reliable livelihood income without formal monthly payslips. CreditSetu synthesizes informal transaction streams,
          estimates repayment capacity, calculates calibrated risk, and explains every score factor in plain, dignified language.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={onExploreDemo}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.8rem', fontSize: '1rem', borderRadius: '10px' }}
          >
            <span>Open Credit Dashboard</span>
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.8rem', fontSize: '1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Sign Up / Continue with Google</span>
          </button>
        </div>

        {/* Visual Workflow Diagram */}
        <div style={{
          marginTop: '4rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '2.5rem 1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.5rem' }}>
            CreditSetu Assessment Pipeline
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { num: '01', title: 'Data Ingestion', desc: 'Collects UPI payments, utility bills, and rent records' },
              { num: '02', title: 'Income Synthesis', desc: 'Separates real business earnings from personal transfers' },
              { num: '03', title: 'Cash Flow Analysis', desc: 'Measures income stability, seasonality, and savings buffer' },
              { num: '04', title: 'Credit Scoring', desc: 'Calculates an illustrative credit score from 300 to 900' },
              { num: '05', title: 'Clear Explanations', desc: 'Explains every score factor in plain, simple language' },
              { num: '06', title: 'Human Review', desc: 'Gives loan officers complete context to make final decisions' }
            ].map((step, idx) => (
              <React.Fragment key={idx}>
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem 1rem',
                  width: '165px',
                  textAlign: 'left'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0d9488', marginBottom: '0.25rem' }}>
                    {step.num}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.3 }}>
                    {step.desc}
                  </div>
                </div>
                {idx < 5 && <ChevronRight size={18} color="#94a3b8" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
              Designed for Alternative Credit Assessment
            </h2>
            <p style={{ color: '#64748b', maxWidth: '640px', margin: '0.5rem auto 0' }}>
              Comprehensive FinTech tooling that bridges informal commerce with transparent underwriting.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: Calculator,
                title: "Income Synthesis",
                desc: "Identifies genuine sales receipts from UPI and cash logs, filtering out personal loans and non-business transfers."
              },
              {
                icon: FileCheck,
                title: "Document Verification",
                desc: "Verifies trade certificates, utility bills, and rental agreements using automated OCR and consistency checks."
              },
              {
                icon: TrendingUp,
                title: "Alternative Credit Scoring",
                desc: "Calculates an illustrative 300–900 score based on cash-flow discipline, earnings stability, and expense buffer."
              },
              {
                icon: Sparkles,
                title: "Explainable AI",
                desc: "Translates complex scoring variables into simple positive and negative factors that anyone can understand."
              },
              {
                icon: ShieldCheck,
                title: "Transaction Integrity",
                desc: "Audits payment history to verify genuine customer transactions and highlight ambiguous entries."
              },
              {
                icon: Scale,
                title: "Fairness & Privacy",
                desc: "Protects applicant privacy, strictly excludes demographic bias, and maintains a complete audit trail."
              }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="card" style={{ padding: '1.75rem' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    backgroundColor: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#0d9488', marginBottom: '1.25rem'
                  }}>
                    <Icon size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SHAP & Plain Language Showcase */}
      <section id="explainability" style={{ padding: '4.5rem 2rem', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Human-Centered Explainability
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, marginBottom: '1rem' }}>
                No Black Boxes. Every Recommendation Explained.
              </h2>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Underwriting models must earn the trust of both applicants and loan officers. CreditSetu translates complex
                multivariate model attributions into straightforward positive and negative factors.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>Clear Point Impact:</strong>
                    <div style={{ fontSize: '0.825rem', color: '#64748b' }}>Shows the exact points added or deducted for each financial behavior.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>Plain-Language Reasons:</strong>
                    <div style={{ fontSize: '0.825rem', color: '#64748b' }}>Translates complex technical variables into everyday financial terms.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>Interactive What-If Modeling:</strong>
                    <div style={{ fontSize: '0.825rem', color: '#64748b' }}>Shows realistic steps borrowers can take to build and improve their credit health.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Example Card */}
            <div className="card" style={{ backgroundColor: '#f8fafc', padding: '1.75rem', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Sample Applicant Explanation Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>Priya Sharma</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Street Food Vendor • APP-2026-081</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>761</div>
                  <span className="badge badge-success">Lower-Risk Band</span>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', marginBottom: '0.35rem' }}>
                  Top Positive Factors (+ Points)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.785rem' }}>
                  <div style={{ backgroundColor: '#ecfdf5', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    +42.5 pts • Paid utility bills consistently on time (94% track record).
                  </div>
                  <div style={{ backgroundColor: '#ecfdf5', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    +38.2 pts • Reliable monthly income buffer (₹29,000 floor).
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', marginTop: '1rem', marginBottom: '0.35rem' }}>
                  Key Risk Mitigation Areas (- Points)
                </div>
                <div style={{ backgroundColor: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #fecaca', fontSize: '0.785rem' }}>
                  -12.4 pts • Modest month-end emergency cash reserve.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsible AI & Privacy */}
      <section id="fairness" style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#2563eb', marginBottom: '1rem'
          }}>
            <Lock size={22} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            Responsible AI, Fairness & Privacy Safeguards
          </h2>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            CreditSetu is engineered with strict fairness principles. Protected demographic characteristics are excluded
            from credit-scoring features. Demographic parity and disparate impact ratios are audited against the 80% rule,
            and human loan officers retain final decision authority.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', textAlign: 'left' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                Data Minimization
              </div>
              <div style={{ fontSize: '0.785rem', color: '#64748b' }}>
                Personal identity numbers are masked; only necessary transaction data is processed.
              </div>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                Fairness Audits
              </div>
              <div style={{ fontSize: '0.785rem', color: '#64748b' }}>
                Continuous audits ensure balanced approval rates across all demographic groups.
              </div>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                Human Oversight
              </div>
              <div style={{ fontSize: '0.785rem', color: '#64748b' }}>
                AI provides recommendations only; loan officers review evidence and make final decisions.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0f172a', color: '#94a3b8',
        padding: '3rem 2rem 2rem', fontSize: '0.8rem', borderTop: '1px solid #1e293b'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.5rem' }}>
              CreditSetu
            </div>
            <div style={{ maxWidth: '380px', lineHeight: 1.5 }}>
              Explainable Alternative Credit Scoring & Informal Income Synthesizer.
              Empowering micro-entrepreneurs and micro-enterprises with fair, transparent credit evaluation.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>Platform Pages</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <a href="#problem" style={{ color: '#94a3b8', textDecoration: 'none' }}>Overview</a>
              <a href="#features" style={{ color: '#94a3b8', textDecoration: 'none' }}>Feature Modules</a>
              <a href="#explainability" style={{ color: '#94a3b8', textDecoration: 'none' }}>SHAP & LIME</a>
              <button onClick={onExploreDemo} style={{ background: 'none', border: 'none', color: '#0d9488', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                Open Dashboard →
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>Platform Architecture</div>
            <div style={{ maxWidth: '320px', lineHeight: 1.4, fontSize: '0.75rem', color: '#64748b' }}>
              CreditSetu empowers informal borrowers and micro-enterprises with explainable AI, alternative cash-flow synthesis, and fair credit evaluation.
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid #1e293b', textAlign: 'center', fontSize: '0.725rem' }}>
          © 2026 CreditSetu • Alternative Credit Scoring & Informal Income Synthesizer
        </div>
      </footer>
    </div>
  );
}
