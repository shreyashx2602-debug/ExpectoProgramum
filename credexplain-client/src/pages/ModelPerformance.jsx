import React from 'react';
import {
  Activity, CheckCircle2, ShieldCheck, TrendingUp, BarChart2,
  Info, Layers, Sliders
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Legend
} from 'recharts';
import StatCard from '../components/StatCard';
import { MODEL_PERFORMANCE_METRICS } from '../data/mockData';

export default function ModelPerformance() {
  const perf = MODEL_PERFORMANCE_METRICS;
  const cm = perf.confusionMatrix;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="card-title">Model Diagnostics & Calibration Performance</h2>
          <p className="card-subtitle">
            Holdout test evaluation on {perf.trainingDatasetSize} with Platt sigmoid probability calibration.
          </p>
        </div>
        <span className="badge badge-success">Model Version: {perf.modelVersion}</span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="AUC-ROC Score"
          value={perf.aucRoc.toFixed(4)}
          subtitle="Strong Discriminatory Power"
          icon={TrendingUp}
          badge="0.80 Benchmark"
          badgeType="success"
        />
        <StatCard
          title="KS Statistic"
          value={perf.ksStatistic.toFixed(4)}
          subtitle="Maximum Cumulative Separation"
          icon={Activity}
          badge="High Separation"
          badgeType="teal"
        />
        <StatCard
          title="Precision"
          value={`${(perf.precision * 100).toFixed(1)}%`}
          subtitle="True Default Identifications"
          icon={CheckCircle2}
          badge="Balanced"
          badgeType="info"
        />
        <StatCard
          title="Recall (Sensitivity)"
          value={`${(perf.recall * 100).toFixed(1)}%`}
          subtitle="Default Capture Rate"
          icon={ShieldCheck}
          badge="High Recall"
          badgeType="teal"
        />
        <StatCard
          title="F1 Score"
          value={perf.f1Score.toFixed(3)}
          subtitle="Harmonic Precision-Recall Mean"
          icon={Layers}
          badge="Optimum"
          badgeType="success"
        />
      </div>

      {/* Visual Calibration Curve & Confusion Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
        {/* Calibration Curve Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 className="card-title">Probability Calibration Curve</h3>
              <p className="card-subtitle">Platt Sigmoid Scaled Probabilities vs Observed Empirical Default Rate</p>
            </div>
            <span className="badge badge-success">Close to Diagonal</span>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <LineChart
                data={perf.calibrationCurve}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="predictedProb" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} label={{ value: 'Predicted Probability', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} label={{ value: 'Empirical Default Rate', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="empiricalDefaultRate"
                  name="Calibrated Model"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0d9488' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2x2 Confusion Matrix */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h3 className="card-title">Test Set Confusion Matrix</h3>
            <p className="card-subtitle">750 Holdout evaluation applicants at 0.22 operating cutoff</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46' }}>True Negatives (TN)</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#065f46', marginTop: '0.25rem' }}>
                {cm.trueNegative}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#047857' }}>Correctly Approved (No Default)</div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>False Positives (FP)</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#92400e', marginTop: '0.25rem' }}>
                {cm.falsePositive}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#b45309' }}>Non-Defaulters Flagged Risk</div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}>False Negatives (FN)</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#991b1b', marginTop: '0.25rem' }}>
                {cm.falseNegative}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#b91c1c' }}>Missed Default Events</div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46' }}>True Positives (TP)</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#065f46', marginTop: '0.25rem' }}>
                {cm.truePositive}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#047857' }}>Correctly Flagged Defaults</div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Limitation Banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1',
        borderRadius: '10px', fontSize: '0.8rem', color: '#475569'
      }}>
        <Info size={18} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Validation Scope & Synthetic Data Disclaimer:</strong> The machine learning model is trained on
          5,000 synthetic micro-enterprise borrowers calibrated to replicate diverse livelihood cash patterns.
          Performance indicators (AUC-ROC 0.7994, KS 0.4705) demonstrate architectural efficacy and proper calibration
          for academic evaluation; they do not represent real-world commercial credit authorizations.
        </div>
      </div>
    </div>
  );
}
