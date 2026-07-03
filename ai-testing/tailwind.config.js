/** @type {import('tailwindcss').Config} */
import tailwindAnimate from 'tailwindcss-animate';

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:      '#09090b',
        paper:    '#fafafa',
        accent2:  '#3b82f6',
        'tag-bg': '#f4f4f5',
        green:    '#1a7a4a',
        amber:    '#b85e00',
        red:      '#c0210f',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'hsl(var(--ring))',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-1': ['84px', { lineHeight: '75.6px', letterSpacing: '0px', fontWeight: '600' }],
        'display-2': ['80px', { lineHeight: '64px', letterSpacing: '0px', fontWeight: '600' }],
        'heading-3': ['28px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '400' }],
        'body':      ['18px', { lineHeight: '24.75px', letterSpacing: '0px', fontWeight: '400' }],
        'body-compact': ['16px', { lineHeight: '24px', letterSpacing: '0px', fontWeight: '400' }],
        'label':     ['14px', { lineHeight: '21px', letterSpacing: '0px', fontWeight: '400' }],
        'caption':   ['12px', { lineHeight: '18px', letterSpacing: '0px', fontWeight: '400' }],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      boxShadow: {
        '2xl': 'var(--shadow-2xl)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee var(--duration, 40s) linear infinite",
        "marquee-vertical": "marquee-vertical var(--duration, 40s) linear infinite",
      },
    },
  },
  plugins: [tailwindAnimate],
}
