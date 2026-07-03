import { getBrowserConfig } from '../../utils/browserIcons';
import useAppStore from '../../store/useAppStore';

export function BrowserTabs({ browsers = [], browserResults = [] }) {
  const { activeBrowser, setActiveBrowser } = useAppStore();

  return (
    <div className="flex border-b border-border bg-muted/30 overflow-x-auto scrollbar-thin shrink-0">
      {browsers.map((browser) => {
        const result = browserResults.find((r) => r.browser === browser);
        const cfg = getBrowserConfig(browser);
        const { Icon } = cfg;
        const isActive = activeBrowser === browser;
        const status = result?.status;

        return (
          <button
            key={browser}
            onClick={() => setActiveBrowser(browser)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors whitespace-nowrap
              ${isActive
                ? 'border-accent text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <Icon size={14} />
            <span>{cfg.label}</span>
            {status === 'pass' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
            {status === 'fail' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />}
            {(status === 'running' || status === 'pending') && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
