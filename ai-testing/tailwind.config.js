/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:      '#0f0e0d',
        paper:    '#f5f2ed',
        card:     '#ffffff',
        accent:   '#e8400c',
        accent2:  '#1a6bff',
        muted:    '#6b6560',
        border:   '#ddd9d3',
        'tag-bg': '#f0ece6',
        green:    '#1a7a4a',
        amber:    '#b85e00',
        red:      '#c0210f',
      },
      fontFamily: {
        serif:  ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:   ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:   ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
}
