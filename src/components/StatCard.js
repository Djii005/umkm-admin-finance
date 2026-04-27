'use client';
export default function StatCard({ title, value, icon, iconColor = 'blue', trend, trendLabel }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{title}</span>
        <div className={`stat-card-icon ${iconColor}`}>{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
      {trend !== undefined && (
        <div className={`stat-card-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel || ''}
        </div>
      )}
    </div>
  );
}
