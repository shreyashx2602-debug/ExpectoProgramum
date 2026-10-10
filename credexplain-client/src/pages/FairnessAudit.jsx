import React, { useState, useEffect } from 'react';
import {
  Scale, Shield, Lock, CheckCircle2, AlertTriangle, FileText,
  Clock, Activity, Info
} from 'lucide-react';
import { FAIRNESS_METRICS } from '../data/mockData';
import { api } from '../services/api';

export default function FairnessAudit() {
  const [auditLogs, setAuditLogs] = useState([]);
  const fairness = FAIRNESS_METRICS;

  useEffect(() => {
    api.getAuditLogs().then(logs => setAuditLogs(logs));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 className="card-title">Algorithmic Fairness, Privacy & Governance Audit</h2>
            <span className="badge badge-success">80% Rule Met</span>
          </div>
          <p className="card-subtitle">
            Auditing demographic parity, disparate impact ratios, data minimization, and immutable administrative event logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-teal">Disparate Impact: 94.2%</span>
          <span className="badge badge-info">Audited Cohort: 750 Test Borrowers</span>
        </div>
      </div>

      {/* Demographic Parity & Geographic Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Gender Demographic Cohorts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 className="card-title">Gender Cohort Parity (Synthetic Evaluation)</h3>
              <p className="card-subtitle">Comparing selection rates between female and male micro-entrepreneurs</p>
            </div>
            <span className="badge badge-success">94.2% Parity</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th>Sample Size</th>
                  <th>Avg Score</th>
                  <th>Approval Rate</th>
                  <th>Disparate Impact</th>
                </tr>
              </thead>
              <tbody>
                {fairness.cohorts.map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.group}</strong></td>
                    <td>{c.sampleSize}</td>
                    <td><strong>{c.avgScore}</strong></td>
                    <td>{(c.selectionRate * 100).toFixed(1)}%</td>
                    <td>
                      <span className="badge badge-success">
                        {(c.disparateImpactRatio * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0fdfa', borderRadius: '8px', fontSize: '0.785rem', color: '#0f766e' }}>
            <strong>Regulatory Standard:</strong> Under the EEOC 4/5ths (80%) rule, selection rates for any demographic cohort
            must not fall below 80% of the reference group. CreditSetu achieves 94.2%, confirming balanced credit accessibility.
          </div>
        </div>

        {/* Geographic Segmentation */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h3 className="card-title">Geographic Inclusivity Audit</h3>
            <p className="card-subtitle">Performance balance across urban, semi-urban, and rural trading hubs</p>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Territory Segment</th>
                  <th>Sample</th>
                  <th>Avg Score</th>
                  <th>Approval Rate</th>
                </tr>
              </thead>
              <tbody>
                {fairness.geography.map((g, i) => (
                  <tr key={i}>
                    <td><strong>{g.segment}</strong></td>
                    <td>{g.sampleSize}</td>
                    <td><strong>{g.avgScore}</strong></td>
                    <td>{(g.selectionRate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Privacy & Responsible AI Safeguards Grid */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>
          <Lock size={18} color="#0d9488" />
          <span>Active Privacy, Cryptographic & Human Oversight Safeguards</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.825rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
              Feature Segregation (Anti-Bias)
            </div>
            <div style={{ color: '#64748b', lineHeight: 1.4 }}>
              Protected characteristics (gender, religion, caste, exact street address) are strictly prohibited from scoring inputs.
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
              Data Minimization & Tokenization
            </div>
            <div style={{ color: '#64748b', lineHeight: 1.4 }}>
              Identity identifiers (Aadhaar / PAN) are synthetically masked in demo mode and never stored as plaintext strings in ordinary logs.
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
              Role-Based Access Control (RBAC)
            </div>
            <div style={{ color: '#64748b', lineHeight: 1.4 }}>
              Granular access separating micro-entrepreneur profile management, underwriting decisioning, and model audit records.
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
              Human-in-the-Loop Safeguard
            </div>
            <div style={{ color: '#64748b', lineHeight: 1.4 }}>
              Scores are assistive recommendations. Formal loan authorizations require human review, notes, and concurrence.
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Audit Events Log */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>
          <Clock size={18} color="#0d9488" />
          <span>System Audit Trail & Review Log</span>
        </h3>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor / Role</th>
                <th>Action Code</th>
                <th>Resource Target</th>
                <th>Event Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                    {log.eventTimestamp?.replace('T', ' ')?.substring(0, 19)}
                  </td>
                  <td><strong>{log.actor}</strong></td>
                  <td>
                    <span className="badge badge-teal">{log.action}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {log.resourceType}: {log.resourceId}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
