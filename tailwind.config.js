/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:     '#0a0a0a',
          surface:  '#0f0f0f',
          elevated: '#141414',
          overlay:  '#1a1a1a',
          border:   '#1f1f1f',
          // legacy compat
          primary:  '#0a0a0a',
          secondary: '#0f0f0f',
        },
        text: {
          primary:   '#e8e8e8',
          secondary: '#888888',
          muted:     '#444444',
          inverse:   '#0a0a0a',
        },
        up:      '#00d084',
        down:    '#ff3b57',
        accent: {
          green:   '#00d084',
          red:     '#ff3b57',
          warning: '#f5a623',
          info:    '#4a9eff',
          teal:    '#4a9eff', // remap to info
          blue:    '#4a9eff',
          purple:  '#b06aff',
        },
        border: {
          DEFAULT: '#1f1f1f',
        },
        interactive: {
          hover:    '#1a1a1a',
          selected: '#141f2e',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        ui:   ['"JetBrains Mono"', 'monospace'],
        data: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'xs':  ['10px', { lineHeight: '1.2' }],
        'sm':  ['11px', { lineHeight: '1.2' }],
        'md':  ['12px', { lineHeight: '1.4' }],
        'base':['12px', { lineHeight: '1.4' }],
        'lg':  ['13px', { lineHeight: '1.2' }],
        'xl':  ['14px', { lineHeight: '1.2' }],
      },
      borderRadius: {
        none: '0',
        sm:   '2px',
        DEFAULT: '2px',
        md:   '2px',
        lg:   '3px',
        xl:   '3px',
        full: '9999px',
      },
      spacing: {
        '0.5': '2px',
        '1':   '4px',
        '1.5': '6px',
        '2':   '8px',
        '2.5': '10px',
        '3':   '12px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
      },
    },
  },
  plugins: [],
}
