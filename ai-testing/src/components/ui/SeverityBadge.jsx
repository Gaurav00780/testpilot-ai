import { Badge } from './badge';

const SEVERITY_MAP = {
  critical: { variant: 'critical', label: 'CRITICAL' },
  major:    { variant: 'warning', label: 'MAJOR' },
  minor:    { variant: 'info', label: 'MINOR' },
};

export function SeverityBadge({ severity, size = 'sm' }) {
  if (!severity) return null;

  const s = severity.toLowerCase();
  const config = SEVERITY_MAP[s] || { variant: 'outline', label: severity.toUpperCase() };

  const sizeClass = {
    xs: 'px-1 py-0.5 text-[10px]',
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  }[size];

  return (
    <Badge variant={config.variant} className={`font-mono ${sizeClass}`}>
      {config.label}
    </Badge>
  );
}
