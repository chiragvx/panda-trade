/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Mirrors tokens.ts COLOR exactly ───────────────────────────────
        bg: {
          base:     '#000000',
          surface:  '#000000',
          elevated: '#000000',
          overlay:  '#050505',
          border:   '#222222',
          // Legacy compat
          primary:  '#000000',
          secondary: '#000000',
        },
        text: {
          primary:   '#FFFFFF',
          secondary: '#CCCCCC',
          muted:     '#666666',
          inverse:   '#000000',
        },
        semantic: {
          up:      '#00d084',
          down:    '#ff3b57',
          warning: '#f5a623',
          info:    '#FF7722',
          purple:  '#b06aff',
        },
        up:   '#00d084',
        down: '#ff3b57',
        // Accent — primary is orange #FF7722, matches tokens.ts
        accent: {
          info:    '#FF7722',
          green:   '#00d084',
          red:     '#ff3b57',
          warning: '#f5a623',
          purple:  '#b06aff',
        },
        border: {
          DEFAULT: '#222222',
        },
        interactive: {
          hover:    '#111111',
          selected: '#1a110a',
          focus:    '#FF7722',
          active:   '#221105',
        },
      },
      fontFamily: {
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans:    ['"Inter"', '"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Genos"', 'sans-serif'],
        ui:      ['"JetBrains Mono"', 'monospace'],
        data:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        // ─── Mirrors tokens.ts TYPE.size exactly ────────────────────────
        'xs':     ['11px', { lineHeight: '1.2' }],   // floor — was 10px
        'sm':     ['12px', { lineHeight: '1.2' }],   // cells, supporting text
        'base':   ['12px', { lineHeight: '1.4' }],   // body default
        'md':     ['12px', { lineHeight: '1.4' }],
        'lg':     ['14px', { lineHeight: '1.2' }],   // emphasized
        'xl':     ['16px', { lineHeight: '1.2' }],   // large values
        '2xl':    ['18px', { lineHeight: '1.2' }],
        '3xl':    ['20px', { lineHeight: '1.2' }],
      },
      borderRadius: {
        none:    '0',
        sm:      '0',
        DEFAULT: '0',
        md:      '0',
        lg:      '2px',
        xl:      '2px',
        full:    '9999px',
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
        '8':   '32px',
      },
      height: {
        'row-compact':  '28px',
        'row-default':  '32px',
        'row-relaxed':  '36px',
        'row-header':   '32px',
        'toolbar':      '36px',
        'topbar':       '40px',
        'filter':       '32px',
      },
    },
  },
  plugins: [],
}
