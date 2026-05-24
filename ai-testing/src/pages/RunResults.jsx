import { useParams } from 'react-router-dom';
import useRun from '../hooks/useRun';
import useRunWebSocket from '../hooks/useRunWebSocket';
import { IssueList } from '../components/results/IssueList';
import { BrowserTabs } from '../components/results/BrowserTabs';
import { ScreenshotViewer } from '../components/results/ScreenshotViewer';
import { AiPanel } from '../components/ai/AiPanel';
import { LiveProgressPanel } from '../components/results/LiveProgressPanel';
import { VerdictBadge } from '../components/ui/VerdictBadge';
import { Spinner } from '../components/ui/Spinner';
import { formatTimeAgo, formatDuration, formatMismatch, parseRunId, truncate } from '../utils/formatters';
import useAppStore from '../store/useAppStore';

// ──────────────────────────────────────────────
// Left panel: run metadata + issue list
// ──────────────────────────────────────────────
function LeftPanel({ run, allIssues, isLive }) {
  const { prefix, id } = parseRunId(run?.id);

  return (
    <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden bg-card">
      {/* Run metadata */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Verdict */}
        {run?.verdict && (
          <div className="flex items-center gap-2">
            <VerdictBadge verdict={run.verdict} size="lg" />
          </div>
        )}

        {/* Run ID */}
        <div>
          <p className="text-[10px] text-muted font-mono uppercase tracking-wider mb-0.5">Run ID</p>
          <p className="font-mono text-sm">
            <span className="text-muted">{prefix}</span>{id}
          </p>
        </div>

        {/* URL */}
        <div>
          <p className="text-[10px] text-muted font-mono uppercase tracking-wider mb-0.5">URL</p>
          <p className="text-xs text-ink break-all leading-snug">{truncate(run?.url, 60)}</p>
        </div>

        {/* Time info */}
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-muted font-mono uppercase tracking-wider mb-0.5">Started</p>
            <p className="text-xs font-mono text-ink">{formatTimeAgo(run?.createdAt)}</p>
          </div>
          {run?.completedAt && (
            <div>
              <p className="text-[10px] text-muted font-mono uppercase tracking-wider mb-0.5">Duration</p>
              <p className="text-xs font-mono text-ink">{formatDuration(run?.createdAt, run?.completedAt)}</p>
            </div>
          )}
        </div>

        {/* Summary stats */}
        {run?.summary && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
            <span className="text-xs font-mono text-muted">
              {run.summary.totalBrowsers || run.browsers?.length || 0}B
            </span>
            <span className="text-xs font-mono text-muted">·</span>
            <span className="text-xs font-mono text-muted">
              {run.summary.totalIssues ?? allIssues.length} issues
            </span>
            {run.summary.criticalIssues > 0 && (
              <>
                <span className="text-xs font-mono text-muted">·</span>
                <span className="text-xs font-mono text-red font-semibold">
                  {run.summary.criticalIssues} critical
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Issue list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <IssueList issues={allIssues} isLive={isLive} runStatus={run?.status} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main RunResults component
// ──────────────────────────────────────────────
export default function RunResults() {
  const { id } = useParams();
  const { activeBrowser, activeIssueId, setActiveBrowser } = useAppStore();

  const { data: run, isLoading } = useRun(id);
  const wsState = useRunWebSocket(id);

  if (isLoading && !run) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        Run not found
      </div>
    );
  }

  const isLive = run.status !== 'completed' && run.status !== 'error';

  // Merge live streamed issues with completed run issues
  const allIssues = isLive
    ? Object.values(wsState.liveIssues).flat()
    : run.browserResults?.flatMap(r => r.aiIssues ?? []) || [];

  const activeBrowserResult = run.browserResults?.find((br) => br.browser === activeBrowser);

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 3rem)' }}>
      {/* LEFT PANEL */}
      <LeftPanel run={run} allIssues={allIssues} isLive={isLive} />

      {/* CENTER PANEL */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
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
              <div className="shrink-0 border-t border-border px-4 py-2 flex items-center gap-4 bg-paper text-xs">
                <span className="text-muted font-mono">Mismatch:</span>
                <span className={`font-mono font-semibold ${
                  activeBrowserResult.mismatchPercent === 0  ? 'text-green' :
                  activeBrowserResult.mismatchPercent < 0.01 ? 'text-amber' : 'text-red'
                }`}>
                  {formatMismatch(activeBrowserResult.mismatchPercent)}
                </span>
                {activeBrowserResult.regions?.length > 0 && (
                  <span className="text-muted">
                    {activeBrowserResult.regions.length} diff region{activeBrowserResult.regions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="w-80 shrink-0 border-l border-border flex flex-col overflow-hidden bg-card">
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
