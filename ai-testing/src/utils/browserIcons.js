import React from 'react';

// Browser icon components using React.createElement (no JSX — works in .js files)
export const BrowserIcons = {
  chromium: ({ size = 16, className = '' }) =>
    React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', className },
      React.createElement('circle', { cx: 12, cy: 12, r: 10, fill: '#4285F4' }),
      React.createElement('circle', { cx: 12, cy: 12, r: 4, fill: 'white' }),
      React.createElement('path', { d: 'M12 8h8.5a10 10 0 0 0-17-0.5L8 12z', fill: '#EA4335' }),
      React.createElement('path', { d: 'M3.5 7.5A10 10 0 0 0 12 22l3.5-6a4 4 0 0 1-7 0z', fill: '#34A853' }),
      React.createElement('path', { d: 'M12 8h8.5a10 10 0 0 1-1.5 10.5L15.5 14a4 4 0 0 0-3.5-6z', fill: '#FBBC05' }),
    ),

  firefox: ({ size = 16, className = '' }) =>
    React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', className },
      React.createElement('circle', { cx: 12, cy: 12, r: 10, fill: '#FF7139' }),
      React.createElement('path', { d: 'M12 4C7.6 4 4 7.6 4 12s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z', fill: '#FFD56A' }),
      React.createElement('circle', { cx: 12, cy: 12, r: 3, fill: 'white' }),
    ),

  webkit: ({ size = 16, className = '' }) =>
    React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', className },
      React.createElement('circle', { cx: 12, cy: 12, r: 10, fill: '#6b6560' }),
      React.createElement('path', { d: 'M8 12l2.5-4.5 3 4.5-3 4.5z', fill: 'white' }),
      React.createElement('path', { d: 'M12.5 7.5l3 4.5-3 4.5 2.5-4.5z', fill: 'rgba(255,255,255,0.6)' }),
    ),

  'mobile-chrome': ({ size = 16, className = '' }) =>
    React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', className },
      React.createElement('rect', { x: 6, y: 2, width: 12, height: 20, rx: 2, fill: '#1a7a4a' }),
      React.createElement('rect', { x: 8, y: 5, width: 8, height: 12, rx: 1, fill: 'white' }),
      React.createElement('circle', { cx: 12, cy: 19, r: 1, fill: 'white' }),
    ),
};

export const BROWSER_CONFIG = {
  chromium: {
    label: 'Chrome',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    Icon: BrowserIcons.chromium,
  },
  firefox: {
    label: 'Firefox',
    color: '#f97316',
    bgColor: '#fff7ed',
    Icon: BrowserIcons.firefox,
  },
  webkit: {
    label: 'Safari',
    color: '#71717a',
    bgColor: '#f4f4f5',
    Icon: BrowserIcons.webkit,
  },
  'mobile-chrome': {
    label: 'Mobile',
    color: '#1a7a4a',
    bgColor: '#edf6f0',
    Icon: BrowserIcons['mobile-chrome'],
  },
};

export function getBrowserConfig(browser) {
  return BROWSER_CONFIG[browser] || {
    label: browser,
    color: '#71717a',
    bgColor: '#f4f4f5',
    Icon: BrowserIcons.chromium,
  };
}
