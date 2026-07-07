import { useNavigate } from 'react-router-dom';
import { getBrowserConfig } from '../../utils/browserIcons';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Loader2 } from 'lucide-react';

export function LiveProgressPanel({ run, wsState }) {
  const navigate = useNavigate();

  if (wsState.error) {
    const isRunFailed = wsState.error.includes('failed') || wsState.error.includes('error');
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <div className={`border rounded-lg p-6 max-w-md w-full text-center ${isRunFailed ? 'border-red-400 bg-red-50' : 'border-amber-400 bg-amber-50'}`}>
          <p className={`font-semibold mb-2 ${isRunFailed ? 'text-red-700' : 'text-amber-700'}`}>
            {isRunFailed ? 'Run failed' : 'Live connection lost'}
          </p>
          <p className={`text-sm mb-4 ${isRunFailed ? 'text-red-600' : 'text-amber-600'}`}>
            {wsState.error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              className={isRunFailed ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}
            >
              Refresh Results
            </Button>
            <Button
              onClick={() => navigate('/runs/new')}
              variant="outline"
              className={isRunFailed ? 'border-red-400 text-red-700' : 'border-amber-400 text-amber-700 hover:bg-amber-50'}
            >
              New Run
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stageProgress = {
    queued: 5,
    running: 30,
    capturing: 30,
    diffing: 60,
    'ai analysis': 80,
    ai: 80,
    completed: 100
  };

  const currentStage = wsState.stage || 'queued';
  const progressPercent = stageProgress[currentStage] || 15;
  const isQueued = currentStage === 'queued';
  const isPolling = !wsState.connected && wsState.message?.includes('background');

  const stageLabel = {
    queued: 'Queued',
    running: 'Capturing screenshots',
    capturing: 'Capturing screenshots',
    diffing: 'Comparing images',
    'ai analysis': 'AI Analysis',
    ai: 'AI Analysis',
  }[currentStage] || currentStage;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 text-lg font-medium text-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          {isQueued ? 'Queued...' : isPolling ? 'AI analysis in progress...' : 'Running cross-browser tests...'}
        </div>

        <div className="w-96 flex flex-col gap-2">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>Stage: {stageLabel}</span>
            <span>{progressPercent}%</span>
          </div>
          {wsState.message && (
            <p className="text-sm text-center text-muted-foreground italic mt-2">{wsState.message}</p>
          )}
        </div>
      </div>

      <div className="w-96">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 pb-2">Browser Status</h4>
        <div className="flex flex-col gap-3">
          {run?.browsers?.map(browser => {
            const config = getBrowserConfig(browser);
            const browserResult = run?.browserResults?.find(br => br.browser === browser);
            const isDone = browserResult?.status === 'ok' || browserResult?.status === 'error';
            const isRunning = wsState.browserStatus?.[browser] === 'running' || (!isDone && currentStage !== 'queued');

            const liveIssuesCount = wsState.liveIssues?.[browser]?.length || 0;

            return (
              <div key={browser} className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-5 flex justify-center">
                    {isDone ? (
                      <span className="text-green text-sm">✓</span>
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber" />
                    ) : (
                      <span className="text-muted-foreground text-sm">○</span>
                    )}
                  </div>
                  <config.Icon size={16} />
                  <span className="text-sm text-foreground">
                    {config.label}
                  </span>

                  <span className="text-xs text-muted-foreground ml-auto font-mono">
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
