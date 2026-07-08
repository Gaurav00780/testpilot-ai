import { ChevronDown, ChevronUp } from 'lucide-react';
import { SeverityBadge } from '../ui/SeverityBadge';
import { BrowserBadge } from '../ui/BrowserBadge';
import { ConfidenceBar } from '../ai/ConfidenceBar';
import { EmptyState } from '../ui/EmptyState';
import { truncate } from '../../utils/formatters';
import useAppStore from '../../store/useAppStore';
import { Badge } from '../ui/badge';

export function IssueCard({ issue, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-3 py-2.5 rounded transition-colors border
        ${isActive
          ? 'bg-accent/5 border-accent/30'
          : 'bg-card border-transparent hover:bg-muted/30'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-start gap-2">
          <SeverityBadge severity={issue.severity} size="xs" />
          <BrowserBadge browser={issue.browser} size="xs" showIcon={false} />
        </div>
        <div className="text-muted-foreground shrink-0 opacity-70">
          {isActive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      <p className="text-sm text-foreground leading-snug font-medium mb-1.5 pr-2">
        {truncate(issue.title, 52)}
      </p>
      <ConfidenceBar confidence={issue.confidence ?? 0} />
    </button>
  );
}

export function IssueList({ issues = [], isLive = false, runStatus }) {
  const { activeIssueId, setActiveIssueId, setActiveBrowser } = useAppStore();

  if (!issues.length && runStatus === 'completed') {
    return (
      <EmptyState
        icon="✓"
        title="All clear"
        message="No visual differences detected across all browsers."
      />
    );
  }

  if (runStatus === 'error') {
    return (
      <div className="px-3 py-6 text-center text-red-500/80 text-xs font-mono">
        Test runner failed. Check server logs.
      </div>
    );
  }

  if (runStatus !== 'completed' && !issues.length) {
    return (
      <div className="px-3 py-6 text-center text-muted-foreground text-xs animate-pulse">
        AI analysis running...
      </div>
    );
  }

  const sorted = [...issues].sort((a, b) => {
    const order = { critical: 0, major: 1, minor: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  return (
    <div className="space-y-1 p-2">
      <div className="flex items-center gap-2 mb-2 px-2">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Issues</h3>
        {isLive && (
          <Badge variant="success" className="gap-1.5 text-[10px] font-mono tracking-widest uppercase animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            LIVE
          </Badge>
        )}
      </div>
      {sorted.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          isActive={activeIssueId === issue.id}
          onClick={() => {
            setActiveIssueId(issue.id);
            if (issue.browser) setActiveBrowser(issue.browser);
          }}
        />
      ))}
    </div>
  );
}
