export function ProgressBar({ value = 0, max = 100, color = 'accent' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClass = {
    accent: 'bg-accent',
    green:  'bg-green',
    amber:  'bg-amber',
    red:    'bg-red',
    accent2:'bg-accent2',
  }[color] || 'bg-accent';

  return (
    <div className="w-full h-1.5 bg-tag-bg rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full progress-fill ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
