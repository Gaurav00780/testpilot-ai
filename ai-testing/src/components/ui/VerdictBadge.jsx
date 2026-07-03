import { Badge } from './badge';

const VERDICT_MAP = {
  pass: { variant: 'success', label: 'PASS' },
  warn: { variant: 'warning', label: 'WARN' },
  fail: { variant: 'critical', label: 'FAIL' },
};

export function VerdictBadge({ verdict, size = 'md' }) {
  if (!verdict) return null;

  const v = verdict.toLowerCase();
  const config = VERDICT_MAP[v] || { variant: 'outline', label: verdict.toUpperCase() };

  const sizeClass = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-4 py-2 text-sm',
  }[size];

  return (
    <Badge variant={config.variant} className={`font-mono font-bold tracking-widest ${sizeClass}`}>
      {config.label}
    </Badge>
  );
}
