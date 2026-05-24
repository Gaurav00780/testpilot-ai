export function VerdictBadge({ verdict, size = 'md' }) {
  if (!verdict) return null;

  const v = verdict.toLowerCase();
  const config = {
    pass: { bg: 'bg-[#e8f5e9]', text: 'text-green', label: 'PASS' },
    warn: { bg: 'bg-[#fff3e0]', text: 'text-amber', label: 'WARN' },
    fail: { bg: 'bg-[#ffe8e5]', text: 'text-red',   label: 'FAIL' },
  }[v] || { bg: 'bg-tag-bg', text: 'text-muted', label: verdict.toUpperCase() };

  const sizeClass = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }[size];

  return (
    <span className={`tp-badge ${config.bg} ${config.text} ${sizeClass} font-mono font-bold tracking-widest`}>
      {config.label}
    </span>
  );
}
