import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders, ArrowRight, TrendingUp, TrendingDown, RefreshCw,
  Info, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react';
import RiskScoreGauge from '../components/RiskScoreGauge';

export default function WhatIfAnalysis({ currentApplicant }) {
  const baseFin = currentApplicant?.financials || {};
  const baselineScore = Number(currentApplicant?.creditScore) || 650;

  const baseUtility = Number(baseFin?.onTimeUtilityRatio ?? 0.88);
  const baseIncome = Number(baseFin?.avgMonthlyIncome ?? 32000);
  const baseBuffer = Number(baseFin?.bufferRatio ?? 0.35);
  const baseVolatility = Number(baseFin?.incomeVolatilityCv ?? 0.18);

  // Baseline PD resolution
  const baselinePdNum = useMemo(() => {
    if (typeof currentApplicant?.probabilityOfDefaultNum === 'number') {
      return currentApplicant.probabilityOfDefaultNum;
    }
    if (typeof currentApplicant?.probabilityOfDefault === 'string') {
      const parsed = parseFloat(currentApplicant.probabilityOfDefault.replace('%', '')) / 100;
      if (!isNaN(parsed)) return parsed;
    }
    return 0.12;
  }, [currentApplicant]);

  const baselinePdStr = typeof currentApplicant?.probabilityOfDefault === 'string'
    ? currentApplicant.probabilityOfDefault
    : `${(baselinePdNum * 100).toFixed(1)}%`;

  // Local state for interactive levers (isolated exclusively to this section)
  const [utilityRatio, setUtilityRatio] = useState(baseUtility);
  const [monthlyIncome, setMonthlyIncome] = useState(baseIncome);
  const [bufferRatio, setBufferRatio] = useState(baseBuffer);
  const [volatility, setVolatility] = useState(baseVolatility);

  // Synchronize levers to applicant baseline whenever borrower changes
  useEffect(() => {
    setUtilityRatio(Number(baseFin?.onTimeUtilityRatio ?? 0.88));
    setMonthlyIncome(Number(baseFin?.avgMonthlyIncome ?? 32000));
    setBufferRatio(Number(baseFin?.bufferRatio ?? 0.35));
    setVolatility(Number(baseFin?.incomeVolatilityCv ?? 0.18));
  }, [currentApplicant?.applicantRefId, currentApplicant?.id, currentApplicant?.creditScore]);

  const handleReset = () => {
    setUtilityRatio(baseUtility);
    setMonthlyIncome(baseIncome);
    setBufferRatio(baseBuffer);
    setVolatility(baseVolatility);
  };

  // Real-time synchronous calculation of simulated counterfactual outcome
  // Updates instantaneously without network latency, leaving baseline score unaffected elsewhere
  const simulation = useMemo(() => {
    const deltaUtility = (utilityRatio - baseUtility) * 160;
    const deltaIncome = ((monthlyIncome - baseIncome) / 10000) * 15;
    const deltaBuffer = (bufferRatio - baseBuffer) * 120;
    const deltaVol = (baseVolatility - volatility) * 140;

    const totalDelta = Math.round(deltaUtility + deltaIncome + deltaBuffer + deltaVol);
    const simScore = Math.max(300, Math.min(900, baselineScore + totalDelta));
    const scoreDelta = simScore - baselineScore;

    const simPdNum = Math.max(0.015, Math.min(0.75, baselinePdNum - (scoreDelta * 0.00065)));
    const simPdStr = `${(simPdNum * 100).toFixed(1)}%`;

    let band = "Intermediate-Risk Review Band";
    if (simScore >= 750) band = "Lower-Risk Review Band";
    else if (simScore < 600) band = "Higher-Risk Review Band";

    return {
      score: simScore,
      delta: scoreDelta,
      pd: simPdStr,
      band,
      deltaUtility: Math.round(deltaUtility),
      deltaIncome: Math.round(deltaIncome),
      deltaBuffer: Math.round(deltaBuffer),
      deltaVol: Math.round(deltaVol)
    };
  }, [utilityRatio, monthlyIncome, bufferRatio, volatility, baseUtility, baseIncome, baseBuffer, baseVolatility, baselineScore, baselinePdNum]);

  const appName = currentApplicant?.name || currentApplicant?.fullName || 'Applicant';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 className="card-title">Counterfactual & What-If Scenario Lab</h2>
            <span className="badge badge-teal">Live Real-Time Simulation</span>
          </div>
          <p className="card-subtitle">
            Simulate realistic financial actions for {appName} to see their projected effect on credit score and estimated default risk in real-time.
          </p>
        </div>

        <button onClick={handleReset} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} />
          <span>Reset to Baseline</span>
        </button>
      </div>

      {/* Grid: Sliders Controls + Simulated Score Gauge */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
        {/* Interactive Levers Panel */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              <Sliders size={18} color="#0d9488" />
              <span>Adjust Financial Assumptions</span>
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Drag levers to test impacts
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            {/* Utility Bill Discipline Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span className="form-label" style={{ marginBottom: 0 }}>On-Time Utility Payment Consistency</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0d9488' }}>
                    {Math.round(utilityRatio * 100)}% on-time
                  </strong>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: simulation.deltaUtility >= 0 ? '#ecfdf5' : '#fef2f2',
                    color: simulation.deltaUtility >= 0 ? '#047857' : '#b91c1c',
                    border: `1px solid ${simulation.deltaUtility >= 0 ? '#a7f3d0' : '#fecaca'}`
                  }}>
                    {simulation.deltaUtility >= 0 ? `+${simulation.deltaUtility}` : simulation.deltaUtility} pts
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0.40"
                max="1.00"
                step="0.01"
                value={utilityRatio}
                onChange={(e) => setUtilityRatio(parseFloat(e.target.value))}
                className="slider-control"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>40% (Frequent Delays)</span>
                <span>Baseline: {Math.round(baseUtility * 100)}%</span>
                <span>100% (Strict On-Time)</span>
              </div>
            </div>

            {/* Monthly Business Revenue Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span className="form-label" style={{ marginBottom: 0 }}>Average Monthly Business Income</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0d9488' }}>
                    ₹{Number(monthlyIncome).toLocaleString()} / mo
                  </strong>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: simulation.deltaIncome >= 0 ? '#ecfdf5' : '#fef2f2',
                    color: simulation.deltaIncome >= 0 ? '#047857' : '#b91c1c',
                    border: `1px solid ${simulation.deltaIncome >= 0 ? '#a7f3d0' : '#fecaca'}`
                  }}>
                    {simulation.deltaIncome >= 0 ? `+${simulation.deltaIncome}` : simulation.deltaIncome} pts
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="15000"
                max="90000"
                step="1000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(parseInt(e.target.value, 10))}
                className="slider-control"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>₹15,000</span>
                <span>Baseline: ₹{baseIncome.toLocaleString()}</span>
                <span>₹90,000</span>
              </div>
            </div>

            {/* Month-End Liquid Buffer Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span className="form-label" style={{ marginBottom: 0 }}>Month-End Cash Buffer Ratio</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0d9488' }}>
                    {Number(bufferRatio).toFixed(2)}x monthly expenses
                  </strong>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: simulation.deltaBuffer >= 0 ? '#ecfdf5' : '#fef2f2',
                    color: simulation.deltaBuffer >= 0 ? '#047857' : '#b91c1c',
                    border: `1px solid ${simulation.deltaBuffer >= 0 ? '#a7f3d0' : '#fecaca'}`
                  }}>
                    {simulation.deltaBuffer >= 0 ? `+${simulation.deltaBuffer}` : simulation.deltaBuffer} pts
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.01"
                value={bufferRatio}
                onChange={(e) => setBufferRatio(parseFloat(e.target.value))}
                className="slider-control"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>0.10x (Tight)</span>
                <span>Baseline: {baseBuffer.toFixed(2)}x</span>
                <span>0.80x (Healthy Reserve)</span>
              </div>
            </div>

            {/* Income Volatility Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span className="form-label" style={{ marginBottom: 0 }}>Monthly Cash Flow Volatility (CV)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0d9488' }}>
                    {(volatility * 100).toFixed(0)}% variation
                  </strong>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: simulation.deltaVol >= 0 ? '#ecfdf5' : '#fef2f2',
                    color: simulation.deltaVol >= 0 ? '#047857' : '#b91c1c',
                    border: `1px solid ${simulation.deltaVol >= 0 ? '#a7f3d0' : '#fecaca'}`
                  }}>
                    {simulation.deltaVol >= 0 ? `+${simulation.deltaVol}` : simulation.deltaVol} pts
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={volatility}
                onChange={(e) => setVolatility(parseFloat(e.target.value))}
                className="slider-control"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>5% (Predictable)</span>
                <span>Baseline: {(baseVolatility * 100).toFixed(0)}%</span>
                <span>50% (Volatile Swings)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Simulated Outcome Card */}
        <div className="card" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2rem 1.5rem', position: 'sticky', top: '5.5rem', alignSelf: 'start'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            Projected Counterfactual Score
          </div>

          <RiskScoreGauge
            score={simulation.score}
            min={300}
            max={900}
            pd={simulation.pd}
          />

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.35rem 0.85rem', borderRadius: '6px',
              backgroundColor: simulation.delta >= 0 ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${simulation.delta >= 0 ? '#a7f3d0' : '#fecaca'}`
            }}>
              {simulation.delta >= 0 ? <TrendingUp size={16} color="#047857" /> : <TrendingDown size={16} color="#991b1b" />}
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: simulation.delta >= 0 ? '#047857' : '#991b1b' }}>
                {simulation.delta >= 0 ? `+${simulation.delta} pts` : `${simulation.delta} pts`} from Baseline
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.4 }}>
              Baseline: {baselineScore} pts (PD: {baselinePdStr})
            </p>
            <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600, marginTop: '0.25rem' }}>
              Projected Band: {simulation.band}
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#f8fafc',
            borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%',
            fontSize: '0.75rem', color: '#475569'
          }}>
            <strong>Actionable Guidance:</strong> Sustaining on-time utility settlements and maintaining at least 3 weeks of liquid expense buffer produces the highest positive score impact.
          </div>
        </div>
      </div>

      {/* Ethical Governance Notice */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '0.85rem 1.25rem', backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.785rem', color: '#475569'
      }}>
        <Info size={16} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Fair Lending Boundary:</strong> What-If controls exclusively manipulate financial, operational, and settlement discipline variables.
          Personal demographic attributes (gender, caste, religion, residence geography) cannot be manipulated as they are strictly prohibited from credit score models. Baseline applicant scores remain fully protected and unaffected.
        </div>
      </div>
    </div>
  );
}
