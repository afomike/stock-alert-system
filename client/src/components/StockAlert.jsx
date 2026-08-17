import StatusStamp from './StatusStamp';

const TYPE_TO_STATUS = {
  LOW_STOCK: 'LOW_STOCK',
  CRITICAL_STOCK: 'CRITICAL',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  PREDICTED_SHORTAGE: 'HIGH',
  REORDER_REQUIRED: 'LOW_STOCK',
  RESTOCK_DUE: 'LOW_STOCK',
};

const TYPE_ICONS = {
  LOW_STOCK: '📦',
  CRITICAL_STOCK: '🚨',
  OUT_OF_STOCK: '❌',
  PREDICTED_SHORTAGE: '⚠️',
  REORDER_REQUIRED: '🔄',
  RESTOCK_DUE: '📮',
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function StockAlert({ notification, onMarkRead }) {
  const status = TYPE_TO_STATUS[notification.type] || 'LOW_STOCK';
  const icon = TYPE_ICONS[notification.type] || '📋';
  
  const bgColor =
    status === 'CRITICAL' || status === 'OUT_OF_STOCK'
      ? 'bg-brick/5 border-brick/20'
      : status === 'LOW_STOCK'
      ? 'bg-amber/5 border-amber/20'
      : 'bg-slate/5 border-slate/20';

  const iconBg =
    status === 'CRITICAL' || status === 'OUT_OF_STOCK'
      ? 'bg-brick/10'
      : status === 'LOW_STOCK'
      ? 'bg-amber/10'
      : 'bg-slate/10';

  return (
    <div
      className={`card status-rail p-5 flex items-start gap-4 transition-all duration-200 ${
        notification.is_read ? 'opacity-60 hover:opacity-100' : 'hover:shadow-md'
      } ${bgColor}`}
      style={{
        borderLeftColor:
          status === 'CRITICAL' || status === 'OUT_OF_STOCK'
            ? '#C4432B'
            : status === 'LOW_STOCK'
            ? '#E8A33D'
            : '#4A5B7A',
      }}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center text-xl`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <StatusStamp status={status} label={notification.type.replace(/_/g, ' ')} />
            <span className="text-xs text-ink/40 font-mono whitespace-nowrap">{timeAgo(notification.created_at)}</span>
          </div>
          {!notification.is_read && (
            <div className="w-2 h-2 bg-warning rounded-full flex-shrink-0 mt-1.5"></div>
          )}
        </div>
        <p className="text-sm leading-relaxed text-ink/80">{notification.message}</p>
      </div>

      {/* Action */}
      {!notification.is_read && (
        <button
          onClick={() => onMarkRead?.(notification.id)}
          className="flex-shrink-0 btn btn-secondary btn-sm"
        >
          ✓ Read
        </button>
      )}
    </div>
  );
}
