import StatusStamp from './StatusStamp';

const RAIL_COLORS = {
  IN_STOCK: '#3F7A5C',
  LOW_STOCK: '#E8A33D',
  CRITICAL: '#C4432B',
  OUT_OF_STOCK: '#14181F',
};

export default function ProductCard({ product, onClick }) {
  const fillPct = Math.min(
    100,
    Math.round((product.current_stock / (product.maximum_stock || product.current_stock || 1)) * 100)
  );

  const railColor = RAIL_COLORS[product.status] || '#4A5B7A';

  return (
    <button
      onClick={() => onClick?.(product)}
      className="card-interactive card status-rail group flex flex-col h-full p-5 text-left overflow-hidden"
      style={{ borderLeftColor: railColor }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg font-semibold leading-tight text-ink group-hover:text-amber transition-colors truncate">
            {product.name}
          </p>
          <p className="font-mono text-xs text-ink/50 mt-1">{product.sku}</p>
        </div>
        <div className="flex-shrink-0">
          <StatusStamp status={product.status} />
        </div>
      </div>

      {/* Stock Info */}
      <div className="mt-auto">
        {/* Stock Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-ink">{product.current_stock} units</span>
            <span className="text-xs text-ink/50 font-mono">{fillPct}%</span>
          </div>
          <div className="h-2 bg-paper-dim rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${fillPct}%`,
                backgroundColor: railColor,
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line">
          <div>
            <p className="text-xs text-ink/50 font-mono uppercase tracking-wide">Min</p>
            <p className="text-sm font-mono font-bold text-ink">{product.minimum_stock}</p>
          </div>
          <div>
            <p className="text-xs text-ink/50 font-mono uppercase tracking-wide">Max</p>
            <p className="text-sm font-mono font-bold text-ink">{product.maximum_stock}</p>
          </div>
        </div>
      </div>
    </button>
  );
}
