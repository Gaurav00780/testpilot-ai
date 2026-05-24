import { useNavigate } from 'react-router-dom';
import { getBrowserConfig } from '../../utils/browserIcons';

export function LiveProgressPanel({ run, wsState }) {
  const navigate = useNavigate();

  if (wsState.error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <div className="border border-amber-400 bg-amber-50 rounded-lg p-6 max-w-md w-full text-center">
          <p className="text-amber-700 font-semibold mb-2">Live connection lost</p>
          <p className="text-amber-600 text-sm mb-4">
            The run may still be processing in the background. Refresh to see the latest results.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded hover:bg-amber-600 transition-colors"
            >
              Refresh Results
            </button>
            <button
              onClick={() => navigate('/runs/new')}
              className="px-4 py-2 border border-amber-400 text-amber-700 text-sm font-medium rounded hover:bg-amber-50 transition-colors"
            >
              New Run
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stageProgress = {
    capturing: 25,
    diffing: 50,
    ai: 75,
    completed: 100
  };

  const currentStage = wsState.stage || 'queued';
  const progressPercent = stageProgress[currentStage] || 5;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 text-lg font-medium text-ink">
          <span className="text-amber animate-spin">⟳</span>
          Running cross-browser tests...
        </div>
        
        <div className="w-96 flex flex-col gap-2">
          <div className="h-2 bg-border rounded-full overflow-hidden w-full">
            <div
              className="h-full bg-accent transition-all duration-700 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted font-mono">
            <span>Stage: {currentStage === 'ai' ? 'AI Analysis' : currentStage}</span>
            <span>{progressPercent}%</span>
          </div>
          {wsState.message && (
            <p className="text-sm text-center text-muted italic mt-2">{wsState.message}</p>
          )}
        </div>
      </div>

      <div className="w-96">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 border-b border-border pb-2">Browser Status</h4>
        <div className="flex flex-col gap-3">
          {run?.browsers?.map(browser => {
            const config = getBrowserConfig(browser);
            const browserResult = run?.browserResults?.find(br => br.browser === browser);
            const isDone = browserResult?.status === 'ok' || browserResult?.status === 'error';
            // Simple heuristics for currently running
            const isRunning = wsState.browserStatus?.[browser] === 'running' || (!isDone && currentStage !== 'queued');
            
            const liveIssuesCount = wsState.liveIssues?.[browser]?.length || 0;

            return (
              <div key={browser} className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-5 flex justify-center">
                    {isDone ? (
                      <span className="text-green text-sm">✓</span>
                    ) : isRunning ? (
                      <span className="text-amber animate-spin text-sm">⟳</span>
                    ) : (
                      <span className="text-muted text-sm">○</span>
                    )}
                  </div>
                  <config.Icon size={16} className={isDone ? 'text-ink' : isRunning ? 'text-ink' : 'text-muted'} />
                  <span className={`text-sm ${isDone ? 'text-ink' : isRunning ? 'text-ink' : 'text-muted'}`}>
                    {config.label}
                  </span>
                  
                  <span className="text-xs text-muted ml-auto font-mono">
                    {isDone ? 'completed' : isRunning ? 'running...' : 'queued'}
                  </span>
                </div>
                {liveIssuesCount > 0 && (
                  <p className="text-xs text-amber font-medium ml-8">
                    ⚠ {liveIssuesCount} issue{liveIssuesCount !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
