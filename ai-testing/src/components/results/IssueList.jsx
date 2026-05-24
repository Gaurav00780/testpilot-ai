import { SeverityBadge } from '../ui/SeverityBadge';
import { BrowserBadge } from '../ui/BrowserBadge';
import { ConfidenceBar } from '../ai/ConfidenceBar';
import { EmptyState } from '../ui/EmptyState';
import { truncate } from '../../utils/formatters';
import useAppStore from '../../store/useAppStore';

export function IssueCard({ issue, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-3 py-2.5 rounded transition-colors border
        ${isActive
          ? 'bg-accent/5 border-accent/30'
          : 'bg-card border-transparent hover:bg-tag-bg hover:border-border'
        }
      `}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <SeverityBadge severity={issue.severity} size="xs" />
        <BrowserBadge browser={issue.browser} size="xs" showIcon={false} />
      </div>
      <p className="text-sm text-ink leading-snug font-medium mb-1.5">
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
        message="No visual differences detected across all browsers."
      />
    );
  }

  if (runStatus !== 'completed' && !issues.length) {
    return (
      <div className="px-3 py-6 text-center text-muted text-xs animate-pulse">
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
        <h3 className="text-xs font-semibold uppercase text-muted tracking-wider">Issues</h3>
        {isLive && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green/10 border border-green/20 text-[10px] font-mono text-green tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>
            LIVE
          </span>
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
