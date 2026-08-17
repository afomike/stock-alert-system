export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  const baseClass = 'btn';
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    warning: 'btn-warning',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }[variant];

  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }[size];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}
