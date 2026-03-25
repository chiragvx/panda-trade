// ─── OPENTRADER DESIGN SYSTEM TOKENS ────────────────────────────────────────
// Single source of truth. Do not hardcode values anywhere else.

export const COLOR = {
  bg: {
    base:     '#0a0a0a',
    surface:  '#0f0f0f',
    elevated: '#141414',
    overlay:  '#1a1a1a',
    border:   '#1f1f1f',
  },
  text: {
    primary:   '#e8e8e8',
    secondary: '#888888',
    muted:     '#444444',
    inverse:   '#0a0a0a',
  },
  semantic: {
    up:      '#00d084',
    down:    '#ff3b57',
    warning: '#f5a623',
    info:    '#4a9eff',
    purple:  '#b06aff',
  },
  interactive: {
    hover:    '#1a1a1a',
    selected: '#141f2e',
    focus:    '#4a9eff',
    active:   '#0f1a2e',
  },
} as const;

export const TYPE = {
  family: {
    mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
  },
  size: {
    xs: '10px',
    sm: '11px',
    md: '12px',
    lg: '13px',
    xl: '14px',
  },
  weight: {
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
    black:     '900',
  },
  lineHeight: {
    tight:    '1.2',
    standard: '1.4',
  },
  letterSpacing: {
    tight:  '-0.01em',
    normal: '0em',
    wide:   '0.06em',
    caps:   '0.08em',
  },
} as const;

export const SPACE = {
  px:  '1px',
  0.5: '2px',
  1:   '4px',
  1.5: '6px',
  2:   '8px',
  2.5: '10px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
} as const;

export const ROW_HEIGHT = {
  compact: '22px',
  default: '26px',
  relaxed: '30px',
  header:  '24px',
} as const;

export const BORDER = {
  color:    COLOR.bg.border,
  width:    '1px',
  style:    'solid',
  standard: `1px solid ${COLOR.bg.border}`,
  up:       `2px solid ${COLOR.semantic.up}`,
  down:     `2px solid ${COLOR.semantic.down}`,
  info:     `2px solid ${COLOR.semantic.info}`,
  warning:  `2px solid ${COLOR.semantic.warning}`,
} as const;

export const Z = {
  base:         0,
  panel:        1,
  overlay:      10,
  dropdown:     100,
  notification: 1000,
  critical:     9999,
} as const;
