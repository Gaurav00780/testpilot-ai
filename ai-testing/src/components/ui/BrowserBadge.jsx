import { getBrowserConfig } from '../../utils/browserIcons';
import { cn } from '@/lib/utils';

const BROWSER_STYLE_MAP = {
  chromium: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
  firefox: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
  webkit: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400',
  'mobile-chrome': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
};

const DEFAULT_BROWSER_STYLE = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400';

export function BrowserBadge({ browser, size = 'sm', showIcon = true }) {
  if (!browser) return null;
  const cfg = getBrowserConfig(browser);
  const { Icon } = cfg;

  const sizeClass = {
    xs: 'px-1 py-0.5 text-[10px] gap-0.5',
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2 py-1 text-sm gap-1.5',
  }[size];

  const iconSize = { xs: 10, sm: 12, md: 14 }[size];

  const colorClass = BROWSER_STYLE_MAP[browser] || DEFAULT_BROWSER_STYLE;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'font-mono',
        colorClass,
        sizeClass
      )}
    >
      {showIcon && <Icon size={iconSize} />}
      {cfg.label}
    </span>
  );
}

