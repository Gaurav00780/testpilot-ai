import { getBrowserConfig } from '../../utils/browserIcons';
import useAppStore from '../../store/useAppStore';

export function BrowserTabs({ browsers = [], browserResults = [] }) {
  const { activeBrowser, setActiveBrowser } = useAppStore();

  return (
    <div className="flex border-b border-border bg-paper overflow-x-auto scrollbar-thin shrink-0">
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
                ? 'border-accent text-ink font-semibold'
                : 'border-transparent text-muted hover:text-ink hover:border-border'
              }
            `}
          >
            <Icon size={14} />
            <span>{cfg.label}</span>
            {status === 'pass' && (
              <span className="w-1.5 h-1.5 rounded-full bg-green" />
            )}
            {status === 'fail' && (
              <span className="w-1.5 h-1.5 rounded-full bg-red" />
            )}
            {(status === 'running' || status === 'pending') && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
