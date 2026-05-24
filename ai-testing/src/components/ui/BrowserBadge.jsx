import { getBrowserConfig } from '../../utils/browserIcons';

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

  return (
    <span
      className={`tp-badge ${sizeClass} font-mono`}
      style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
    >
      {showIcon && <Icon size={iconSize} />}
      {cfg.label}
    </span>
  );
}
