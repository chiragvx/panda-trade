You are designing and building the complete Design System and UI layer 
for OpenTrader — a modernized Bloomberg Terminal aesthetic.
NOT a dark dashboard. NOT a crypto bro UI. NOT rounded cards with glows.

Think: Bloomberg Terminal meets Neovim meets a Reuters trading desk.
Monospace everything. Data density maximized. Zero decoration.
Every pixel earns its place or it doesn't exist.

---

PART 1: PHILOSOPHY & AESTHETIC DIRECTION

THE RULES
  1. If it doesn't show data, it probably shouldn't exist
  2. Color is ONLY used to communicate meaning — never decoration
  3. Typography IS the UI — no icons where text works
  4. Borders are structural, not decorative
  5. Hover states are functional, not delightful
  6. Animation is for orientation, not entertainment
  7. Spacing is tight by default — breathing room is earned
  8. Every component must work at 80% zoom without breaking

THE REFERENCE POINT
  Bloomberg Terminal: dense, monospace, color-coded, keyboard-driven
  Modernized means:
    - Sub-pixel rendering on retina displays
    - Smooth 60fps scrolling
    - Keyboard + mouse, not touch-first
    - No CRT artifacts or retro kitsch
    - Readable at a glance after 8 hours of staring at it

WHAT IS FORBIDDEN
  - Border-radius > 3px anywhere (except 2px on pill badges only)
  - Box shadows (use borders instead)
  - Gradients (solid colors only)
  - Icons (use text labels, abbreviations, or unicode symbols)
  - Background images or textures
  - Animations > 150ms (except layout transitions: 220ms max)
  - Font sizes below 11px or above 14px in data components
  - Empty space > 8px between data elements
  - Decorative dividers — only structural ones

---

PART 2: DESIGN TOKENS

Create src/ds/tokens.ts — single source of truth.
Every component imports from here. Nothing hardcoded anywhere.

// ─── COLOR PALETTE ───────────────────────────────────────────

export const COLOR = {

  // Base surfaces — 5 levels only, no more
  bg: {
    base:     '#0a0a0a',   // root background — near black, not pure
    surface:  '#0f0f0f',   // panels, watchlist bg
    elevated: '#141414',   // table row hover, active tab
    overlay:  '#1a1a1a',   // dropdown, notification card
    border:   '#1f1f1f',   // ALL structural borders — one border color
  },

  // Text — 4 levels only
  text: {
    primary:   '#e8e8e8',  // main data, prices, values
    secondary: '#888888',  // labels, column headers, metadata
    muted:     '#444444',  // disabled, placeholders, timestamps
    inverse:   '#0a0a0a',  // text on colored backgrounds
  },

  // Semantic — meaning only, never decoration
  semantic: {
    up:       '#00d084',   // positive change, buy, profit
    down:     '#ff3b57',   // negative change, sell, loss
    warning:  '#f5a623',   // margin warnings, alerts
    info:     '#4a9eff',   // neutral info, selection, links
    purple:   '#b06aff',   // news, analytics — used sparingly
  },

  // Interactive states
  interactive: {
    hover:    '#1a1a1a',   // row hover background
    selected: '#141f2e',   // selected row — dark blue tint only
    focus:    '#4a9eff',   // focus ring color
    active:   '#0f1a2e',   // pressed state
  },
} as const

// ─── TYPOGRAPHY ──────────────────────────────────────────────

// ONE font family for everything: JetBrains Mono
// Monospace enforces column alignment across all data tables
// Size scale is intentionally narrow — data density requires it

export const TYPE = {
  family: {
    mono:  '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    // No second font. Everything is mono. This is non-negotiable.
  },

  size: {
    xs:   '10px',   // timestamps, badges, footnotes
    sm:   '11px',   // secondary data, column headers
    md:   '12px',   // DEFAULT — most data, watchlist rows
    lg:   '13px',   // primary values, LTP prices
    xl:   '14px',   // section headers, tab labels
    // Nothing above 14px except the top bar logo (16px max)
  },

  weight: {
    regular: '400',
    medium:  '500',   // primary values, highlighted data
    bold:    '600',   // only for critical alerts, never decorative
  },

  lineHeight: {
    tight:    '1.2',  // data rows — pack them in
    standard: '1.4',  // body text, notifications
  },

  letterSpacing: {
    tight:    '-0.01em',   // large numbers benefit from tighter tracking
    normal:   '0em',
    wide:     '0.06em',    // column headers — improves scannability
    caps:     '0.08em',    // section labels in ALL CAPS
  },
} as const

// ─── SPACING ─────────────────────────────────────────────────

// 4px base unit. Tight by default.
export const SPACE = {
  px:   '1px',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  2.5:  '10px',
  3:    '12px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
} as const

// Row heights — the core density decisions
export const ROW_HEIGHT = {
  compact:  '22px',   // ultra-dense mode (Movers, Trending)
  default:  '26px',   // standard watchlist, orders
  relaxed:  '30px',   // positions (more data per row)
  header:   '24px',   // column header rows
} as const

// ─── BORDERS ─────────────────────────────────────────────────

export const BORDER = {
  color:    COLOR.bg.border,      // ONE border color everywhere
  width:    '1px',
  style:    'solid',
  standard: `1px solid ${COLOR.bg.border}`,
  // Semantic borders — left accent only, 2px
  up:       `2px solid ${COLOR.semantic.up}`,
  down:     `2px solid ${COLOR.semantic.down}`,
  info:     `2px solid ${COLOR.semantic.info}`,
  warning:  `2px solid ${COLOR.semantic.warning}`,
} as const

// ─── Z-INDEX ─────────────────────────────────────────────────

export const Z = {
  base:         0,
  panel:        1,
  overlay:      10,
  dropdown:     100,
  notification: 1000,
  critical:     9999,   // connection-lost banner only
} as const

---

PART 3: COMPONENT LIBRARY

Create src/ds/components/ — every component here.
No component imports from another component's folder.
All styling via inline style objects using tokens. 
No Tailwind in DS components — tokens only.
Tailwind allowed in layout/page level only.

// ─── DS COMPONENT INDEX ──────────────────────────────────────

src/ds/
├── tokens.ts
├── components/
│   ├── Text.tsx          ← typography primitive
│   ├── Badge.tsx         ← status pills, exchange labels
│   ├── Change.tsx        ← price change display (+/- values)
│   ├── Price.tsx         ← formatted price with currency
│   ├── Volume.tsx        ← abbreviated volume (L/Cr/K)
│   ├── Timestamp.tsx     ← relative + absolute time
│   ├── Row.tsx           ← interactive table row primitive
│   ├── Table.tsx         ← table with sortable headers
│   ├── Column.tsx        ← column definition + header
│   ├── Divider.tsx       ← horizontal/vertical structural line
│   ├── Input.tsx         ← text/number input, terminal style
│   ├── Select.tsx        ← dropdown select, no native chrome
│   ├── Button.tsx        ← ghost/filled/danger variants
│   ├── Tab.tsx           ← tab + tablist
│   ├── Tooltip.tsx       ← hover tooltip
│   ├── KeyBadge.tsx      ← keyboard shortcut display
│   ├── StatusDot.tsx     ← live/offline/warning dot
│   ├── Sparkline.tsx     ← inline 7-point SVG spark
│   ├── ProgressBar.tsx   ← linear progress, GPU only
│   ├── Skeleton.tsx      ← loading state, no animation
│   └── ScrollArea.tsx    ← custom scrollbar styling


// ─── COMPONENT SPECIFICATIONS ────────────────────────────────

TEXT (Text.tsx)
  Props: size, weight, color, mono(bool), caps(bool), 
         truncate(bool), align
  
  All text renders as <span> by default, pass as prop to change.
  mono=true (default) applies font-family mono.
  caps=true applies: textTransform uppercase + letterSpacing caps.
  truncate=true applies: overflow hidden, textOverflow ellipsis, 
                         whiteSpace nowrap.
  Never use <p>, <h1-h6> in data components — use Text with props.


CHANGE (Change.tsx)
  The most-used component. Gets its own file.
  Props: value(number), showSign(bool), showArrow(bool), 
         format('absolute'|'percent'|'both')
  
  Renders colored value based on positive/negative:
    positive → COLOR.semantic.up   (#00d084)
    negative → COLOR.semantic.down (#ff3b57)
    zero     → COLOR.text.muted
  
  showArrow=true prepends ▲ or ▼ (unicode, not icon)
  format='both' renders: "+3.40 (+1.01%)"
  format='absolute' renders: "+3.40"  
  format='percent' renders: "+1.01%"
  
  All numbers right-aligned. Fixed decimal places.
  Monospace ensures column alignment.
  Price flash animation via usePriceFlash hook (color only, 
  600ms CSS keyframe — defined in animation system prompt).


PRICE (Price.tsx)
  Props: value(number), currency('₹'|'$'|''), 
         decimals(number), size, weight
  
  Currency symbol: COLOR.text.secondary, TYPE.size.sm
  Value: COLOR.text.primary, TYPE.size.lg by default
  Both in same <span>, no gap.
  Uses TYPE.family.mono always.
  Renders: ₹23,414.65


BADGE (Badge.tsx)
  Props: label, variant('exchange'|'status'|'tag'), 
         color(override)
  
  Default: bg transparent, border BORDER.standard, 
           text COLOR.text.secondary
  border-radius: 2px ONLY
  padding: 0 4px, height: 14px
  font-size: TYPE.size.xs
  letter-spacing: TYPE.letterSpacing.wide
  
  Variants:
    exchange NSE: border COLOR.semantic.info at 40% opacity,
                  text COLOR.semantic.info at 70% opacity
    exchange BSE: border COLOR.semantic.warning at 40% opacity,
                  text COLOR.semantic.warning at 70% opacity
    status LIVE:  text COLOR.semantic.up, border same
    status CLOSED: text COLOR.text.muted, border same


ROW (Row.tsx)
  The core interactive primitive. Used in ALL list/table components.
  Props: height(ROW_HEIGHT key), selected, disabled, 
         onClick, onContextMenu, children
  
  Base styles:
    display: flex
    align-items: center
    height: ROW_HEIGHT.default (26px)
    padding: 0 SPACE[2] (0 8px)
    border-bottom: BORDER.standard
    cursor: default
    user-select: none
    position: relative
    transition: background-color 80ms linear
    // 80ms — faster than standard 150ms, rows must feel instant
  
  States:
    default:  bg transparent
    hover:    bg COLOR.interactive.hover
    selected: bg COLOR.interactive.selected, 
              border-left: BORDER.info (2px)
              // selected row gets left accent, shifts content 2px
              // account for this in padding: padding-left: 6px when selected
    disabled: opacity 0.4, cursor not-allowed
    focused:  outline: 1px solid COLOR.interactive.focus, 
              outline-offset: -1px (inside the row)
  
  Row actions container (for B/S or Modify/Cancel buttons):
    position: absolute, right: SPACE[2]
    display: flex, gap: SPACE[1]
    opacity: 0
    transform: translateX(8px)
    transition: opacity 80ms linear, transform 80ms linear
    // CSS only — no framer-motion on rows
  
  On Row hover: .row-actions { opacity: 1; transform: translateX(0) }


TABLE (Table.tsx)
  Props: columns(Column[]), data, rowHeight, 
         sortable, onSort, selectedId
  
  Structure:
    <div role="table">
      <TableHeader />    ← sticky top
      <ScrollArea>
        {data.map(row => <Row key={row.id} />)}
      </ScrollArea>
    </div>
  
  Column header:
    height: ROW_HEIGHT.header (24px)
    bg: COLOR.bg.surface
    border-bottom: BORDER.standard
    Text: TYPE.size.sm, COLOR.text.secondary, 
          letterSpacing CAPS, textTransform uppercase
    Sortable column shows: "SYMBOL ↑" or "SYMBOL ↓" 
    (unicode arrows, not icons)
    Click to sort: cycle asc → desc → none
    No sort animation — instant column re-render


COLUMN (Column definition, not a UI component)
  TypeScript interface only:
  
  interface ColumnDef<T> {
    key: keyof T
    label: string
    width: number | 'flex'    // px or flex-grow
    align: 'left' | 'right' | 'center'
    render?: (value: unknown, row: T) => ReactNode
    sortable?: boolean
    tooltip?: string
  }


INPUT (Input.tsx)
  Props: value, onChange, placeholder, size, 
         prefix, suffix, error
  
  Style: 
    bg: transparent
    border: BORDER.standard
    border-radius: 0   // flat. always.
    padding: SPACE[1] SPACE[2]
    font: TYPE.family.mono, TYPE.size.md
    color: COLOR.text.primary
    caret-color: COLOR.semantic.info
    
  Focus state:
    border-color: COLOR.semantic.info
    outline: none
    // No glow. Just a colored border.
  
  Error state:
    border-color: COLOR.semantic.down
  
  Prefix/suffix (e.g. "₹" or "QTY"):
    Text: COLOR.text.muted, TYPE.size.sm
    Separator: BORDER.standard on right/left


BUTTON (Button.tsx)
  Props: variant('ghost'|'filled'|'buy'|'sell'|'danger'), 
         size('xs'|'sm'|'md'), disabled, onClick
  
  Base:
    border-radius: 0     // flat. always.
    font: TYPE.family.mono
    letter-spacing: TYPE.letterSpacing.wide
    text-transform: uppercase
    cursor: pointer
    transition: background-color 80ms linear, 
                color 80ms linear
  
  Sizes:
    xs: height 18px, padding 0 6px,  font-size TYPE.size.xs
    sm: height 22px, padding 0 8px,  font-size TYPE.size.sm
    md: height 28px, padding 0 12px, font-size TYPE.size.md
  
  Variants:
    ghost:  bg transparent, border BORDER.standard, 
            text COLOR.text.secondary
            hover: border COLOR.text.secondary, 
                   text COLOR.text.primary
    
    filled: bg COLOR.bg.overlay, border BORDER.standard,
            text COLOR.text.primary
            hover: bg COLOR.interactive.hover
    
    buy:    bg transparent, 
            border: 1px solid COLOR.semantic.up,
            color: COLOR.semantic.up
            hover: bg COLOR.semantic.up, 
                   color COLOR.text.inverse
            // Inverts on hover — classic Bloomberg buy button
    
    sell:   bg transparent,
            border: 1px solid COLOR.semantic.down,
            color: COLOR.semantic.down
            hover: bg COLOR.semantic.down,
                   color COLOR.text.inverse
    
    danger: same pattern as sell but full red always


SPARKLINE (Sparkline.tsx)
  Props: data(number[]), width, height, color(override)
  
  Pure SVG, no library.
  Renders a polyline from 7 data points.
  Color: if last > first → COLOR.semantic.up
         if last < first → COLOR.semantic.down
         else → COLOR.text.muted
  No axes. No labels. No fill. Line only.
  strokeWidth: 1px
  No animation on the line itself.
  Shown in watchlist rows only on hover (swap volume column).


SKELETON (Skeleton.tsx)
  NO animation. A static darker rectangle.
  bg: COLOR.bg.elevated
  border-radius: 0
  // Animated skeletons are distracting in data-dense UIs.
  // Static is intentional — blink would be noise.


SCROLL AREA (ScrollArea.tsx)
  Thin scrollbar: 4px width
  Track: transparent
  Thumb: COLOR.bg.border
  Thumb hover: COLOR.text.muted
  border-radius on thumb: 2px only
  
  ::-webkit-scrollbar        { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track  { background: transparent; }
  ::-webkit-scrollbar-thumb  { background: #1f1f1f; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #444444; }


TOOLTIP (Tooltip.tsx)
  Delay: 500ms before show (never instant — data UIs are noisy)
  bg: COLOR.bg.overlay
  border: BORDER.standard
  border-radius: 2px
  padding: SPACE[1] SPACE[1.5]
  font: TYPE.size.xs, COLOR.text.secondary
  Use @floating-ui/react for positioning.
  Fade in: opacity 0→1, 100ms. No transform.


KEYBADGE (KeyBadge.tsx)
  Renders keyboard shortcuts like [F8] [Alt+W]
  bg: COLOR.bg.elevated
  border: BORDER.standard
  border-radius: 2px
  padding: 1px 4px
  font: TYPE.size.xs, TYPE.family.mono
  color: COLOR.text.muted
  // Shows respect for keyboard-driven workflow


STATUSDOT (StatusDot.tsx)
  Props: status('live'|'closed'|'warning'|'offline')
  8px × 8px circle. No animation. No pulse.
  live:    COLOR.semantic.up
  closed:  COLOR.text.muted
  warning: COLOR.semantic.warning
  offline: COLOR.semantic.down
  // Pulsing dots are distracting. Static communicates clearly.


---

PART 4: WIDGET-LEVEL COMPONENT SPECIFICATIONS

// ─── WATCHLIST WIDGET ─────────────────────────────────────────

Columns (in order, widths in px):
  SYMBOL     flex    left    monospace bold, exchange badge inline
  LTP        72px    right   Price component, flash on tick
  CHG        64px    right   Change component, absolute
  %CHG       64px    right   Change component, percent
  VOL        72px    right   Volume component (hover: swap Sparkline)

Row height: ROW_HEIGHT.default (26px)

Hover state:
  - Row bg: COLOR.interactive.hover
  - VOL column: replaced by Sparkline (7 mock data points)
    transition: opacity 80ms (VOL fades out, Sparkline fades in)
  - Row actions appear: [B] [S] buttons (Button xs, buy/sell variants)
    slide in from right: translateX(8px→0), opacity(0→1), 80ms
  - Left border: 2px solid COLOR.semantic.info

Symbol cell layout:
  [SYMBOL_TEXT] [EXCHANGE_BADGE]
  SYMBOL_TEXT: TYPE.size.md, weight medium, color text.primary
  EXCHANGE_BADGE: Badge component, exchange variant
  gap: SPACE[1] between them

No pagination. Virtual scroll for lists > 50 rows.
Use react-window (FixedSizeList) for virtualization.
DO NOT render more than 30 rows in DOM at once.


// ─── MOVERS WIDGET ───────────────────────────────────────────

Three sub-tabs: GAINERS | LOSERS | VOLUME
Tab switching: instant, no animation

Columns:
  SYMBOL    flex    left
  LTP       72px    right
  %CHG      64px    right   Color-coded Change
  VOL       72px    right

Compact mode: ROW_HEIGHT.compact (22px)
Denser than watchlist — this is a scan widget.

Gainers: %CHG column values sorted desc, all green
Losers:  %CHG column values sorted asc, all red
Volume:  VOL column values sorted desc


// ─── ORDERS WIDGET ───────────────────────────────────────────

Columns:
  TIME      52px    left    Timestamp xs
  SYMBOL    flex    left    
  SIDE      36px    center  "B" colored up-green / "S" colored down-red
  QTY       48px    right
  PRICE     72px    right   Price component
  TYPE      48px    center  "MKT" / "LMT" / "SL" — Badge
  STATUS    64px    center  Badge: PENDING/EXECUTED/CANCELLED
  
  STATUS badge colors:
    PENDING:   COLOR.semantic.warning, border same
    EXECUTED:  COLOR.semantic.up, border same
    CANCELLED: COLOR.text.muted, border same

Hover: [MODIFY] [CANCEL] buttons appear right
  MODIFY: Button ghost sm
  CANCEL: Button danger sm


// ─── POSITIONS WIDGET ────────────────────────────────────────

Columns:
  SYMBOL    flex    left
  QTY       48px    right
  AVG       72px    right   Price component, muted
  LTP       72px    right   Price component, primary — flashes
  P&L       80px    right   Change absolute + percent stacked
                            Two lines in one cell:
                            Line 1: ₹2,340  (lg, colored)
                            Line 2: +1.80%  (xs, colored, muted)
  
Row height: ROW_HEIGHT.relaxed (30px) — two-line cell needs space.

Hover: [ADD] [EXIT] buttons + P&L tooltip showing:
  Entry: ₹94.20
  Current: ₹96.20
  Change: +₹2.00 (+2.12%)
  Tooltip uses Tooltip component, 500ms delay.


// ─── NEWS WIDGET ─────────────────────────────────────────────

NOT a card layout. A list layout. Terminal style.
Each item is a Row:
  [TIMESTAMP 52px] [SENTIMENT 6px left-border] [HEADLINE flex]
  [SYMBOL PILL right]

Timestamp: TYPE.size.xs, COLOR.text.muted
Headline: TYPE.size.md, COLOR.text.primary, truncate single line
Symbol pill: Badge component

Sentiment left border (2px, replaces exchange badge pattern):
  positive: COLOR.semantic.up
  negative: COLOR.semantic.down
  neutral:  COLOR.text.muted

Row height: ROW_HEIGHT.default (26px)
Hover: headline goes to COLOR.text.primary full opacity,
       [+WL] button appears right (add to watchlist)
       Text: "+WL", Button ghost xs

Second line on hover (expand row to 42px):
  Sub-headline body text appears below headline
  TYPE.size.xs, COLOR.text.secondary
  Transition: height 100ms linear (one of the rare height animations —
  acceptable here because it is single isolated row, not a list)


// ─── MARKET DEPTH WIDGET ─────────────────────────────────────

Classic 5-level bid/ask depth table.
Two halves side by side:

  BIDS                      ASKS
  QTY      PRICE    |    PRICE    QTY
  ──────────────────────────────────
  1,240   96.15    |   96.20    840
   820    96.10    |   96.25    1,200
   ...                  ...

Best bid/ask row: slightly brighter background
  bg: COLOR.bg.elevated

Depth bar behind QTY values:
  A background bar showing relative size vs total depth.
  Bids: COLOR.semantic.up at 8% opacity
  Asks: COLOR.semantic.down at 8% opacity
  Width proportional to qty/max_qty
  Rendered as ::before pseudo-element
  NO animation on bar width changes (too noisy at 1s updates)

Center price display between the two halves:
  Current LTP in large TYPE.size.xl
  Spread: "Spread: 0.05 (0.05%)" in TYPE.size.xs muted


// ─── PRICE LADDER WIDGET ─────────────────────────────────────

Vertical scrolling list of price levels.
Current price centered and highlighted.

Each row:
  [BID QTY] [PRICE] [ASK QTY] [TRADE INDICATOR]

Current price row:
  bg: COLOR.bg.elevated
  border-top: BORDER.up
  border-bottom: BORDER.down
  Price text: TYPE.size.xl, weight bold

Prices above current: ask side (COLOR.semantic.down tint on qty)
Prices below current: bid side (COLOR.semantic.up tint on qty)
QTY bars same as depth widget.


// ─── HEATMAP WIDGET ──────────────────────────────────────────

Grid of symbols, sized by market cap, colored by % change.
NO gradients. Stepped color scale only:

  > +3%:   COLOR.semantic.up, full opacity
  +1–3%:   COLOR.semantic.up, 60% opacity
  0–1%:    COLOR.semantic.up, 25% opacity
  -1–0%:   COLOR.semantic.down, 25% opacity
  -1–3%:   COLOR.semantic.down, 60% opacity
  < -3%:   COLOR.semantic.down, full opacity

Each cell:
  bg: stepped color above
  border: 1px solid COLOR.bg.base (separates cells)
  Text: SYMBOL (TYPE.size.sm, weight medium)
        %CHG  (TYPE.size.xs below symbol)
  
Text color: always COLOR.text.inverse if bg is colored,
            else TYPE.text.primary
No border-radius. Grid cells are rectangular.
Hover: border becomes COLOR.text.primary, 1px.


// ─── CHART WIDGET ────────────────────────────────────────────

Lightweight Charts (TradingView OSS).
Override all default styling to match DS:

chartOptions = {
  layout: {
    background:   { color: COLOR.bg.surface },
    textColor:     COLOR.text.secondary,
    fontFamily:    TYPE.family.mono,
    fontSize:      11,
  },
  grid: {
    vertLines:   { color: COLOR.bg.border, style: LineStyle.Dotted },
    horzLines:   { color: COLOR.bg.border, style: LineStyle.Dotted },
  },
  crosshair: {
    vertLine: {
      color:         COLOR.text.muted,
      labelBackgroundColor: COLOR.bg.overlay,
    },
    horzLine: {
      color:         COLOR.text.muted,
      labelBackgroundColor: COLOR.bg.overlay,
    },
  },
  rightPriceScale: {
    borderColor:   COLOR.bg.border,
    textColor:     COLOR.text.secondary,
  },
  timeScale: {
    borderColor:   COLOR.bg.border,
    textColor:     COLOR.text.secondary,
  },
}

Candle colors:
  upColor:        COLOR.semantic.up
  downColor:      COLOR.semantic.down
  borderUpColor:  COLOR.semantic.up
  borderDownColor:COLOR.semantic.down
  wickUpColor:    COLOR.semantic.up  at 60% opacity
  wickDownColor:  COLOR.semantic.down at 60% opacity

Volume histogram:
  up bars:   COLOR.semantic.up at 30% opacity
  down bars: COLOR.semantic.down at 30% opacity

Toolbar above chart:
  One line. Tight. No icons.
  [NIFTY 50 ▸] [D] [W] [M] [1h] [15m] [5m] [1m] | 
  [Indicators] [Draw] | [Log] [%] [Auto]
  
  All as Button ghost xs or plain Text buttons.
  Separator | is Divider component (vertical, 12px tall).
  Active timeframe: border-bottom 1px COLOR.semantic.info


---

PART 5: FLEXLAYOUT DOCKING SYSTEM STYLING

Override ALL flexlayout-react CSS to match the DS.
Target the library's CSS classes directly in globals.css:

.flexlayout__layout {
  background: var(--bg-base);
}

.flexlayout__tabset {
  background: var(--bg-surface);
  border: 1px solid var(--border);
}

.flexlayout__tabset_header {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  height: 28px;
  padding: 0;
}

.flexlayout__tab_button {
  height: 28px;
  padding: 0 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  border: none;
  border-right: 1px solid var(--border);
  border-radius: 0;
  background: transparent;
  transition: color 80ms linear, background 80ms linear;
}

.flexlayout__tab_button--selected {
  color: var(--text-primary);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--color-info);
  // Single pixel underline = selected. Bloomberg style.
}

.flexlayout__tab_button:hover:not(.flexlayout__tab_button--selected) {
  color: var(--text-secondary);
  background: var(--interactive-hover);
}

.flexlayout__splitter {
  background: var(--border);
  width: 4px;
  height: 4px;
}

.flexlayout__splitter:hover,
.flexlayout__splitter_drag {
  background: var(--color-info);
  transition: background 80ms linear;
}

.flexlayout__drag_rect {
  background: rgba(74, 158, 255, 0.08);
  border: 1px solid var(--color-info);
  border-radius: 0;
}

// Drag rect MUST have border-radius 0 — rounded drop zones
// look wrong in a terminal UI


---

PART 6: TOP BAR

Height: 36px (tighter than standard 48px)
Background: COLOR.bg.surface
Border-bottom: BORDER.standard
Padding: 0 SPACE[2]

Left section:
  Logo: "OPENTRADER" — TYPE.size.xl, weight bold, 
        color COLOR.text.primary
        Space then "T3" in COLOR.semantic.info
        (Bloomberg-style product ID)
  
  Nav tabs: [HOME] [WATCHLIST] [CHARTS]
    Rendered as Buttons ghost xs, all caps, letter-spacing wide
    Active: border-bottom 1px COLOR.semantic.info
    gap: SPACE[2] between tabs

Center section:
  Scrolling ticker — 
    Single line, font TYPE.size.sm
    Items: "NF 23,414 ▲503 +2.20%  BNF 53,942 ▲1336 +2.54%"
    NF/BNF as abbreviations (Bloomberg style, not full names)
    ▲ = up (COLOR.semantic.up), ▼ = down (COLOR.semantic.down)
    Separator: "  ·  " in COLOR.text.muted
    Implemented as CSS marquee or JS auto-scroll
    Speed: 40px/second (readable at a glance)

Right section (left to right):
  [● LIVE] StatusDot + "LIVE" text xs muted
  [13:28:19] Timestamp, monospace, muted
  [P&L: +0.00] Change component, sm
  [OPEN: 0] Text sm muted
  [FUNDS: ₹0.00] Price sm + [+] Button ghost xs
  [🔕] SilenceToggle (text "MUTE" when silenced, not icon)
  [BELL(3)] "NOTIF" text + unread count Badge
  [WIDGETS ▾] Button ghost xs


---

PART 7: LAYOUT PRESETS

Preset definitions as FlexLayout JSON models.
Each preset stored in src/layouts/presets/:
  default.layout.json
  chart-focus.layout.json
  trading.layout.json

Preset selector in top bar: plain text "[DEFAULT ▾]"
Opens a micro dropdown (max 160px wide):
  ● DEFAULT
    CHART FOCUS
    TRADING
  ──────────
  SAVE CURRENT
Each option TYPE.size.sm, hover bg COLOR.interactive.hover
Checkmark (●) in COLOR.semantic.info for active preset.


---

PART 8: CSS VARIABLES BRIDGE

In index.css, define CSS variables from tokens so they're 
accessible to flexlayout overrides and any non-React CSS:

:root {
  --bg-base:          #0a0a0a;
  --bg-surface:       #0f0f0f;
  --bg-elevated:      #141414;
  --bg-overlay:       #1a1a1a;
  --border:           #1f1f1f;

  --text-primary:     #e8e8e8;
  --text-secondary:   #888888;
  --text-muted:       #444444;
  --text-inverse:     #0a0a0a;

  --color-up:         #00d084;
  --color-down:       #ff3b57;
  --color-warning:    #f5a623;
  --color-info:       #4a9eff;
  --color-purple:     #b06aff;

  --interactive-hover:    #1a1a1a;
  --interactive-selected: #141f2e;
  --interactive-focus:    #4a9eff;

  --font-mono:  "JetBrains Mono", "Fira Code", "Consolas", monospace;

  --row-compact:  22px;
  --row-default:  26px;
  --row-relaxed:  30px;
  --row-header:   24px;
}


---

PART 9: SCALABILITY RULES

These rules must be enforced in code review / PR checks:

1. NO component imports tokens by hardcoding hex values.
   All colors reference COLOR.* from tokens.ts.
   Linting rule: no-hardcoded-colors (custom ESLint rule).

2. NO component imports from another widget folder.
   Widgets are siblings, not parents/children.

3. DS components (src/ds/) have ZERO dependencies on 
   widget state or stores. They are pure presentational.

4. Every new widget MUST implement the WidgetConfig manifest.
   The registry auto-discovers it. No manual wiring.

5. Row virtualization is MANDATORY for any list > 30 items.
   Use react-window FixedSizeList. No exceptions.

6. Type safety: no `any`. All mock data is fully typed.
   shared types live in src/types/. Never duplicated.

7. DS components export TypeScript prop types.
   Consumers get autocomplete for all token values.


---

DELIVERABLE CHECKLIST

Layout:
  □ 36px top bar matching spec, all elements present
  □ FlexLayout docking with terminal-style tab chrome
  □ Default preset loads: Watchlist/Movers | Chart | News
  □ Splitter resizing works, highlights on hover

Design System:
  □ All DS components built and exported from src/ds/
  □ CSS variables defined in index.css
  □ tokens.ts is the ONLY place color/type/space values exist
  □ Zero hardcoded hex values outside tokens.ts

Widgets (stub or full):
  □ Watchlist: columns, tick flash, hover B/S, sparkline swap
  □ Movers: GAINERS/LOSERS/VOLUME tabs, compact rows
  □ Orders: status badges, hover MODIFY/CANCEL
  □ Positions: two-line P&L cell, hover tooltip
  □ News: left sentiment border, hover expand, +WL button
  □ Market Depth: bid/ask depth bars, spread display
  □ Chart: Lightweight Charts with full DS color override
  □ Heatmap: stepped color scale, no gradients

Data:
  □ All widgets consume data via mock hooks only
  □ Price ticks update every 1s via useMockTicker singleton
  □ usePriceFlash applied to all LTP cells

Performance:
  □ react-window on watchlist (20+ rows virtualized)
  □ No layout recalculations during price updates
  □ No hardcoded animation values — all from DURATION/EASING config
  □ Chrome DevTools: zero purple layout blocks during tick updates