export function ConfidenceBar({ confidence }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
        <div
          style={{ width: `${confidence}%` }}
          className={`h-full rounded-full transition-all duration-500 ${
            confidence >= 80 ? 'bg-green' :
            confidence >= 60 ? 'bg-amber' : 'bg-red'
          }`}
        />
      </div>
      <span className="text-xs font-mono text-muted w-8 text-right">
        {confidence}%
      </span>
    </div>
  );
}
