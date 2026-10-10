import React from 'react';

export default function RiskScoreGauge({ score = 650, min = 300, max = 900, pd = "12.5%" }) {
  // Normalize percentage for arc
  const pct = Math.max(0, Math.min(1, (score - min) / (max - min)));
  const angle = pct * 180; // 0 to 180 degrees

  let color = "#10b981"; // green
  let band = "Lower Risk";
  if (score < 600) {
    color = "#ef4444"; // red
    band = "Higher Risk";
  } else if (score < 750) {
    color = "#f59e0b"; // amber
    band = "Moderate Risk";
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <svg width="220" height="130" viewBox="0 0 220 130">
        {/* Background Arc */}
        <path
          d="M 20 110 A 90 90 0 0 1 200 110"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Dynamic Colored Arc */}
        <path
          d="M 20 110 A 90 90 0 0 1 200 110"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray="283"
          strokeDashoffset={283 * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.15s ease, stroke 0.25s ease' }}
        />
      </svg>
      {/* Center Score Display */}
      <div style={{ marginTop: '-45px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
          SCALE: 300 – 900
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
          <span className={`badge ${score >= 750 ? 'badge-success' : (score >= 600 ? 'badge-warning' : 'badge-danger')}`}>
            {band}
          </span>
          <span className="badge badge-info" title="Platt-calibrated default probability">
            PD: {pd}
          </span>
        </div>
      </div>
    </div>
  );
}
