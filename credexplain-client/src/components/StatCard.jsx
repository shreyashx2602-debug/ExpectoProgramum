import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, badge, badgeType = 'info', trend }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {Icon && (
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-teal)' }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {value}
        </span>
        {badge && (
          <span className={`badge badge-${badgeType}`}>
            {badge}
          </span>
        )}
      </div>
      {(subtitle || trend) && (
        <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
