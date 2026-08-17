import StatusStamp from './StatusStamp';

const RAIL_COLORS = {
  IN_STOCK: '#3F7A5C',
  LOW_STOCK: '#E8A33D',
  CRITICAL: '#C4432B',
  OUT_OF_STOCK: '#14181F',
};

export default function StockTable({ products, onRowClick }) {
  if (!products || products.length === 0) {
    return (
      <div className="border border-line bg-white rounded-lg p-12 text-center">
        <p className="text-4xl mb-3">📦</p>
        <p className="font-display text-lg font-bold text-ink/70">No products found</p>
        <p className="text-sm text-ink/50 mt-1">Add products to start tracking your inventory.</p>
      </div>
    );
  }

  return (
    <div className="border border-line bg-white rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim border-b border-line">
            <tr>
              <th className="text-left py-4 px-5 font-semibold text-ink/70 font-mono text-xs uppercase tracking-wide">
                SKU
              </th>
              <th className="text-left py-4 px-5 font-semibold text-ink/70 font-mono text-xs uppercase tracking-wide">
                Product Name
              </th>
              <th className="text-left py-4 px-5 font-semibold text-ink/70 font-mono text-xs uppercase tracking-wide">
                Category
              </th>
              <th className="text-right py-4 px-5 font-semibold text-ink/70 font-mono text-xs uppercase tracking-wide">
                Current Stock
              </th>
              <th className="text-right py-4 px-5 font-semibold text-ink/70 font-mono text-xs uppercase tracking-wide">
                Minimum
              </th>
              <th className="text-center py-4 px-5 font-semibold text-ink/70 font-mono text-xs uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                onClick={() => onRowClick?.(p)}
                className="status-rail border-b border-line last:border-b-0 hover:bg-paper-dim/50 active:bg-paper-dim transition-all duration-200 cursor-pointer group"
                style={{ borderLeftColor: RAIL_COLORS[p.status] || '#4A5B7A' }}
              >
                <td className="py-4 px-5 font-mono text-xs font-semibold text-ink/60 group-hover:text-ink">
                  {p.sku}
                </td>
                <td className="py-4 px-5 font-medium text-ink group-hover:text-amber transition-colors">
                  {p.name}
                </td>
                <td className="py-4 px-5 text-ink/60 group-hover:text-ink/80">
                  {p.category || '—'}
                </td>
                <td className="py-4 px-5 text-right">
                  <span className="font-display font-bold text-ink">
                    {p.current_stock}
                  </span>
                </td>
                <td className="py-4 px-5 text-right font-mono text-ink/50">
                  {p.minimum_stock}
                </td>
                <td className="py-4 px-5 text-center">
                  <StatusStamp status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 p-4">
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => onRowClick?.(p)}
            className="status-rail p-4 rounded-lg bg-paper-dim/50 hover:bg-paper-dim active:bg-paper border transition-all duration-200 cursor-pointer"
            style={{ borderLeftColor: RAIL_COLORS[p.status] || '#4A5B7A' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="font-semibold text-ink line-clamp-1">{p.name}</p>
                <p className="text-xs font-mono text-ink/50 mt-0.5">{p.sku}</p>
              </div>
              <StatusStamp status={p.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-ink/50 font-mono uppercase mb-1">Stock</p>
                <p className="font-display font-bold text-lg text-ink">{p.current_stock}</p>
              </div>
              <div>
                <p className="text-xs text-ink/50 font-mono uppercase mb-1">Min</p>
                <p className="font-mono font-semibold text-ink/60">{p.minimum_stock}</p>
              </div>
            </div>
            {p.category && (
              <p className="text-xs text-ink/50 mt-3 pt-3 border-t border-line">
                {p.category}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
