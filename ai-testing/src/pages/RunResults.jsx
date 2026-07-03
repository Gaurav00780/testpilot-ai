import { useState } from 'react';
import { useParams } from 'react-router-dom';
import useRun from '../hooks/useRun';
import useRunWebSocket from '../hooks/useRunWebSocket';
import { IssueList } from '../components/results/IssueList';
import { BrowserTabs } from '../components/results/BrowserTabs';
import { ScreenshotViewer } from '../components/results/ScreenshotViewer';
import { AiPanel } from '../components/ai/AiPanel';
import { LiveProgressPanel } from '../components/results/LiveProgressPanel';
import { VerdictBadge } from '../components/ui/VerdictBadge';
import { formatTimeAgo, formatDuration, formatMismatch, parseRunId, truncate } from '../utils/formatters';
import useAppStore from '../store/useAppStore';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../components/ui/badge';

function LeftPanel({ run, allIssues, isLive }) {
  const { prefix, id } = parseRunId(run?.id);
  const [isIssuesExpanded, setIsIssuesExpanded] = useState(false);

  return (
    <div className="w-full lg:w-72 shrink-0 lg:border-r border-b border-border flex flex-col overflow-hidden bg-card lg:order-1 order-2 h-auto lg:h-full">
      <div className="p-4 border-b border-border space-y-3">
        {run?.verdict && (
          <div className="flex items-center gap-2">
            <VerdictBadge verdict={run.verdict} size="lg" />
          </div>
        )}

        <div>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-0.5">Run ID</p>
          <p className="font-mono text-sm">
            <span className="text-muted-foreground">{prefix}</span>{id}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-0.5">URL</p>
          <p className="text-xs text-foreground break-all leading-snug">{truncate(run?.url, 60)}</p>
        </div>

        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-0.5">Started</p>
            <p className="text-xs font-mono text-foreground">{formatTimeAgo(run?.createdAt)}</p>
          </div>
          {run?.completedAt && (
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-0.5">Duration</p>
              <p className="text-xs font-mono text-foreground">{formatDuration(run?.createdAt, run?.completedAt)}</p>
            </div>
          )}
        </div>

        {run?.summary && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
            <Badge variant="outline" className="text-xs font-mono">
              {run.summary.totalBrowsers || run.browsers?.length || 0} Browsers
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              {run.summary.totalIssues ?? allIssues.length} issues
            </Badge>
            {run.summary.criticalIssues > 0 && (
              <Badge variant="critical" className="text-xs font-mono">
                {run.summary.criticalIssues} critical
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Mobile Expand Toggle */}
      {allIssues.length > 0 && (
        <button 
          onClick={() => setIsIssuesExpanded(!isIssuesExpanded)}
          className="lg:hidden flex items-center justify-between p-3 border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium">Issues Detected ({allIssues.length})</span>
          {isIssuesExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      )}

      <div className={`flex-1 lg:overflow-y-auto overflow-y-auto scrollbar-thin lg:h-auto ${
        allIssues.length > 0 ? (isIssuesExpanded ? 'h-[400px] block' : 'hidden lg:block') : 'h-auto block'
      }`}>
        <IssueList issues={allIssues} isLive={isLive} runStatus={run?.status} />
      </div>
    </div>
  );
}

export default function RunResults() {
  const { id } = useParams();
  const { activeBrowser, activeIssueId, setActiveBrowser } = useAppStore();

  const { data: run, isLoading } = useRun(id);
  const wsState = useRunWebSocket(id);

  if (isLoading && !run) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Run not found
      </div>
    );
  }

  const isLive = run.status !== 'completed' && run.status !== 'error';

  const allIssues = isLive
    ? Object.values(wsState.liveIssues).flat()
    : run.browserResults?.flatMap(r => r.aiIssues ?? []) || [];

  const activeBrowserResult = run.browserResults?.find((br) => br.browser === activeBrowser);

  return (
    <div className="flex flex-col lg:flex-row w-full overflow-y-auto lg:overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
      <LeftPanel run={run} allIssues={allIssues} isLive={isLive} />

      <div className="flex flex-col flex-1 min-w-0 lg:overflow-hidden lg:order-2 order-1 min-h-[500px] lg:min-h-0 border-b lg:border-b-0 border-border">
        {isLive ? (
          <LiveProgressPanel run={run} wsState={wsState} />
        ) : (
          <>
            <BrowserTabs
              browsers={run.browsers || []}
              browserResults={run.browserResults || []}
              activeBrowser={activeBrowser}
              onSelect={setActiveBrowser}
            />

            <ScreenshotViewer
              screenshotUrl={activeBrowserResult?.screenshotUrl}
              diffUrl={activeBrowserResult?.diffUrl}
            />

            {activeBrowserResult?.mismatchPercent !== undefined && (
              <div className="shrink-0 border-t border-border px-4 py-2 flex items-center gap-4 bg-muted text-xs">
                <span className="text-muted-foreground font-mono">Mismatch:</span>
                <span className={`font-mono font-semibold ${activeBrowserResult.mismatchPercent === 0 ? 'text-emerald-600 dark:text-emerald-400' :
                  activeBrowserResult.mismatchPercent < 0.01 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                  {formatMismatch(activeBrowserResult.mismatchPercent)}
                </span>
                {activeBrowserResult.regions?.length > 0 && (
                  <span className="text-muted-foreground">
                    {activeBrowserResult.regions.length} diff region{activeBrowserResult.regions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="w-full lg:w-80 shrink-0 lg:border-l border-border flex flex-col lg:overflow-hidden bg-card lg:order-3 order-3 h-[400px] lg:h-full">
        <AiPanel
          run={run}
          runId={id}
          allIssues={allIssues}
          activeIssueId={activeIssueId}
          isLive={isLive}
        />
      </div>
    </div>
  );
}
