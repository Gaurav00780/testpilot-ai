import { AiIssueDetail } from './AiIssueDetail';
import { AskAiChat } from './AskAiChat';
import useAppStore from '../../store/useAppStore';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';

export function AiPanel({ run, runId, allIssues, activeIssueId, isLive }) {
  const { activeBrowser, setActiveIssueId } = useAppStore();

  const activeIssue = activeIssueId ? allIssues?.find((i) => i.id === activeIssueId) : null;
  const browserResult = run?.browserResults?.find((br) => br.browser === activeBrowser);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 p-4">
        {activeIssue ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveIssueId(null)}
              className="mb-4 gap-1 text-xs"
            >
              ← All Issues
            </Button>
            <AiIssueDetail issue={activeIssue} />
            <div className="pt-4 mt-4">
              <AskAiChat runId={runId} issueId={activeIssueId} />
            </div>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-lg text-foreground mb-4">AI Analysis</h2>
            {isLive ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
            ) : run?.status === 'completed' ? (
              <div className="space-y-6">
                {browserResult?.aiSummary && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {browserResult.aiSummary}
                  </p>
                )}

                {allIssues && allIssues.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">By Category</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        allIssues.reduce((acc, i) => {
                          const cat = i.category || 'other';
                          acc[cat] = (acc[cat] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([cat, count]) => (
                        <Badge key={cat} variant="secondary" className="text-xs capitalize">
                          {cat} ({count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {browserResult?.aiBrowserNotes && (
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Browser Notes</p>
                    <p className="text-sm text-muted-foreground italic">
                      {browserResult.aiBrowserNotes}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </ScrollArea>
    </div>
  );
}
