export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  const textSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClass} border-3 border-line border-t-slate rounded-full animate-spin`} />
      {text && <p className={`${textSizeClass} text-ink/50 font-medium`}>{text}</p>}
    </div>
  );
}
