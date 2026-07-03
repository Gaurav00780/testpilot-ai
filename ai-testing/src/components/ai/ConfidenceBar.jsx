import { cn } from '@/lib/utils';

export function ConfidenceBar({ confidence }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
        <div
          style={{ width: `${confidence}%` }}
          className={cn(
            'h-full rounded-full transition-all duration-500',
            confidence >= 80 ? 'bg-emerald-500 dark:bg-emerald-400' :
            confidence >= 60 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-red-500 dark:bg-red-400'
          )}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">
        {confidence}%
      </span>
    </div>
  );
}
