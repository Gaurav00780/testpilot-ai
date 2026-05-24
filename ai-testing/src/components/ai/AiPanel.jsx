import { AiIssueDetail } from './AiIssueDetail';
import { AskAiChat } from './AskAiChat';
import useAppStore from '../../store/useAppStore';

export function AiPanel({ run, runId, allIssues, activeIssueId, isLive }) {
  const { activeBrowser, setActiveIssueId } = useAppStore();

  const activeIssue = activeIssueId ? allIssues?.find((i) => i.id === activeIssueId) : null;
  const browserResult = run?.browserResults?.find((br) => br.browser === activeBrowser);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-paper">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {activeIssue ? (
          <>
            <button
              onClick={() => setActiveIssueId(null)}
              className="text-xs text-muted hover:text-ink transition-colors mb-4 flex items-center gap-1"
            >
              ← All Issues
            </button>
            <AiIssueDetail issue={activeIssue} />
            <div className="border-t border-border pt-4 mt-4">
              <AskAiChat runId={runId} issueId={activeIssueId} />
            </div>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-lg text-ink mb-4">AI Analysis</h2>
            {isLive ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-3 bg-border rounded w-full"></div>
                <div className="h-3 bg-border rounded w-5/6"></div>
                <div className="h-3 bg-border rounded w-4/6"></div>
              </div>
            ) : run?.status === 'completed' ? (
              <div className="space-y-6">
                {browserResult?.aiSummary && (
                  <p className="text-sm text-ink leading-relaxed">
                    {browserResult.aiSummary}
                  </p>
                )}

                {allIssues && allIssues.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2">By Category</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        allIssues.reduce((acc, i) => {
                          const cat = i.category || 'other';
                          acc[cat] = (acc[cat] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([cat, count]) => (
                        <span key={cat} className="px-2 py-1 bg-tag-bg rounded text-xs text-ink capitalize">
                          {cat} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {browserResult?.aiBrowserNotes && (
                  <div>
                    <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Browser Notes</p>
                    <p className="text-sm text-muted italic">
                      {browserResult.aiBrowserNotes}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
