/**
 * Inline SVG sparkline chart for pass rate over last N runs.
 * Green = pass, Amber = warn, Red = fail
 */
export function RunHealthChart({ runs = [] }) {
  if (!runs.length) {
    return (
      <div className="h-20 flex items-center justify-center text-muted text-xs">
        No runs yet
      </div>
    );
  }

  const recent = [...runs].slice(-10).reverse();
  const width = 300;
  const height = 64;
  const padding = { top: 8, bottom: 8, left: 4, right: 4 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Map verdict to y value (pass=100, warn=50, fail=0)
  const verdictToY = (verdict) => {
    if (!verdict) return 50;
    const v = verdict.toLowerCase();
    if (v === 'pass') return 100;
    if (v === 'warn') return 50;
    return 0;
  };

  const verdictToColor = (verdict) => {
    if (!verdict) return '#ddd9d3';
    const v = verdict.toLowerCase();
    if (v === 'pass') return '#1a7a4a';
    if (v === 'warn') return '#b85e00';
    return '#c0210f';
  };

  const points = recent.map((run, i) => {
    const x = padding.left + (i / Math.max(recent.length - 1, 1)) * chartW;
    const yVal = verdictToY(run.verdict);
    const y = padding.top + (1 - yVal / 100) * chartH;
    return { x, y, verdict: run.verdict, run };
  });

  // Build SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  // Area path (close to bottom)
  const areaPath = linePath +
    ` L${points[points.length - 1].x.toFixed(1)},${(height - padding.bottom).toFixed(1)}` +
    ` L${points[0].x.toFixed(1)},${(height - padding.bottom).toFixed(1)} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: 64 }}
        role="img"
        aria-label="Run health sparkline"
      >
        {/* Area fill */}
        <path d={areaPath} fill="#1a7a4a" fillOpacity="0.08" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#1a7a4a" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={verdictToColor(p.verdict)}
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      {/* Legend */}
      <div className="flex gap-4 mt-2">
        {[['#1a7a4a', 'Pass'], ['#b85e00', 'Warn'], ['#c0210f', 'Fail']].map(([color, label]) => (
          <span key={label} className="flex items-center gap-1 text-[10px] text-muted">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
