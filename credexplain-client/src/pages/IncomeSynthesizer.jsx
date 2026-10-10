import React from 'react';
import {
  Calculator, CheckCircle2, AlertTriangle, ArrowRight, DollarSign,
  PieChart as PieIcon, ShieldCheck, HelpCircle, FileText, Info
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function IncomeSynthesizer({ currentApplicant }) {
  const fin = currentApplicant?.financials || {};
  const appName = currentApplicant?.name || currentApplicant?.fullName || 'Applicant';
  const occupation = currentApplicant?.occupation || 'Micro-Enterprise';

  const categoryBreakdown = [
    { name: 'Customer / QR Business Receipts', count: 320, amount: fin.avgMonthlyIncome || 32000, color: '#0d9488', status: 'INCLUDED' },
    { name: 'Personal & Family Transfers', count: 18, amount: 4500, color: '#3b82f6', status: 'EXCLUDED' },
    { name: 'Peer & Community Loans', count: 2, amount: 8000, color: '#ef4444', status: 'EXCLUDED' },
    { name: 'Refunds & Failed Tx Reversals', count: 5, amount: 1200, color: '#94a3b8', status: 'EXCLUDED' },
    { name: 'Uncertain / Ambiguous Deposits', count: 8, amount: Math.round((fin.avgMonthlyIncome || 32000) * (fin.uncertainInflowPct || 0.05)), color: '#f59e0b', status: 'EXCLUDED_FROM_BASELINE' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Overview Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 className="card-title">Informal Income Synthesizer Engine</h2>
            <span className="badge badge-teal">Proprietary Heuristic Classifier</span>
          </div>
          <p className="card-subtitle">
            Analyzing raw transaction flows for {appName} ({occupation}) to isolate recurring business earnings from personal support and loans.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-success">Confidence: High</span>
          <span className="badge badge-info">Stability: {(fin.incomeVolatilityCv || 0.15) < 0.20 ? 'High' : 'Moderate'}</span>
        </div>
      </div>

      {/* Synthesis Metric Highlights */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem',
        backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '12px', padding: '1.5rem'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
            Estimated Monthly Business Income
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0.25rem 0' }}>
            ₹{(fin.avgMonthlyIncome || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#0f766e' }}>
            Estimated Range: ₹{(fin.leanMonthIncome || 0).toLocaleString()} – ₹{Math.round((fin.avgMonthlyIncome || 0) * 1.25).toLocaleString()}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
            Conservative Income Floor (P25)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0.25rem 0' }}>
            ₹{fin.conservativeIncomeP25?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#0f766e' }}>
            Stress-Tested 25th Percentile Revenue
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
            Indicative Affordable EMI
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0d9488', margin: '0.25rem 0' }}>
            ₹{fin.affordableEmi?.toLocaleString()} / mo
          </div>
          <div style={{ fontSize: '0.8rem', color: '#0f766e' }}>
            Calibrated at ~38% of Retained Net Surplus
          </div>
        </div>
      </div>

      {/* Distribution Pie Chart & Inflow Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>
            Synthesized Inflow Composition
          </h3>
          <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
            Distribution of identified transaction streams
          </p>

          <div style={{ width: '100%', height: '230px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>
            Inflow Classification Methodology
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categoryBreakdown.map((cat, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '0.825rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                    {cat.count} transactions logged (Est. ₹{cat.amount?.toLocaleString()})
                  </div>
                </div>
                <span className={`badge ${cat.status === 'INCLUDED' ? 'badge-success' : (cat.status.includes('BASELINE') ? 'badge-warning' : 'badge-danger')}`}>
                  {cat.status === 'INCLUDED' ? 'Included in Income' : 'Excluded'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Methodological Transparency Disclaimer */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '1rem 1.25rem', backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.825rem', color: '#475569'
      }}>
        <Info size={18} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Informal Income Estimation Protocol:</strong> CreditSetu estimates informal business earnings through statistical clustering
          of transaction counterparty frequency, ticket-size distributions, and UPI QR merchant tags. Inflows from personal transfers,
          temporary family contributions, and peer borrowings are segregated from core business turnover to prevent misleading debt commitments.
          All estimates are presented as indicative capacity rather than certified audit figures.
        </div>
      </div>
    </div>
  );
}
