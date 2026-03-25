# OpenTrader — Product Requirements Document
### An Open-Source Web Trading Platform (DEXT T3 / Dhan-Inspired)

> **Version:** 1.0 — Proof of Concept
> **Date:** March 2026
> **Status:** Draft
> **Platform:** Web-only (Desktop-first, Mobile-responsive)

---

## 1. Executive Summary

OpenTrader is a fully open-source, browser-based trading terminal inspired by the DEXT T3 interface built on top of Dhan's infrastructure. It provides traders with a professional-grade experience: real-time watchlists, candlestick charting with indicators, order entry, a price ladder, positions/orders management, and a rich widget system — all within a dark, high-density UI.

The PoC (Proof of Concept) targets a functional, single-page React application that demonstrates the core layout and key interactions using mock/simulated data, with plug-in points for a real broker API.

---

## 2. Visual & UX Analysis of Reference Screenshots

### 2.1 Global Layout (All Screens)

| Zone | Description |
|---|---|
| **Top Bar** | App logo (DEXT T3), nav tabs (Home, Watchlist Tracker, Trade on Charts), global market ticker scrolling Nifty 50 + Nifty Bank with LTP / change / % change, clock (IST), P&L, Open count, Funds, Widgets button, User avatar |
| **Left Panel** | Watchlist — sortable, filterable (Dividend Yield dropdown), symbol rows with LTP, Change (₹), % Change, Volume. Rows highlight green/red based on direction. Action bar at top (add, fx, settings icons) |
| **Center Panel** | TradingView-style candlestick chart. Toolbar on left side (crosshair, draw tools, shapes, text, emoji, magnifiers, trash). Timeframe selector (5Y 3Y 1Y 6M 3M 1M 1W 1D). Indicator button. Top symbol search bar. Auto/Log/% scale toggles at bottom right. Volume histogram below price. |
| **Right Panel** | Context-sensitive: Positions/Orders tabs, Price Ladder widget, Watchlist mirror, or Widget drawer |
| **Bottom Bar** | (In expanded view) Positions / Orders / Portfolio / Notifications tabs with open/closed counts |

### 2.2 Watchlist (Image 1)

- **Filter bar**: "Dividend Yield" dropdown — implies multiple watchlist presets or filter modes
- **Columns**: Symbol (+ exchange badge NSE/BSE), LTP (Last Traded Price), Chg (absolute), % Chg (colour-coded), Volume
- **Colour coding**: Green rows = positive change; Red rows = negative; Highlighted rows (HINDPETRO, NTPC, COALINDIA) = teal/green background indicating selected or alert state
- **Exchange badges**: Small grey pill next to symbol name (NSE / BSE)
- **Volume display**: Abbreviated — `L` = Lakhs, `Cr` = Crores, `K` = Thousands

### 2.3 Order Entry Modal (Image 2)

- Triggered by right-clicking a watchlist symbol → context menu with: Buy, Sell, Chart (F8), Option Chain, Depth (F6), Time & Sales (F7), Technicals (Alt+T), Price Ladder (Alt+L), Copy (Ctrl+C), Export, Remove from Watchlist
- **Modal fields**:
  - Symbol name + current price + change
  - Exchange selector (NSE / BSE pill)
  - Order type (Trading / Delivery / etc.)
  - Buy / Sell toggle buttons
  - Quantity input (numeric stepper)
  - Price selector (Market / Limit / SL / SL-M)
  - Required margin display (`Req: ₹19.29 (5.01X)`)
  - Available margin display (`Av: ₹0.00`)
  - **Instant Buy** CTA button (large, green)
- Error state visible: "The selected symbol is not tradable. Please choose a tradable symbol." — shown in the Price Ladder panel when NIFTY IDX is selected

### 2.4 Widget Drawer (Image 3)

A full-screen overlay/sidebar opened via the Widgets button. Organized into sections:

| Section | Widgets |
|---|---|
| **Market Data** | Watchlist (All+W), Indices, Depth, ETF, Movers, Time And Sales (F7), Trending, Price Ladder (Alt+L) |
| **Analytics** | Technicals (Alt+T), Options Chain (Alt+O), Straddle Chain, Live Scanner, Candlesticks Pattern, VWap Indicator, Corporate Actions, Heatmap, Futures Chain, Fundamentals |
| **Account** | Portfolio (F12), Positions (F4), Orders (F3), Super Orders, Notifications (F9) |
| **Graphs** | OI Graph (Alt+G), Chart (F8), IV Chart, Volatility Skew |
| **Scalping** | Scalper, Option Scalper |
| **Tools** | News, Basket |

Each widget tile shows name + keyboard shortcut. Toggle switch visible (green = active).

### 2.5 Price Ladder Panel

- Shown alongside chart when Alt+L or right-click → Price Ladder
- Displays NIFTY IDX symbol with LTP + change
- Error/info state: "The selected symbol is not tradable" message when an index is loaded

### 2.6 Chart Details

- Powered by TradingView Charting Library (or Lightweight Charts as OSS alternative)
- **Candlestick** chart, Daily timeframe default
- **Volume SMA** sub-indicator visible
- Price axis on right; date axis on bottom
- Green/Red candles matching bullish/bearish sessions
- Current price label on right axis (teal pill: `23,414.65`)
- Current volume label on volume axis (teal pill: `304.66M`)
- Dhan layout selector dropdown in toolbar

---

## 3. Functional Requirements

### 3.1 Core Modules — PoC Scope

| ID | Module | Priority | PoC Included |
|---|---|---|---|
| F-01 | Global ticker bar (scrolling market data) | P0 | ✅ Mock data |
| F-02 | Watchlist panel | P0 | ✅ Mock data |
| F-03 | Candlestick chart with volume | P0 | ✅ Lightweight Charts |
| F-04 | Order entry modal | P0 | ✅ UI only (no execution) |
| F-05 | Right-click context menu on watchlist rows | P1 | ✅ |
| F-06 | Widget drawer overlay | P1 | ✅ Static tiles |
| F-07 | Positions / Orders bottom panel | P1 | ✅ Empty state |
| F-08 | Price Ladder panel | P2 | ⬜ Stub panel |
| F-09 | Broker API integration (Dhan / Zerodha Kite) | P2 | ⬜ Interface only |
| F-10 | Real-time WebSocket price feed | P2 | ⬜ Simulated ticks |
| F-11 | Options Chain widget | P3 | ⬜ Out of scope |
| F-12 | Scalper widget | P3 | ⬜ Out of scope |

---

## 4. Technical Architecture

### 4.1 Stack

```
Frontend Framework : React 18 + TypeScript
Build Tool         : Vite
Styling            : Tailwind CSS (dark theme config)
Charting           : Lightweight Charts (TradingView OSS) OR
                     Apache ECharts (fully OSS alternative)
State Management   : Zustand
Data Layer (PoC)   : Mock JSON + simulated WebSocket via setInterval
Data Layer (Prod)  : Broker REST API + WebSocket (Dhan / Zerodha / Angel)
Deployment         : Vercel / Netlify / Self-hosted Docker
```

### 4.2 Folder Structure

```
opentrader/
├── src/
│   ├── components/
│   │   ├── TopBar/           # Ticker scroll, nav, clock, funds
│   │   ├── Watchlist/        # Panel, Row, FilterBar, ContextMenu
│   │   ├── Chart/            # ChartContainer, Toolbar, TimeframeBar
│   │   ├── OrderEntry/       # Modal, BuySellToggle, PriceSelector
│   │   ├── WidgetDrawer/     # Overlay, Section, WidgetTile
│   │   ├── Positions/        # BottomPanel, PositionRow
│   │   └── PriceLadder/      # Panel, LadderRow
│   ├── store/                # Zustand slices
│   ├── hooks/                # useMarketData, useOrders, useTicker
│   ├── mock/                 # mockWatchlist.ts, mockOHLC.ts
│   ├── types/                # Symbol, Order, Position, OHLC
│   └── App.tsx
├── public/
└── vite.config.ts
```

### 4.3 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `≥ 1280px` | 3-column: Watchlist (280px) + Chart (flex) + Right Panel (320px) |
| `1024–1279px` | 2-column: Chart + collapsible side panels via tabs |
| `768–1023px` | Tabbed layout: Chart tab, Watchlist tab, Orders tab |
| `< 768px` | Full-screen chart with bottom sheet Watchlist; swipeable panels |

---

## 5. UI Component Specifications

### 5.1 Top Bar

```
[Logo]  [Nav Tabs]  ─────── [Scrolling Ticker] ───────  [Clock] [P&L] [Funds] [Widgets▼] [Avatar]
```

- Ticker: Horizontally auto-scrolling marquee. Format: `Nifty Bank 53,942.35  1,336.70 (+2.54%)`
- Positive change: `#22c55e` (green). Negative: `#ef4444` (red)
- Clock: Live IST (UTC+5:30), updated every second
- Funds: Displays `₹0.00` with a `+` button to add funds

### 5.2 Watchlist Panel

- Fixed left column, scrollable rows
- Each row: `[Symbol] [Exchange Badge] [LTP] [Chg] [%Chg] [Volume]`
- Hover state: subtle highlight + quick action icons (B/S)
- Exchange badge: pill shape, 2px border, `NSE` = grey, `BSE` = blue-grey
- Volume formatting: auto-abbreviate (`L` / `Cr` / `K`)
- Right-click: 11-item context menu matching Image 2 reference

### 5.3 Chart Panel

- Full-height, flex-grow center column
- Symbol search in top bar (`Q NIFTY 50`)
- Left toolbar: draw tools (12 icons as seen in reference)
- Bottom: timeframe chips `[5Y][3Y][1Y][6M][3M][1M][1W][1D]`
- Scale toggles: `A` (auto) / `L` (log) bottom-right
- Sub-chart: Volume histogram, coloured by candle direction
- Current price: floating label on right price axis

### 5.4 Order Entry Modal

```
┌─ Order Entry ─────────────────────── [×] ┐
│  [Symbol]  [LTP]  [+Change]               │
│  [NSE▼]  [Trading▼]  [Buy]  [Sell]        │
│                                           │
│  Quantity: [___1___▲▼]                    │
│  Price:    [Market▼]                      │
│                                           │
│  Req: ₹19.29 (5.01X)    Av: ₹0.00 [+]   │
│                                           │
│  [        Instant Buy        ]            │
└───────────────────────────────────────────┘
```

- Green header for Buy mode, Red for Sell mode
- Keyboard shortcut: `B` opens Buy, `S` opens Sell from watchlist hover

### 5.5 Widget Drawer

- Slides in from right (or full overlay)
- Search bar at top
- Grouped sections with 2-column grid of tiles
- Each tile: icon + label + shortcut badge
- Toggle switch (green pill) in header for active widgets

---

## 6. Design System

### 6.1 Color Palette

```css
--bg-primary:    #0d0f14;   /* Main background */
--bg-secondary:  #161920;   /* Panel backgrounds */
--bg-elevated:   #1e2029;   /* Cards, modals */
--bg-row-hover:  #252836;   /* Watchlist row hover */

--text-primary:  #e8eaf0;   /* Main text */
--text-secondary:#8b90a0;   /* Labels, subtitles */
--text-muted:    #555a6b;   /* Disabled, placeholder */

--accent-green:  #22c55e;   /* Positive, Buy, Up */
--accent-red:    #ef4444;   /* Negative, Sell, Down */
--accent-teal:   #06b6d4;   /* Active price labels, highlights */
--accent-blue:   #3b82f6;   /* Links, focus rings */

--border:        #2a2d3a;   /* Panel dividers */
--border-subtle: #1e2130;   /* Row separators */
```

### 6.2 Typography

```css
--font-mono:  'JetBrains Mono', monospace;   /* Prices, numbers */
--font-ui:    'DM Sans', sans-serif;          /* Labels, nav */
--font-data:  'IBM Plex Mono', monospace;     /* Volume, change values */
```

### 6.3 Spacing & Sizing

- Base unit: `4px`
- Watchlist row height: `32px`
- Top bar height: `48px`
- Bottom panel height: `180px` (collapsible)
- Modal max-width: `480px`

---

## 7. Data Model (TypeScript Interfaces)

```typescript
interface Symbol {
  ticker: string;          // "IRFC"
  exchange: "NSE" | "BSE";
  ltp: number;             // Last traded price
  change: number;          // Absolute change
  changePct: number;       // % change
  volume: number;          // Raw volume
  open: number;
  high: number;
  low: number;
  close: number;
}

interface OHLCV {
  time: number;            // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Order {
  id: string;
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "SL" | "SL-M";
  quantity: number;
  price?: number;
  status: "PENDING" | "EXECUTED" | "CANCELLED";
  timestamp: number;
  productType: "TRADING" | "DELIVERY" | "INTRADAY";
}

interface Position {
  symbol: string;
  exchange: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPct: number;
}
```

---

## 8. Broker API Integration Points

The PoC uses mock data. Production integration should support:

| Broker | API Type | WebSocket | Notes |
|---|---|---|---|
| Dhan | REST + WS | ✅ | Primary target (matches reference) |
| Zerodha Kite | REST + WS | ✅ | Most documented OSS ecosystem |
| Angel One SmartAPI | REST + WS | ✅ | Free tier available |
| Upstox | REST + WS | ✅ | Good documentation |
| Paper Trading | Internal sim | ✅ | Default for PoC |

Define a `BrokerAdapter` interface:

```typescript
interface BrokerAdapter {
  getQuote(symbols: string[]): Promise<Symbol[]>;
  getHistorical(symbol: string, interval: string, from: Date, to: Date): Promise<OHLCV[]>;
  placeOrder(order: Omit<Order, 'id' | 'status' | 'timestamp'>): Promise<Order>;
  getPositions(): Promise<Position[]>;
  getOrders(): Promise<Order[]>;
  subscribeTicker(symbols: string[], cb: (s: Symbol) => void): () => void;
}
```

---

## 9. PoC Milestones

### Phase 1 — Shell & Layout (Week 1)
- [ ] Vite + React + Tailwind project scaffold
- [ ] Top bar with mock ticker scroll and clock
- [ ] 3-column layout (Watchlist | Chart | Right Panel)
- [ ] Mobile responsive tab layout
- [ ] Dark theme design tokens applied

### Phase 2 — Watchlist & Chart (Week 2)
- [ ] Watchlist with mock 20 symbols
- [ ] Simulated price ticks (random walk)
- [ ] Right-click context menu
- [ ] Lightweight Charts candlestick integration
- [ ] Mock OHLCV data for NIFTY 50 (1 year daily)
- [ ] Volume histogram sub-chart
- [ ] Timeframe selector (UI only for PoC)

### Phase 3 — Order Entry & Widgets (Week 3)
- [ ] Order entry modal (Buy/Sell UI)
- [ ] Widget drawer with all tiles
- [ ] Positions/Orders bottom panel (empty state)
- [ ] Price Ladder stub panel

### Phase 4 — Polish & Responsiveness (Week 4)
- [ ] Mobile bottom sheet for watchlist
- [ ] Swipeable panel navigation on tablet
- [ ] Keyboard shortcuts (B, S, F8, F6, etc.)
- [ ] Loading skeletons
- [ ] Error and empty states

---

## 10. Out of Scope for PoC

- Real order execution
- Real-time WebSocket data feeds
- Options Chain, Straddle Chain
- Scalper / Option Scalper
- OI Graph, IV Chart
- Live Scanner, Heatmap
- Authentication / login
- Portfolio P&L calculation
- News feed
- Basket orders

---

## 11. Open Source Considerations

- **License**: MIT
- **Chart Library**: [Lightweight Charts](https://github.com/tradingview/lightweight-charts) (Apache 2.0) — preferred. Fallback: Apache ECharts
- **No TradingView Pro dependency** in PoC
- All icons: Lucide React (MIT)
- Fonts: Google Fonts (OFL)

---

## 12. Prompt Engineering Guide (for Claude/Codex Execution)

When using this PRD to drive AI-assisted code generation, structure your prompts as follows:

### Master System Prompt
```
You are an expert React + TypeScript developer building OpenTrader, an open-source 
web trading terminal. The UI is dark-themed, data-dense, and modelled after 
professional trading platforms. Use Tailwind CSS for styling, Zustand for state, 
and Lightweight Charts for candlestick rendering. All data is mocked. 
No authentication. Follow the design tokens and component specs in the PRD exactly.
```

### Per-Component Prompts

**Top Bar:**
> Build a React TopBar component with: (1) a DEXT T3 logo on the left, (2) three nav tabs, (3) an auto-scrolling ticker showing mock Nifty 50 and Nifty Bank data with green/red colouring, (4) a live IST clock, (5) P&L display, (6) Funds with + button, (7) Widgets button, (8) Avatar circle. Use Tailwind dark theme classes. Height: 48px.

**Watchlist:**
> Build a WatchlistPanel React component. It should render a scrollable list of 20 mock symbols. Each row shows: symbol name, exchange badge (NSE/BSE pill), LTP in monospace font, absolute change (green/red), % change (green/red), and abbreviated volume. Include a right-click context menu with options: Buy, Sell, Chart, Option Chain, Depth, Time & Sales, Technicals, Price Ladder, Copy, Export, Remove from Watchlist. On hover, show B and S quick-action buttons. Use JetBrains Mono for price data.

**Chart:**
> Build a ChartPanel component using @tradingview/lightweight-charts. Render a CandlestickSeries with mock NIFTY 50 daily OHLCV data (generate 365 bars of realistic random-walk data). Add a HistogramSeries for volume beneath. Include a timeframe selector bar at the bottom with chips: 5Y, 3Y, 1Y, 6M, 3M, 1M, 1W, 1D. A symbol search bar at the top. The chart must auto-resize to its container.

**Order Entry Modal:**
> Build an OrderEntryModal React component. It receives a symbol prop. It has: a green header (Buy mode) / red header (Sell mode), Buy/Sell toggle, exchange selector dropdown, product type dropdown (Trading/Delivery/Intraday), quantity numeric stepper, price type selector (Market/Limit/SL/SL-M), optional limit price input (shown only for Limit/SL), required margin display, available margin display, and an Instant Buy/Sell CTA button. No actual order submission — call a mock handler.

**Widget Drawer:**
> Build a WidgetDrawer overlay component that slides in from the right. It has a search bar at top and renders 6 sections: Market Data, Analytics, Account, Graphs, Scalping, Tools. Each section has a 2-column grid of WidgetTile components showing an icon, name, and keyboard shortcut badge. Include a close button. Animate open/close with a slide transition.

---

## 13. Success Criteria for PoC

| Criterion | Measure |
|---|---|
| Layout fidelity | ≥ 90% visual match to reference screenshots |
| Mobile usability | Fully usable on 375px viewport (iPhone SE) |
| Chart performance | Renders 365 daily candles at ≥ 60fps |
| Mock tick updates | Watchlist prices update every 1s without jank |
| Order modal | Opens within 100ms of right-click → Buy |
| Lighthouse score | Performance ≥ 80, Accessibility ≥ 75 |
| Bundle size | Initial JS < 500KB gzipped |

---

*End of Document — OpenTrader PoC PRD v1.0*