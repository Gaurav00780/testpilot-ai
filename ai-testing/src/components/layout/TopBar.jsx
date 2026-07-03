import { useLocation } from 'react-router-dom';
import { VerdictBadge } from '../ui/VerdictBadge';
import { parseRunId } from '../../utils/formatters';
import { Button } from '../ui/button';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { Badge } from '../ui/badge';
import useAppStore from '../../store/useAppStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const TITLE_MAP = {
  '/dashboard': 'Dashboard',
  '/runs/new': 'New Run',
  '/history': 'History',
  '/baselines': 'Baselines',
  '/settings': 'Settings',
  '/ai-insights': 'AI Insights',
};

export function TopBar({ run }) {
  const location = useLocation();
  const { theme, toggleTheme, setMobileSidebarOpen } = useAppStore();

  const isRunPage = location.pathname.startsWith('/runs/') && location.pathname !== '/runs/new';
  const runId = isRunPage ? location.pathname.split('/runs/')[1] : null;

  let title;
  if (isRunPage && runId) {
    const { prefix, id } = parseRunId(runId);
    title = <span className="font-mono text-base"><span className="text-muted-foreground">{prefix}</span>{id}</span>;
  } else {
    title = TITLE_MAP[location.pathname] || 'TestPilot AI';
  }

  const notifications = [
    // Uncomment to see populated state
    // { id: 1, title: 'Test Run Failed', desc: 'Run #1024 failed on Firefox', time: '2m ago', unread: true },
    // { id: 2, title: 'New Baseline', desc: 'Baseline created for Dashboard', time: '1h ago', unread: true },
    // { id: 3, title: 'System Update', desc: 'TestPilot AI was updated to v1.2', time: '2h ago', unread: true },
  ];

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSidebarOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
        {run && (
          <div className="flex items-center gap-3 ml-2 md:ml-4 border-l pl-2 md:pl-4">
            <VerdictBadge verdict={run.verdict} size="sm" />
            {run.status === 'running' && (
              <span className="flex items-center gap-1.5 text-xs text-amber font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                <span className="hidden sm:inline">Running</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px]">
                  {notifications.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-0" align="end" sideOffset={8}>
            <div className="p-4">
              <h4 className="font-semibold text-sm">Notifications</h4>
            </div>
            <div className="flex flex-col max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No new notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-4 last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${n.unread ? 'bg-muted/20' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <span className="text-xs text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-2 text-center border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">Mark all as read</Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
    </header>
  );
}
