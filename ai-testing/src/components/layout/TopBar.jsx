import { useLocation } from 'react-router-dom';
import { VerdictBadge } from '../ui/VerdictBadge';
import { parseRunId } from '../../utils/formatters';
import { Bell, Sun } from 'lucide-react';

const TITLE_MAP = {
  '/dashboard': 'Dashboard',
  '/runs/new':  'New Run',
  '/history':   'History',
  '/baselines': 'Baselines',
  '/settings':  'Settings',
};

export function TopBar({ run }) {
  const location = useLocation();

  const isRunPage = location.pathname.startsWith('/runs/') && location.pathname !== '/runs/new';
  const runId = isRunPage ? location.pathname.split('/runs/')[1] : null;

  let title;
  if (isRunPage && runId) {
    const { prefix, id } = parseRunId(runId);
    title = <span className="font-mono text-base"><span className="text-muted">{prefix}</span>{id}</span>;
  } else {
    title = TITLE_MAP[location.pathname] || 'TestPilot AI';
  }

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-ink">{title}</h1>
        {/* Run status indicator */}
        {run && (
          <div className="flex items-center gap-3 ml-4 border-l border-border pl-4">
            <VerdictBadge verdict={run.verdict} size="sm" />
            {run.status === 'running' && (
              <span className="flex items-center gap-1.5 text-xs text-amber font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                Running
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center relative text-ink hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full text-[8px] font-bold text-white flex items-center justify-center -translate-x-0.5 -translate-y-0.5">3</span>
        </button>
        <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink hover:bg-gray-50 transition-colors">
          <Sun className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
