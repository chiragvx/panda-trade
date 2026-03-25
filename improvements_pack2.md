# OpenTrader Widget Ecosystem — PRD & Agent Build Prompt

---

## How to use this document

Copy everything from the "Agent Prompt" section below and paste it directly into Claude Code, Cursor, or any agentic coding environment. The agent has everything it needs to begin building without asking clarifying questions.

---

# Agent Prompt

You are a senior full-stack engineer building a modular widget ecosystem for a professional stock trading platform called OpenTrader, targeted at Indian equity and F&O traders. Your stack is React + TypeScript + Tailwind CSS. All data sources are free, open, or public APIs. No paid data vendors.

Build each widget as a self-contained React component that can be docked into a dashboard grid. Use a dark trading terminal aesthetic — dark backgrounds, green for positive, red for negative, amber for warnings, minimal chrome. Every widget must update in real time or on a configurable polling interval.

Below is the complete specification. Build them in priority order. Do not ask for clarification — make sensible defaults and move forward.

---

## Technical foundation — build this first

```
Stack:
- React 18 + TypeScript
- Tailwind CSS (dark mode default)
- Zustand for global state (selected symbol, watchlist, positions)
- React Query for data fetching and polling
- Recharts for all charting
- react-grid-layout for draggable/resizable widget dock
- Socket.io client for any real-time feeds
- date-fns for time formatting

Global state shape:
{
  activeSymbol: string,         // currently focused symbol e.g. "HDFCBANK"
  watchlist: string[],          // user's watchlist
  positions: Position[],        // open positions
  alerts: Alert[],              // active price/event alerts
  workspace: "intraday" | "research" | "fno"
}

All widgets subscribe to activeSymbol from global state.
When activeSymbol changes, all linked widgets re-fetch for the new symbol.

Widget interface every component must implement:
{
  id: string
  title: string
  defaultSize: { w: number, h: number }   // grid units
  minSize: { w: number, h: number }
  isLinked: boolean                         // follows activeSymbol
  refreshInterval: number                   // ms, 0 = manual only
  component: React.FC<WidgetProps>
}
```

---

## Widget 1 — FII/DII Live Tracker

### What it does
Shows Foreign Institutional Investor and Domestic Institutional Investor net buy/sell activity updating through the trading session. Overlays net flow as a bar chart against Nifty intraday price line.

### Data source
```
Primary: NSE India open data
Endpoint: https://www.nseindia.com/api/fiidiiTradeReact
Headers required: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.nseindia.com" }
Polling interval: 5 minutes during market hours (9:15am–3:30pm IST)
Fallback: Cache last known value, show stale timestamp
```

### UI spec
- Two rows: FII row and DII row
- Each row shows: Buy value (₹ cr), Sell value (₹ cr), Net (coloured green/red), and a mini horizontal bar showing net direction
- Below the rows: a dual-axis chart — left axis is Nifty price (line), right axis is cumulative FII net for the day (bar). X axis is time from 9:15 to 3:30
- When FII net crosses from positive to negative mid-session, flash the widget border amber for 5 seconds
- Widget size: 2 wide × 2 tall grid units

### Edge cases
- Pre-market (before 9:15): show previous day's final FII/DII numbers with "Prior session" label
- API unavailable: show cached data with red dot and "Stale — last updated HH:MM" label
- Weekend/holiday: show last trading day data clearly labelled

---

## Widget 2 — Block & Bulk Deal Alert Feed

### What it does
Ingests NSE/BSE block and bulk deal disclosures in real time. Matches against the user's watchlist and fires visual + browser alerts for any deal in a watched symbol.

### Data source
```
NSE Block deals: https://www.nseindia.com/api/block-deal
NSE Bulk deals: https://www.nseindia.com/api/bulk-deal
BSE Block deals: https://api.bseindia.com/BseIndiaAPI/api/BlockDeals/w
Polling interval: 60 seconds during market hours
Parse fields: symbol, client name, buy/sell, quantity, price, deal value (qty × price)
```

### UI spec
- Feed layout: newest deal at top, scrollable list
- Each deal card shows: symbol pill (coloured blue if in watchlist), client name truncated to 20 chars, B or S badge (green/red), quantity formatted with commas, price, and total deal value in ₹ crore
- If symbol is in user watchlist: highlight card with left border accent in amber, play a soft chime (use Web Audio API, single 440hz tone, 200ms)
- Filter bar at top: toggle All / Watchlist only / Buys only / Sells only
- "Deal size threshold" input: only show deals above ₹ X crore (default 10cr)
- Widget size: 2 wide × 3 tall

### Logic
```typescript
// Alert logic
if (deal.symbol is in watchlist AND deal.value > threshold) {
  dispatch alert to global alerts store
  trigger amber highlight on watchlist row for that symbol
  play chime
  send browser Notification API push if permission granted
}
```

---

## Widget 3 — Options Max Pain Calculator

### What it does
Reads live options chain OI data from NSE and calculates the max pain strike — the price at which total option writer losses are minimised at expiry. Plots as a horizontal line on a bar chart of OI by strike.

### Data source
```
NSE options chain: https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY
Also supports: BANKNIFTY, FINNIFTY, and any F&O stock symbol
Polling interval: 10 minutes
Fields needed: strikePrice, CE.openInterest, PE.openInterest, expiryDate
```

### Calculation
```typescript
function calculateMaxPain(chain: OptionChainData[]): number {
  // For each strike price as potential expiry:
  // Sum the intrinsic value loss for all CE writers (strikes below expiry)
  // Sum the intrinsic value loss for all PE writers (strikes above expiry)
  // Total pain = CE writer loss + PE writer loss
  // Max pain strike = strike with minimum total pain
  
  return strikes.reduce((minStrike, strike) => {
    const ceLoss = chain
      .filter(s => s.strike < strike)
      .reduce((sum, s) => sum + (strike - s.strike) * s.ceOI, 0)
    const peLoss = chain
      .filter(s => s.strike > strike)
      .reduce((sum, s) => sum + (s.strike - strike) * s.peOI, 0)
    const totalPain = ceLoss + peLoss
    return totalPain < minStrike.pain ? { strike, pain: totalPain } : minStrike
  }, { strike: 0, pain: Infinity }).strike
}
```

### UI spec
- Symbol selector at top: dropdown of Nifty, BankNifty, Finnifty + text input for stocks
- Expiry selector: show next 3 weekly expiries as pills, user selects one
- Bar chart: X axis = strike prices (±10% from current price), Y axis = total OI (CE bar above axis in blue, PE bar below in red)
- Overlay a vertical dashed amber line at the max pain strike with label "Max pain: 24,500"
- Overlay a vertical white line at current index price
- Below chart: distance between current price and max pain in points and percent, with directional arrow
- Widget size: 3 wide × 3 tall

---

## Widget 4 — SEBI & Exchange Filing Speed Reader

### What it does
Ingests all corporate filings from BSE and NSE for watchlist companies. Uses a local LLM call (Anthropic API) to classify and summarise each filing in one line. Surfaces high-priority filings immediately.

### Data source
```
BSE filings RSS: https://www.bseindia.com/corporates/ann.html (parse RSS)
NSE filings: https://www.nseindia.com/companies-listing/corporate-filings-announcements
Polling interval: 2 minutes
Filter: only fetch for symbols in user's watchlist
```

### Classification via API call
```typescript
async function classifyFiling(filingText: string): Promise<FilingClassification> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are a financial analyst assistant. Classify and summarise this exchange filing.

Filing text: ${filingText}

Respond only in JSON:
{
  "category": one of ["results", "insider_trade", "pledging", "management_change", "regulatory", "merger_acquisition", "dividend", "other"],
  "priority": one of ["high", "medium", "low"],
  "headline": "single sentence summary under 15 words",
  "keyNumber": "the single most important number or percentage in the filing, or null",
  "sentiment": one of ["positive", "negative", "neutral"]
}

High priority = insider buying/selling above 1%, pledging change above 5%, M&A, management exit, results beat/miss.`
      }]
    })
  })
  const data = await response.json()
  return JSON.parse(data.content[0].text)
}
```

### UI spec
- Feed of classified filing cards, newest first
- Each card: category badge (colour coded), symbol pill, AI-generated headline in 14px, key number in larger font if present, timestamp, sentiment dot
- Category badge colours: results=blue, insider_trade=amber, pledging=red, management_change=orange, merger_acquisition=purple, regulatory=gray
- High priority filings: full-width card with left border accent, auto-expanded
- Filter row: filter by category, by symbol, by priority
- Click any card: expand to show full filing text
- Widget size: 2 wide × 4 tall

---

## Widget 5 — Satellite Port & Cargo Activity Monitor

### What it does
Shows vessel traffic at major Indian ports using AIS (ship tracking) data. Plots vessel count as a time series and overlays related stock prices. High vessel density at a coal port before Coal India reports = advance signal.

### Data source
```
Primary: MarineTraffic free API or AISHub (register for free key)
Endpoint: https://services.marinetraffic.com/api/getvessel/v:8/{API_KEY}
          ?protocol=jsono&MMSI=...&timespan=60
Fallback open source: https://www.aishub.net/api (free with registration)

Ports to track with coordinates:
JNPT (Nhava Sheva): lat=18.9480, lon=72.9440
Mundra Port: lat=22.7333, lon=69.7167  
Vizag Port: lat=17.6868, lon=83.2185
Chennai Port: lat=13.0836, lon=80.2957
Paradip Port: lat=20.2961, lon=86.6833

Related stocks mapping:
Mundra (coal) → COALINDIA, ADANIPORTS
JNPT (containers) → ADANIPORTS, CONCOR
Vizag (steel) → SAIL, JSPL
Paradip (crude) → BPCL, IOC
```

### UI spec
- Map view using Leaflet.js (open source, no API key needed) centred on India
- Port markers sized by current vessel count — larger circle = more vessels
- Click a port: side panel shows vessel count trend (7-day sparkline), vessel type breakdown (cargo/tanker/container), and list of related stocks with their current price change
- Toggle: "show vessel trails" — plots last 24h movement paths of vessels in port vicinity
- Below map: correlation table — port name, 7-day vessel count change %, related stock 7-day return %. Highlight rows where both are moving in same direction
- Widget size: 4 wide × 3 tall

---

## Widget 6 — Corporate Jet Tracker (OSINT)

### What it does
Tracks aircraft associated with major Indian corporate groups using open ADS-B data. Alerts when a tracked aircraft makes an unscheduled flight, particularly to financial hubs (Mumbai, Delhi).

### Data source
```
OpenSky Network API (completely free, no key needed for basic):
Endpoint: https://opensky-network.org/api/states/all?lamin=8&lomin=68&lamax=37&lomax=97
          (bounding box covers all of India)
Polling interval: 15 minutes
Also: https://opensky-network.org/api/flights/aircraft?icao24={icao}&begin={ts}&end={ts}

Seed list of known corporate aircraft ICAO codes (research and populate):
- Adani Group: [known tail numbers — research via FlightAware public data]
- Reliance Industries: [known tail numbers]
- Tata Group: [known tail numbers]
- Bajaj Group: [known tail numbers]
Store as user-editable JSON so traders can add their own watched aircraft
```

### UI spec
- Table of tracked aircraft: company name, tail number, last known location, last flight date, status (airborne / grounded)
- If aircraft is currently airborne: show live position on mini map, origin → destination if determinable, departure time
- Alert logic: if aircraft departs from home base (typically Ahmedabad for Adani, Mumbai for Reliance) to Delhi or Mumbai on a weekday with no prior scheduled pattern → amber alert "Unscheduled flight detected: Adani Group aircraft departed AMD → DEL"
- Manual add: user can add any ICAO24 hex code with a custom label
- Flight history log: last 30 flights per aircraft, date, route, duration
- Widget size: 3 wide × 2 tall

---

## Widget 7 — Global Fear Composite

### What it does
Aggregates six global risk indicators into a single composite score from 0 (extreme fear) to 100 (extreme greed/risk-on). One glance replaces six Bloomberg screens.

### Data sources
```
India VIX: NSE API → https://www.nseindia.com/api/allIndices
CBOE VIX: Yahoo Finance → https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX
Gold price: https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF
US 2Y-10Y spread: FRED API (free) → https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10Y2Y
Bitcoin 24h change: CoinGecko free API → https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true
USD/INR: https://query1.finance.yahoo.com/v8/finance/chart/INR%3DX
Polling interval: 5 minutes
```

### Composite score calculation
```typescript
function computeFearIndex(inputs: FearInputs): number {
  // Each component normalised 0-100 (0=max fear, 100=max greed)
  const components = {
    indiaVIX: normalise(inputs.indiaVIX, 10, 40, true),       // invert: high VIX = fear
    cboeVIX: normalise(inputs.cboeVIX, 10, 40, true),
    yieldCurve: normalise(inputs.yieldSpread, -1, 2, false),   // inverted curve = fear
    btcMomentum: normalise(inputs.btcChange24h, -10, 10, false),
    goldRatio: normalise(inputs.goldChange7d, -3, 3, true),    // gold rising = fear
    usdInr: normalise(inputs.usdInrChange, -1, 1, true)        // INR weakening = fear
  }
  return Object.values(components).reduce((a, b) => a + b) / 6
}
```

### UI spec
- Large semicircular gauge (SVG, no library needed) — red zone 0-30, amber 30-60, green 60-100
- Needle points to current composite score, animates smoothly on update
- Score label in centre: large number + label ("Extreme Fear" / "Fear" / "Neutral" / "Greed" / "Extreme Greed")
- Below gauge: six component rows, each showing its normalised contribution as a mini bar + raw value
- 7-day sparkline of composite score below components
- Widget size: 2 wide × 3 tall

---

## Widget 8 — Quiet Accumulation Screener

### What it does
Screens the entire NSE universe every morning for stocks showing institutional accumulation before a breakout — flat price, high delivery, elevated block deal activity, no news. Surfaces the top 10 setups each morning.

### Data sources
```
NSE equity quote batch: https://www.nseindia.com/api/equity-stockIndices?index=SECURITIES%20IN%20F%26O
Delivery data: https://www.nseindia.com/api/deliveryData (per symbol, poll at open)
Block/bulk deals: Widget 2 data feed (shared store)
News check: cross-reference Widget 4 filing feed (no filings in 5 days = quiet)
Run at: 9:25am IST daily (10 minutes after open)
```

### Screening criteria
```typescript
interface AccumulationSetup {
  symbol: string
  score: number  // 0-100 composite score
  reasons: string[]
}

function screenForAccumulation(universe: Stock[]): AccumulationSetup[] {
  return universe
    .filter(stock => {
      const priceFlat = Math.abs(stock.change5d) < 2          // price flat ±2% over 5 days
      const highDelivery = stock.deliveryPct > 62             // delivery above 62%
      const volumeElevated = stock.avgVolume5d > stock.avgVolume20d * 1.3  // volume 30% above norm
      const noNews = stock.filingCount5d === 0                // no exchange filings
      const notNearResistance = stock.distFromHigh52w > 5     // not already at 52w high
      return priceFlat && highDelivery && volumeElevated && noNews && notNearResistance
    })
    .map(stock => ({
      symbol: stock.symbol,
      score: computeSetupScore(stock),
      reasons: buildReasonList(stock)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}
```

### UI spec
- Runs automatically at 9:25am, shows results for the day
- "Refresh scan" button to re-run manually
- Top 10 results as cards ranked by score
- Each card: symbol, sector, composite score as a ring gauge, and 3-4 bullet reasons ("Delivery 71% vs 42% avg", "Volume 2.1× norm", "No filings in 8 days")
- Mini 5-day price sparkline on each card
- One-click "Add to watchlist" and "Open chart" from each card
- Morning brief mode: at 9:25am auto-pops this widget to front of workspace
- Widget size: 3 wide × 4 tall

---

## Widget 9 — AI Morning Brief

### What it does
At 9:00am every trading day, generates a personalised pre-market brief covering the user's watchlist, overnight global moves, key levels, and what to watch. Delivered as a structured one-page brief inside the widget.

### Trigger
```typescript
// Schedule at 9:00am IST daily
// Gather context then call Anthropic API
async function generateMorningBrief(context: BriefContext): Promise<string> {
  const prompt = `You are a senior equity trader preparing a pre-market brief for yourself.
  
Today's date: ${context.date}
Day of week: ${context.dayOfWeek}

Your watchlist: ${context.watchlist.join(", ")}

Overnight data:
- SGX Nifty: ${context.sgxNifty} (${context.sgxNiftyChange})
- US markets close: Dow ${context.dowChange}, Nasdaq ${context.nasdaqChange}, S&P ${context.spChange}
- Dollar Index: ${context.dxy}
- Brent Crude: ${context.brent}
- Gold: ${context.gold}
- USD/INR: ${context.usdinr}

Yesterday's FII/DII: FII net ${context.fiiNet}cr, DII net ${context.diiNet}cr

Recent filings on watchlist (last 24h): ${context.recentFilings}

Write a professional pre-market brief with these sections:
1. Global tone (2 sentences max — risk-on or risk-off and why)
2. Nifty outlook (expected open, key levels to watch, bias)
3. Watchlist highlights (only mention symbols with something actionable — max 5)
4. One trade idea with entry, SL, and target (based on the data above)
5. Key events today (results, expiry, macro data)

Be direct. No fluff. Write like you're talking to yourself before the open bell.`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  })
  const data = await response.json()
  return data.content[0].text
}
```

### UI spec
- Clean document-style layout inside the widget — not chat bubbles, formatted like a morning note
- Sections with light dividers: Global Tone / Nifty Outlook / Watchlist / Trade Idea / Events
- Trade idea section has a distinct background — this is the actionable part
- Timestamp "Generated at 09:00:14 IST" in top right
- "Regenerate" button to refresh with latest data
- "Copy to clipboard" button for the whole brief
- Auto-opens as a modal overlay at 9:00am (user can disable in settings)
- Widget size: 3 wide × 4 tall

---

## Widget 10 — Natural Language Screener

### What it does
Lets the user type a plain English query and returns a screened list of stocks. Uses Anthropic API to parse the query into structured filter criteria, then applies them against the NSE universe.

### Architecture
```typescript
// Step 1: Parse natural language to filter spec
async function parseScreenerQuery(query: string): Promise<ScreenerFilters> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Convert this stock screener query into a JSON filter specification.

Available fields: price, change1d, change5d, change1m, volume, avgVolume20d, 
deliveryPct, marketCap, pe, pb, roe, sector, indexMembership, 
high52w, low52w, distFromHigh52w, distFromLow52w

Query: "${query}"

Respond only with JSON. Example output:
{
  "filters": [
    { "field": "deliveryPct", "operator": ">", "value": 60 },
    { "field": "change1d", "operator": ">", "value": 2 }
  ],
  "limit": 20,
  "sortBy": "deliveryPct",
  "sortDirection": "desc",
  "interpretation": "Stocks with delivery above 60% and up more than 2% today"
}`
      }]
    })
  })
  const data = await response.json()
  return JSON.parse(data.content[0].text)
}

// Step 2: Apply filters to universe
function applyFilters(universe: Stock[], filters: ScreenerFilters): Stock[] {
  return universe
    .filter(stock => filters.filters.every(f => evaluate(stock[f.field], f.operator, f.value)))
    .sort((a, b) => filters.sortDirection === "desc" 
      ? b[filters.sortBy] - a[filters.sortBy] 
      : a[filters.sortBy] - b[filters.sortBy])
    .slice(0, filters.limit)
}
```

### UI spec
- Search bar at top with placeholder: "delivery above 60% and up more than 2%..." 
- Show the AI's interpretation of the query in small text below the search bar before showing results
- Results as a compact table: symbol, sector, and the specific fields relevant to the query
- Query history: last 10 queries saved, click to re-run
- Save query as alert: "Run this scan every morning at 9:25am and notify me if results > 0"
- Suggested queries shown as pills when search bar is empty: "F&O stocks near 52w high", "High delivery small caps today", "Sector leaders with falling volumes"
- Widget size: 4 wide × 3 tall

---

## Non-functional requirements

```
Performance:
- Each widget renders its skeleton/loading state within 100ms
- No widget blocks another — all data fetching is isolated
- Failed API calls show cached data + stale indicator, never a broken widget

Rate limiting:
- NSE APIs are aggressive about rate limiting — implement exponential backoff
- Add jitter to polling intervals so 10 widgets don't all hit NSE at the same second
- Cache all responses in localStorage with TTL — stale data beats no data

Market hours awareness:
- All polling stops at 3:31pm IST
- Widgets show "Market closed" state with last session's final data
- Pre-market mode (8:00am–9:15am): show SGX, global markets, enable morning brief

Mobile responsiveness:
- Widgets stack vertically on screens below 768px
- Touch-friendly tap targets minimum 44px
- Swipe left on a widget card to dismiss / minimise

Keyboard shortcuts (global):
- Shift+B → Buy ticket for active symbol
- Shift+S → Sell ticket for active symbol  
- Shift+A → Add active symbol to watchlist
- / → Focus natural language screener
- Space → Open command palette (symbol search)
- Escape → Close any open panel or ticket
```

---

## Folder structure to create

```
src/
  widgets/
    fii-dii/
    block-deals/
    max-pain/
    filing-reader/
    port-monitor/
    jet-tracker/
    fear-index/
    accumulation-screener/
    morning-brief/
    nl-screener/
  store/
    globalStore.ts
    alertStore.ts
  hooks/
    useNSEData.ts
    useMarketHours.ts
    useAnthropicAPI.ts
  utils/
    normalise.ts
    formatCurrency.ts
    marketCalendar.ts
  layout/
    WidgetDock.tsx
    WidgetWrapper.tsx
```

---

## Start here

Build in this exact order:

1. Global store and WidgetDock layout first — nothing works without this
2. Widget 1 (FII/DII) — validates NSE API access and polling architecture
3. Widget 2 (Block Deals) — validates alert system and watchlist integration
4. Widget 7 (Fear Composite) — validates multi-source aggregation
5. Widget 3 (Max Pain) — validates options chain parsing
6. Widget 9 (Morning Brief) — validates Anthropic API integration
7. Widget 10 (NL Screener) — builds on Anthropic integration
8. Widget 4 (Filing Reader) — combines NSE feed + Anthropic classification
9. Widgets 5, 6, 8 — external APIs, build last