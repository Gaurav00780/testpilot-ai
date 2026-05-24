export function SeverityBadge({ severity, size = 'sm' }) {
  if (!severity) return null;

  const s = severity.toLowerCase();
  const config = {
    critical: { bg: 'bg-[#ffe8e5]', text: 'text-red',   label: 'CRITICAL' },
    major:    { bg: 'bg-[#fff3e0]', text: 'text-amber',  label: 'MAJOR' },
    minor:    { bg: 'bg-[#e8f0ff]', text: 'text-accent2', label: 'MINOR' },
  }[s] || { bg: 'bg-tag-bg', text: 'text-muted', label: severity.toUpperCase() };

  const sizeClass = {
    xs: 'px-1 py-0.5 text-[10px]',
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  }[size];

  return (
    <span className={`tp-badge ${config.bg} ${config.text} ${sizeClass} font-mono`}>
      {config.label}
    </span>
  );
}
