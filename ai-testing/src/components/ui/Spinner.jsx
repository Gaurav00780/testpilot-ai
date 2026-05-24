export function Spinner({ size = 'md', className = '' }) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-[3px]',
  }[size];

  return (
    <div
      className={`${sizeClass} rounded-full border-border border-t-accent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
