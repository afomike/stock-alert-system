const RAIL_COLORS = {
  neutral: '#4A5B7A',
  amber: '#E8A33D',
  brick: '#C4432B',
  moss: '#3F7A5C',
};

const RAIL_BG = {
  neutral: '#4A5B7A10',
  amber: '#E8A33D10',
  brick: '#C4432B10',
  moss: '#3F7A5C10',
};

export default function MetricCard({ label, value, sublabel, rail = 'neutral', trend = null }) {
  return (
    <div
      className="card status-rail overflow-hidden hover:shadow-lg transition-all duration-300"
      style={{ borderLeftColor: RAIL_COLORS[rail], backgroundColor: RAIL_BG[rail] }}
    >
      <div className="p-5 space-y-2">
        {/* Label */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest font-semibold" style={{ color: RAIL_COLORS[rail] }}>
            {label}
          </span>
          {trend && (
            <span className={`text-xs font-bold ${trend > 0 ? 'text-success' : 'text-brick'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>

        {/* Value */}
        <div>
          <p className="font-display text-3xl md:text-4xl font-bold text-ink leading-none">
            {value}
          </p>
        </div>

        {/* Sublabel */}
        {sublabel && (
          <p className="text-sm text-ink/60 font-medium">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
