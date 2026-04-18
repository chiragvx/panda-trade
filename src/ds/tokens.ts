// OPENTRADER DESIGN SYSTEM TOKENS vNext
// Single source of truth for the terminal visual language.
// Base 16 root | flat edges | even-only font scale | border-led surfaces

export const COLOR = {
  bg: {
    base: '#050505',
    surface: '#0a0a0a',
    elevated: '#111111',
    overlay: '#161616',
    tabbar: '#242424',  // tab strip — lighter than content so selected tab (base) recedes
    border: '#242424',
    subtle: '#1b1b1b',
    statusError: '#16090a',
    statusWarning: '#1a1306',
    statusSuccess: '#07140e',
    statusInfo: '#140d06',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#b8b8b8',
    muted: '#6a6a6a',
    inverse: '#050505',
  },
  semantic: {
    up: '#00c978',
    down: '#ff4d6d',
    danger: '#ff4d6d',
    success: '#00c978',
    warning: '#c89b2c',
    info: '#ff7a1a',
    purple: '#9c6bff',
    accent: '#ff7a1a',
    muted: '#6a6a6a',
    primary: '#f5f5f5',
  },
  interactive: {
    hover: '#131313',
    selected: '#1a1108',
    focus: '#ff7a1a',
    active: '#221407',
  },
  chart: {
    grid: '#1d1d1d',
    axis: '#5a5a5a',
    crosshair: '#ff7a1a',
    volumeUp: 'rgba(0, 201, 120, 0.45)',
    volumeDown: 'rgba(255, 77, 109, 0.45)',
  },
} as const;

export const TYPE = {
  family: {
    mono: '"JetBrains Mono", monospace',
    sans: '"JetBrains Mono", monospace',
    heading: '"JetBrains Mono", monospace',
  },
  size: {
    xs: '0.75rem',   // 12px
    sm: '0.75rem',   // 12px
    md: '0.875rem',  // 14px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    '4xl': '2.5rem', // 40px
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '500',
    bold: '600',
    extrabold: '600',
    black: '600',
  },
  lineHeight: {
    tight: '1.2',
    standard: '1.4',
    relaxed: '1.6',
  },
  letterSpacing: {
    tight: '-0.01em',
    normal: '0em',
    wide: '0.02em',
    caps: '0em',
  },
} as const;

export const SPACE = {
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  standard: '0.75rem',
} as const;

export const RADIUS = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  full: '9999px',
} as const;

export const SIZE = {
  icon: {
    xs: '0.75rem',  // 12px
    sm: '1rem',     // 16px
    md: '1.125rem', // 18px
  },
  wrapper: {
    icon: '1.125rem',       // 18px
    headerAction: '1.75rem',   // 28px — fills compact header
    headerActionLg: '2.5rem',   // 40px — fills widgetHeader bar
    metric: '1.75rem',         // 28px
  },
  shell: {
    widgetHeader: '2.5rem',  // 40px — needs room for title + subtitle stack
    toolbar: '1.75rem',     // 28px — was 36px
    topbar: '2.75rem',      // 44px — nav btn target size
    filter: '1.75rem',      // 28px — was 36px
    modalBar: '2.5rem',     // 40px — modals unchanged
  },
} as const;

export const ROW_HEIGHT = {
  compact: '1.625rem',  // 26px — was 32px
  default: '1.875rem',  // 30px — was 36px
  relaxed: '2.25rem',   // 36px — was 40px
  header: '1.375rem',   // 22px — was 32px
} as const;

export const LAYOUT = {
  cellPadH: '0.5rem',        // 8px — was 12px
  cellPadV: '0',
  widgetPad: '0.75rem',      // 12px — was 16px
  toolbarH: SIZE.shell.toolbar,
  widgetHeaderH: SIZE.shell.widgetHeader,
  topbarH: SIZE.shell.topbar,
  filterH: SIZE.shell.filter,
  sectionGap: '1px',
  pagePad: '1.5rem',        // 24px
  pagePadLg: '2rem',        // 32px
} as const;

export const BORDER = {
  color: COLOR.bg.border,
  width: '1px',
  style: 'solid',
  standard: `1px solid ${COLOR.bg.border}`,
  strong: `1px solid ${COLOR.bg.subtle}`,
  up: `2px solid ${COLOR.semantic.up}`,
  down: `2px solid ${COLOR.semantic.down}`,
  info: `2px solid ${COLOR.semantic.info}`,
  warning: `2px solid ${COLOR.semantic.warning}`,
} as const;

export const STATE = {
  disabledOpacity: 0.45,
  selectedInset: `inset 2px 0 0 ${COLOR.semantic.info}`,
} as const;

export const MOTION = {
  duration: {
    hover: '80ms',
    reveal: '120ms',
    panel: '160ms',
  },
  easing: {
    standard: 'linear',
    enter: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

export const CHART = {
  candleUp: COLOR.semantic.up,
  candleDown: COLOR.semantic.down,
  grid: COLOR.chart.grid,
  axis: COLOR.chart.axis,
  crosshair: COLOR.chart.crosshair,
  volumeUp: COLOR.chart.volumeUp,
  volumeDown: COLOR.chart.volumeDown,
} as const;

// Scaleable nav button size — override --nav-btn-size in CSS or JS for accessibility scaling.
// Falls back to 2.75rem (44px at default font-size), which also scales with browser font-size via rem.
export const NAV_BTN = 'var(--nav-btn-size, 2.75rem)' as const;

export const Z = {
  base: 0,
  panel: 1,
  overlay: 10,
  dropdown: 100,
  sticky: 200,
  notification: 1000,
  topbar: 1000,
  modal: 5000,
  modalTop: 6000,
  critical: 9999,
  tooltip: 10000,
} as const;
