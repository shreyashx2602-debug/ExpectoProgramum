import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { api } from '../services/api';

export default function DecisionModal({ isOpen, onClose, currentApplicant, onDecisionSaved, currentUser }) {
  const [decision, setDecision] = useState('APPROVED');
  const [approvedAmount, setApprovedAmount] = useState('40000');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const app = currentApplicant || {};
  const appName = app.name || app.fullName || 'Applicant';
  const refId = app.refId || app.applicantRefId || 'APP-2026-081';
  const score = app.creditScore || 650;
  const pd = app.probabilityOfDefault || '12%';
  const pdNum = app.probabilityOfDefaultNum || 0.12;
  const band = app.decisionBand || 'Intermediate-Risk Review Band';
  const rec = app.recommendation || 'Standard Review';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      applicantRefId: refId,
      modelScore: score,
      probabilityOfDefault: pdNum,
      modelDecisionBand: band,
      modelRecommendation: rec,
      humanDecision: decision,
      loanOfficerName: currentUser?.fullName || "Credit Reviewer",
      decisionNotes: notes || `Standard ${decision} review recorded based on alternative cash-flow corroboration.`,
      approvedAmount: decision === 'APPROVED' ? parseFloat(approvedAmount || 0) : 0
    };

    await api.recordDecision(payload);
    setLoading(false);
    onDecisionSaved(payload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Record Loan Officer Decision
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Applicant: <strong>{appName}</strong> ({refId})
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Model Baseline Reference */}
        <div style={{
          padding: '0.85rem 1rem', backgroundColor: '#f0fdfa',
          border: '1px solid #99f6e4', borderRadius: '8px',
          marginBottom: '1.25rem', fontSize: '0.825rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Model Recommendation:</span>
            <strong style={{ color: '#0f766e' }}>{band}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span>Illustrative Score:</span>
            <strong>{score} pts (PD: {pd})</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Final Human Underwriting Decision</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { val: 'APPROVED', label: 'Approve', color: '#10b981' },
                { val: 'REFERRED_MANUAL_REVIEW', label: 'Refer Review', color: '#f59e0b' },
                { val: 'DECLINED', label: 'Decline', color: '#ef4444' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setDecision(opt.val)}
                  style={{
                    padding: '0.6rem 0.5rem', borderRadius: '8px',
                    border: decision === opt.val ? `2px solid ${opt.color}` : '1px solid #e2e8f0',
                    backgroundColor: decision === opt.val ? '#f8fafc' : '#ffffff',
                    fontWeight: 700, fontSize: '0.8rem',
                    color: decision === opt.val ? opt.color : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {decision === 'APPROVED' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Approved Credit Facility (₹)</label>
              <input
                type="number"
                className="form-control"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="40000"
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reviewer Notes & Justification</label>
            <textarea
              className="form-control"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail reasons for decision, evidence verified, or adverse explanation..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Recording...' : 'Submit Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
