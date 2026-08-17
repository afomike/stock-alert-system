const STATUS_STYLES = {
  IN_STOCK: { color: '#3F7A5C', label: 'In Stock' },
  LOW_STOCK: { color: '#E8A33D', label: 'Low Stock' },
  CRITICAL: { color: '#C4432B', label: 'Critical' },
  OUT_OF_STOCK: { color: '#14181F', label: 'Out of Stock' },
  LOW: { color: '#3F7A5C', label: 'Low Risk' },
  MEDIUM: { color: '#E8A33D', label: 'Medium Risk' },
  HIGH: { color: '#C4432B', label: 'High Risk' },
};

/**
 * The app's signature label: a rotated, dashed-border "inspection stamp"
 * used everywhere a status or risk level needs to be called out.
 */
export default function StatusStamp({ status, label }) {
  const style = STATUS_STYLES[status] || { color: '#4A5B7A', label: status };
  return (
    <span className="stamp" style={{ color: style.color }}>
      {label || style.label}
    </span>
  );
}
