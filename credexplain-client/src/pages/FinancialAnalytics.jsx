import React from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Activity, Calendar,
  ShieldCheck, AlertCircle, ArrowUpRight, Zap
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import StatCard from '../components/StatCard';

export default function FinancialAnalytics({ currentApplicant }) {
  const fin = currentApplicant?.financials || {};

  // 12-Month Historical Data for current applicant
  const monthlyData = React.useMemo(() => {
    const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    const baseInc = fin?.avgMonthlyIncome || 32000;
    const baseExp = fin?.avgMonthlyExpenses || 18000;
    return months.map((m, i) => {
      const multiplier = 1.0 + (Math.sin(i) * 0.08);
      const inc = Math.round(baseInc * multiplier);
      const exp = Math.round(baseExp * (1.0 + (Math.cos(i) * 0.05)));
      const surplus = Math.max(0, inc - exp);

      return {
        month: m,
        income: inc,
        expenses: exp,
        surplus: surplus,
        utilityOnTime: i !== 5 ? 100 : ((fin?.onTimeUtilityRatio || 0.9) < 0.85 ? 0 : 100)
      };
    });
  }, [currentApplicant?.slug, fin]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 8 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Avg Monthly Income"
          value={`₹${fin?.avgMonthlyIncome?.toLocaleString()}`}
          subtitle="Synthesized business inflows"
          icon={DollarSign}
          badge="Synthesized"
          badgeType="teal"
        />
        <StatCard
          title="Income Volatility (CV)"
          value={`${(fin?.incomeVolatilityCv * 100).toFixed(1)}%`}
          subtitle={fin?.incomeVolatilityCv < 0.20 ? 'Low / Predictable' : 'Moderate Volatility'}
          icon={Activity}
          badge={fin?.incomeVolatilityCv < 0.20 ? 'Stable' : 'Swing'}
          badgeType={fin?.incomeVolatilityCv < 0.20 ? 'success' : 'warning'}
        />
        <StatCard
          title="Avg Monthly Expenses"
          value={`₹${fin?.avgMonthlyExpenses?.toLocaleString()}`}
          subtitle="Operational & living outflows"
          icon={TrendingDown}
          badge="Estimated"
          badgeType="info"
        />
        <StatCard
          title="Estimated Monthly Surplus"
          value={`₹${fin?.estimatedSurplus?.toLocaleString()}`}
          subtitle={`${Math.round(fin?.surplusRatio * 100)}% net cash margin`}
          icon={TrendingUp}
          badge="Retained"
          badgeType="success"
        />
        <StatCard
          title="Lean-Month Income"
          value={`₹${fin?.leanMonthIncome?.toLocaleString()}`}
          subtitle="Stress-tested revenue floor"
          icon={Calendar}
          badge="Worst Month"
          badgeType="info"
        />
        <StatCard
          title="Active Income Days"
          value="24.8 / mo"
          subtitle="82.6% active trade ratio"
          icon={Calendar}
          badge="High Cadence"
          badgeType="teal"
        />
        <StatCard
          title="On-Time Utility Ratio"
          value={`${Math.round(fin?.onTimeUtilityRatio * 100)}%`}
          subtitle={`${fin?.avgUtilityDelayDays} days avg delay`}
          icon={Zap}
          badge={fin?.onTimeUtilityRatio >= 0.90 ? 'Disciplined' : 'Delayed'}
          badgeType={fin?.onTimeUtilityRatio >= 0.90 ? 'success' : 'warning'}
        />
        <StatCard
          title="Verified Inflow Rate"
          value="95.0%"
          subtitle="UPI QR counterparty matches"
          icon={ShieldCheck}
          badge="High Integrity"
          badgeType="success"
        />
      </div>

      {/* Visual Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Monthly Income vs Expense Comparison */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 className="card-title">12-Month Income vs Expense Trend</h3>
              <p className="card-subtitle">Synthesized monthly revenues against operating outflows</p>
            </div>
            <span className="badge badge-teal">₹ Indian Rupee</span>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Business Inflow" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Operating Expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Surplus Capacity Line Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 className="card-title">Net Cash Surplus Margin</h3>
              <p className="card-subtitle">Monthly buffer available after living and business expenses</p>
            </div>
            <span className="badge badge-success">Debt Service Basis</span>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Line
                  type="monotone"
                  dataKey="surplus"
                  name="Monthly Surplus"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Utility Bill Discipline & Cash Flow Buffer Explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>
            Utility Payment Consistency
          </h3>
          <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
            12-month on-time payment track record serves as alternative proxy for repayment discipline
          </p>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {monthlyData.map((m, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1, minWidth: '40px', padding: '0.5rem 0.25rem',
                  textAlign: 'center', borderRadius: '6px',
                  backgroundColor: m.utilityOnTime === 100 ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${m.utilityOnTime === 100 ? '#a7f3d0' : '#fecaca'}`
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.month}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: m.utilityOnTime === 100 ? '#047857' : '#991b1b', marginTop: '2px' }}>
                  {m.utilityOnTime === 100 ? 'On-Time' : 'Late'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
            Regular commercial electricity and water bill payments demonstrate municipal address stability
            and routine cash-flow discipline, protecting the credit score even in the absence of CIBIL bureau history.
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>
            Repayment Capacity Benchmark
          </h3>
          <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
            Conservative debt-service parameters for micro-lending
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Indicative Affordable EMI (38% of Surplus):</span>
              <strong style={{ color: '#0d9488' }}>₹{fin?.affordableEmi?.toLocaleString()} / month</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Conservative Stress Income (P25):</span>
              <strong style={{ color: '#0f172a' }}>₹{fin?.conservativeIncomeP25?.toLocaleString()} / month</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ color: '#64748b' }}>Month-End Retained Buffer:</span>
              <strong style={{ color: '#0f172a' }}>{fin?.bufferRatio}x monthly expenses</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
