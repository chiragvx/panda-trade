// ─── OPENTRADER DESIGN SYSTEM TOKENS v2 ──────────────────────────────────────
// Single source of truth. Do not hardcode any value outside this file.
// Rules: 11px font floor | 4px spacing grid | 0 border radius | 1px solid borders

export const COLOR = {
  bg: {
    base:          '#000000',
    surface:       '#000000',
    elevated:      '#000000',
    overlay:       '#050505',
    border:        '#222222',
    // Semantic status backgrounds — for banners and alerts
    statusError:   '#1a0505',
    statusWarning: '#160b00',
    statusSuccess: '#031408',
    statusInfo:    '#050a0f',
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
  interactive: {
    hover:    '#111111',
    selected: '#1a110a',
    focus:    '#FF7722',
    active:   '#221105',
  },
} as const;

export const TYPE = {
  family: {
    mono:    '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    sans:    '"Inter", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: '"Genos", sans-serif',
  },
  size: {
    xs:    '11px',  // ← FLOOR — labels, captions, badges (was 10px)
    sm:    '12px',  // table cells, supporting text (was 11px)
    md:    '12px',  // base body text
    lg:    '14px',  // emphasized text, active values (was 13px)
    xl:    '16px',  // section headers, large values (was 14px)
    '2xl': '18px',  // hero prices, P&L display
    '3xl': '20px',  // featured display values
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
  8:   '32px',
  standard: '8px',
} as const;

export const ROW_HEIGHT = {
  compact: '28px',  // dense secondary rows
  default: '32px',  // standard data rows — confirmed
  relaxed: '36px',  // spacious / modal rows
  header:  '32px',  // column headers — confirmed
} as const;

// Layout constants — all multiples of 4px
export const LAYOUT = {
  cellPadH:  '12px',  // horizontal padding in all table cells
  cellPadV:  '0px',   // vertical padding (row height controls this)
  widgetPad: '8px',   // flexlayout tab content inset
  toolbarH:  '36px',  // widget toolbar height
  topbarH:   '40px',  // each top bar row height
  filterH:   '32px',  // filter / search bar rows
  sectionGap: '1px',  // visual spacer — use border, not margin
} as const;

export const BORDER = {
  color:    COLOR.bg.border,
  width:    '1px',
  style:    'solid',
  standard: `1px solid ${COLOR.bg.border}`,
  strong:   `1px solid #333333`,
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
  sticky:       200,
  notification: 1000,
  topbar:       1000,
  modal:        5000,
  modalTop:     6000,
  disclaimer:   9000,
  critical:     9999,
} as const;
