# OpenTrader × Upstox API — Integration Guide

> **Audience:** Non-developers building or configuring an open-source trading platform.
> **Goal:** Connect Upstox API to OpenTrader so any user can paste credentials and start trading.
> **Last updated against:** Upstox Developer API docs, March 2026.

---

## Table of Contents

1. [What the Upstox API Can Do](#1-what-the-upstox-api-can-do)
2. [Hard Limits & Real-World Constraints](#2-hard-limits--real-world-constraints)
3. [Honest Gaps & Limitations](#3-honest-gaps--limitations-called-out)
4. [Authentication — The Daily Login Problem](#4-authentication--the-daily-login-problem)
5. [The "Simple Connect" Flow for OpenTrader](#5-the-simple-connect-flow-for-opentrader)
6. [API Module Map](#6-api-module-map)
7. [Historical Data Rules](#7-historical-data-rules)
8. [Real-Time Data via WebSocket](#8-real-time-data-via-websocket)
9. [Order Placement Cheatsheet](#9-order-placement-cheatsheet)
10. [Sandbox — Test Before You Trade](#10-sandbox--test-before-you-trade)
11. [What to Build in the UI (Non-Developer Checklist)](#11-what-to-build-in-the-ui-non-developer-checklist)
12. [Recommended Implementation Sequence](#12-recommended-implementation-sequence)

---

## 1. What the Upstox API Can Do

The Upstox Developer API is a free, REST-based API available to any Upstox account holder. It covers everything a terminal-style trading platform needs:

| Category | What's Available |
|---|---|
| Authentication | OAuth 2.0 login, access tokens, extended read-only tokens |
| Live Market Data | Real-time quotes, order book, market depth (via WebSocket) |
| Historical Data | OHLC candles from 1-minute to monthly, back to year 2000 |
| Orders | Place, modify, cancel — single and multi-order batch |
| GTT Orders | Good-Till-Triggered orders (stop-loss, target, bracket) |
| Portfolio | Positions, holdings, P&L |
| Margins | Available margin before placing orders |
| Charges | Brokerage and statutory charge calculator |
| Option Chain | Full option chain with Greeks |
| Market Info | Exchange status, holidays, top gainers/losers |

**SDKs available:** Python, Node.js, Java (official). This matters because OpenTrader contributors can use them instead of writing raw HTTP calls.

---

## 2. Hard Limits & Real-World Constraints

These are enforced by Upstox. Exceeding them causes temporary API suspension.

### Rate Limits (per user, per API)

| API Type | Per Second | Per Minute | Per 30 Minutes |
|---|---|---|---|
| Standard APIs (orders, quotes, portfolio) | 50 requests | 500 requests | 2,000 requests |
| Multi-Order APIs (batch place/cancel/exit) | 4 requests | 40 requests | 160 requests |

**Plain-English impact:**
- At 50 req/sec, polling 10 stocks every second is fine. Polling 100 stocks every second starts to strain limits.
- For algo/strategy users placing many orders rapidly, the 4 req/sec multi-order cap is the real constraint — you cannot fire batches faster than this.
- **Mitigation:** Use WebSocket for live prices (it does not count against REST rate limits). Only use REST for snapshots, order placement, and portfolio reads.

### Token Lifetime

| Token Type | Validity | Use Case |
|---|---|---|
| Standard Access Token | Trading day only (resets daily) | All trading operations |
| Extended Token | 1 year (or until user revokes) | Read-only: positions, holdings, order book, order history |

**Impact:** The platform must handle daily re-authentication. This is the single biggest friction point for non-developer users. See Section 4.

### Sandbox Limits

- Only **one** sandbox app allowed per Upstox account.
- Sandbox access tokens are valid for **30 days** (much better than live).
- Sandbox only covers order APIs (place, modify, cancel). Market data and portfolio APIs in sandbox are still being rolled out — check docs for updates.

### Historical Data Fetch Windows

| Interval | Max Fetch Window Per Request |
|---|---|
| 1–15 minutes | 1 month |
| 16–300 minutes (e.g. 30-min, 1-hour) | 1 quarter (3 months) |
| Hours (1–5 hour bars) | 1 quarter |
| Daily | 1 decade (10 years) |
| Weekly / Monthly | No limit |

**Impact:** To backfill a full year of 1-minute data, the platform must make 12 sequential requests (one per month). This needs to be handled automatically in the background — a non-developer should not have to do this manually.

**Earliest data available:**
- Minute/Hour data: January 2022
- Daily/Weekly/Monthly: January 2000

---

## 3. Honest Gaps & Limitations Called Out

These are real-world constraints that directly affect what OpenTrader can and cannot offer users.

### ❌ No Direct Multi-User Support on a Single API Key

Each Upstox API key is tied to one Upstox account. If OpenTrader has 10 users, each user must register their own Upstox Developer App and provide their own API key and secret. There is no "master key" approach for individual accounts.

> **If you want to support multiple users under one app:** You would need Upstox's **Business API (Uplink)** which is a separate product, not the free Developer API. This is for brokers/platforms, not individual users.

### ❌ Login Cannot Be Fully Automated Without a Redirect Server

The OAuth login flow requires a browser redirect back to a URL you control. For a local desktop app, this means the platform must run a small local web server (e.g., on `localhost:3000`) to catch the redirect and extract the auth code automatically.

If the platform does not handle this, users must paste the auth code manually every morning — which is doable but friction-heavy. See Section 4 for both options.

### ❌ No Tick-by-Tick Raw Feed

The WebSocket market feed provides snapshots — full quote updates for subscribed instruments. It does not provide a true tick-by-tick trade-by-trade feed (each individual trade as it happens). For most retail traders this is fine, but HFT or precise volume analysis needs this distinction.

### ❌ Intraday Historical Data Only from 2022

For minute/hour charts, you can only go back to January 2022. Daily and weekly charts go back to 2000. If a user wants to run a strategy that requires 5+ years of intraday backtesting, the platform will need to store data locally over time as it accumulates.

### ❌ CDSL TPIN Requirement for Delivery Sales

If a user is selling stocks from their delivery (long-term) holdings and has not set up a DDPI/POA with Upstox, they must complete a CDSL TPIN + OTP verification step for each sell transaction. This flow happens on Upstox's website — the API cannot bypass it. The platform should clearly warn users about this.

### ⚠️ Webhook Needs a Public URL

Order update webhooks (which push order fill confirmations to your app) require an internet-accessible POST endpoint — not a local machine. For desktop users without a server, the WebSocket portfolio stream is the practical alternative.

### ⚠️ Deprecated Fields in Responses

Some order response fields (e.g., `tradingsymbol` lowercase) are deprecated and will be removed in future versions. The platform should always use the `snake_case` versions (`trading_symbol`) in the code to avoid breaking changes.

### ⚠️ Sandbox is Partial, Not Full

As of the current docs, only order APIs (place, modify, cancel) have sandbox support. Market quote APIs, portfolio APIs, and historical data in sandbox are still being added. Plan for this during testing — you'll need live tokens for anything outside orders.

---

## 4. Authentication — The Daily Login Problem

This is the most important UX problem to solve for non-developer users.

### How It Works (Plain English)

Every morning (or when the token expires), the user must log into Upstox via a browser. After login, Upstox sends back a short code. The platform exchanges this code for an access token. All API calls that day use this token.

### Three Options for the Platform to Implement

**Option A — Manual Token Paste (simplest, most friction)**

1. User goes to `account.upstox.com/developer/apps`
2. Clicks "Generate" on their app
3. Copies the token
4. Pastes it into the OpenTrader settings panel

No code complexity. But users must do this every day. Suitable for occasional users.

**Option B — One-Click Browser Login (recommended for most users)**

1. User clicks "Connect Upstox" in OpenTrader
2. Platform opens the Upstox login URL in browser
3. After login, Upstox redirects to `http://localhost:PORT/callback?code=XXXXX`
4. Platform's local server catches the redirect, extracts the code, exchanges it for a token automatically
5. User is logged in

This requires the platform to run a small local HTTP listener on startup. Libraries like Python's `http.server` or Node's built-in `http` module handle this in ~20 lines.

**Option C — Semi-Automated with Mobile Approval**

Upstox supports a pre-approved token flow where the system sends an auth request, and the user approves via a mobile notification. The token is then delivered to a configured "notifier URL". This is ideal for scheduled/overnight strategies but still requires a server to receive the token.

### Token Storage

The access token must be stored locally (e.g., in a config file or encrypted local database) and loaded at startup. The platform should check if a token exists and is valid before every session, and prompt re-login if not.

---

## 5. The "Simple Connect" Flow for OpenTrader

This is what the connection experience should look like for any user:

```
[First-Time Setup — Once Only]
  1. User creates Upstox account (if not done)
  2. User goes to account.upstox.com/developer/apps
  3. User creates a new app → gets API Key + API Secret
  4. User opens OpenTrader Settings → "Connect Broker"
  5. User pastes API Key and API Secret → clicks Save

[Daily Login — Every Trading Day]
  1. User opens OpenTrader
  2. Platform detects no valid token → shows "Login to Upstox" button
  3. User clicks → browser opens Upstox login
  4. User logs in (mobile OTP or TOTP)
  5. Token is captured automatically → platform shows "Connected ✓"
  6. User trades
```

The platform should display:
- Connection status (connected / expired / disconnected)
- Token expiry warning (e.g., "Session expires at market close")
- One-click re-login button in the header

---

## 6. API Module Map

How each Upstox API section maps to OpenTrader features:

| Upstox API Section | OpenTrader Feature | Method | Endpoint Pattern |
|---|---|---|---|
| Login / Auth | Connect dialog, token management | POST | `/v2/login/authorization/token` |
| User | Profile display, fund balance | GET | `/v2/user/get-funds-and-margin` |
| Market Quote | Watchlist price display | GET | `/v2/market-quote/quotes` |
| WebSocket — Market Feed | Live price streaming | WSS | Market data feed URL |
| WebSocket — Portfolio | Live order fill updates | WSS | Portfolio stream feed URL |
| Historical Candle V3 | Charts (all timeframes) | GET | `/v3/historical-candle/{key}/{unit}/{interval}/...` |
| Intraday Candle V3 | Today's chart, current session | GET | `/v3/historical-candle/intraday/{key}/{interval}` |
| Orders — Place V3 | Buy/Sell order form | POST | `/v3/order/place` |
| Orders — Modify V3 | Edit pending order | PUT | `/v3/order/modify` |
| Orders — Cancel V3 | Cancel pending order | DELETE | `/v3/order/cancel` |
| Orders — Place Multi | Batch order entry | POST | `/v2/order/multi/place` |
| Orders — Get Order Book | Open orders panel | GET | `/v2/order/retrieve-all` |
| Orders — Get Trades | Executed trades list | GET | `/v2/order/trades/get-trades-for-day` |
| GTT Orders | Stop-loss / target triggers | POST/GET | `/v2/gtt/orders` |
| Portfolio — Positions | Intraday position tracker | GET | `/v2/portfolio/short-term-positions` |
| Portfolio — Holdings | Long-term holdings | GET | `/v2/portfolio/long-term-holdings` |
| Margins | Pre-order margin check | GET | `/v2/charges/margin` |
| Charges | Brokerage calculator | POST | `/v2/charges/brokerage` |
| Option Chain | Options screener | GET | `/v2/option/chain` |
| Market Information | Exchange status, holidays | GET | `/v2/market/market-info/...` |
| Webhook | Push order updates | POST (receive) | Your configured URL |

---

## 7. Historical Data Rules

The chart engine must handle these constraints automatically — users should never have to think about them.

### Available Intervals (API V3)

| Unit | Valid Intervals | Notes |
|---|---|---|
| `minutes` | 1 to 300 | e.g., 1, 2, 3, 5, 10, 15, 30, 60... |
| `hours` | 1 to 5 | Hourly through 5-hour bars |
| `days` | 1 | Daily candles |
| `weeks` | 1 | Weekly candles |
| `months` | 1 | Monthly candles |

### Fetch Window Rules (must be enforced in code)

For 1-minute data: fetch in 1-month chunks, loop until target date range is filled.
For 30-minute/1-hour data: fetch in 3-month chunks.
For daily data: fetch up to 10 years per request.

### Date Format

Always `YYYY-MM-DD`. The `to_date` parameter is required. `from_date` is optional.

### Sample Request (1-minute bars, single day)

```
GET https://api.upstox.com/v3/historical-candle/NSE_EQ|INE848E01016/minutes/1/2025-01-02/2025-01-01
Authorization: Bearer {access_token}
```

### Response Format (OHLCV array)

```json
{
  "data": {
    "candles": [
      ["2025-01-01T09:15:00+05:30", 52.1, 52.8, 51.9, 52.4, 124500, 0]
    ]
  }
}
```

Index positions: `[0] timestamp, [1] open, [2] high, [3] low, [4] close, [5] volume, [6] open interest`

---

## 8. Real-Time Data via WebSocket

WebSocket is the right way to get live prices — not polling the REST quote API in a loop. It bypasses rate limits and gives near-instant updates.

### Two Feeds

| Feed | Purpose | Authorized URL Endpoint |
|---|---|---|
| Market Data Feed V3 | Live OHLC, LTP, bid/ask, depth | `GET /v3/feed/market-data-feed/authorize` |
| Portfolio Stream Feed | Live order updates, position changes | `GET /v2/feed/portfolio-stream-feed/authorize` |

### How It Works

1. Call the authorize endpoint → get a short-lived WebSocket URL
2. Connect to that URL via WebSocket
3. Send a subscription message specifying which instrument keys to watch
4. Receive streamed updates as protobuf (binary) messages

**Important:** Market data uses protobuf (binary encoding), not JSON. The platform must decode it. Upstox provides decoding examples in their SDK — use those rather than building a decoder from scratch.

### Reconnection

WebSocket connections drop. The platform must implement automatic reconnection with exponential backoff, and re-subscribe to instruments on reconnect. This is essential for reliability during a trading session.

---

## 9. Order Placement Cheatsheet

### Place Order (V3) — Key Parameters

| Parameter | Required | Notes |
|---|---|---|
| `instrument_key` | Yes | e.g., `NSE_EQ\|INE848E01016` — pipe-separated exchange and token |
| `transaction_type` | Yes | `BUY` or `SELL` |
| `order_type` | Yes | `MARKET`, `LIMIT`, `SL`, `SL-M` |
| `product` | Yes | `I` (Intraday/MIS), `D` (Delivery/CNC), `CO`, `OCO` |
| `quantity` | Yes | Number of shares/lots |
| `price` | For LIMIT/SL | Price per share |
| `trigger_price` | For SL/SL-M | Stop-loss trigger price |
| `validity` | Yes | `DAY` or `IOC` (immediate or cancel) |
| `is_amo` | No | `true` for After Market Orders |
| `tag` | No | Custom string to label/track orders |

### Order Types in Plain English

- **MARKET** — Execute immediately at current price. No price field needed.
- **LIMIT** — Execute only at your specified price or better.
- **SL (Stop-Limit)** — Triggers at `trigger_price`, then places a limit order at `price`.
- **SL-M (Stop-Market)** — Triggers at `trigger_price`, then places a market order.

### GTT Orders (Good Till Triggered)

GTT orders persist across sessions — they don't expire at end of day. They can be set up as:
- **Single trigger** — one price level (e.g., stop-loss only)
- **OCO (One Cancels Other)** — two levels (stop-loss + target; when one hits, other cancels)

GTT orders are placed via `/v2/gtt/orders` and are fully manageable (create, modify, cancel, list).

---

## 10. Sandbox — Test Before You Trade

Every user should test in the sandbox before connecting their live account. Make this the default first experience in OpenTrader.

### Setup Steps

1. Go to `account.upstox.com/developer/apps#sandbox`
2. Click "New Sandbox App" — fill in any redirect URL (not functional yet)
3. Click "Generate" on the sandbox app → copy the 30-day token
4. In OpenTrader: toggle to "Sandbox Mode" → paste token

### What You Can Test in Sandbox

- Place order ✅
- Modify order ✅
- Cancel order ✅
- Place multi-order ✅

### What Is NOT Available in Sandbox

- Live market data (WebSocket) ❌
- Historical candle data ❌
- Real portfolio / holdings ❌
- Margins / charges ❌

For anything outside order APIs, the platform will need to use live tokens even during development. Use paper (virtual) quantities and immediately cancel to avoid accidental execution.

---

## 11. What to Build in the UI (Non-Developer Checklist)

This is what needs to exist in the OpenTrader interface for users to operate without ever reading API docs:

### Settings / Credentials Panel

- [ ] API Key field (masked after saving)
- [ ] API Secret field (always masked)
- [ ] "Connect" button → triggers OAuth login flow
- [ ] Connection status badge: `Connected ✓ | Expired | Disconnected`
- [ ] "Sandbox Mode" toggle (uses sandbox token instead of live login)
- [ ] Manual token paste fallback (for advanced users)
- [ ] "Disconnect" / clear credentials option

### Daily Session Banner

- [ ] Auto-detect expired token on app start
- [ ] "Your session has expired — click to reconnect" prompt
- [ ] One-click re-login (opens browser, captures token automatically)

### Watchlist / Market Data

- [ ] Instrument search by name or ticker (fetches instrument key automatically)
- [ ] Live price display via WebSocket (LTP, change, % change)
- [ ] Candlestick chart with timeframe selector (1m, 5m, 15m, 1h, 1d, 1w)
- [ ] Chart auto-handles data windowing (user never picks dates)

### Order Entry Form

- [ ] Buy/Sell toggle
- [ ] Instrument pre-filled from selected watchlist item
- [ ] Order type selector (Market / Limit / SL / SL-M)
- [ ] Product type selector (Intraday / Delivery)
- [ ] Quantity field
- [ ] Price field (shown/hidden based on order type)
- [ ] Trigger price field (shown only for SL / SL-M)
- [ ] Estimated margin display (fetched from margin API before confirmation)
- [ ] Confirmation dialog showing all details before submission
- [ ] "After Market Order" checkbox

### Positions & Portfolio

- [ ] Live positions table (intraday) — auto-refreshed or WebSocket-driven
- [ ] Holdings table (delivery) — refreshed on session start
- [ ] P&L display (unrealised and realised)
- [ ] "Exit All Positions" button (with confirmation)

### Order Book / Trade Log

- [ ] Open orders list with Modify / Cancel actions
- [ ] Completed trades for the day
- [ ] Order status updates in real-time (WebSocket portfolio feed)

### GTT Orders

- [ ] Create GTT (single trigger or OCO bracket)
- [ ] List active GTT orders
- [ ] Modify / cancel GTT orders

### Error Handling (Visible to User)

- [ ] Token expired → "Session expired. Reconnect."
- [ ] Rate limit hit → "Too many requests. Please wait a moment."
- [ ] Insufficient margin → "Insufficient funds for this order."
- [ ] Market closed → "Market is currently closed. You can place AMO orders."
- [ ] CDSL TPIN warning for delivery sells → "Delivery sell requires TPIN verification on Upstox."

---

## 12. Recommended Implementation Sequence

For a contributor building this from scratch, tackle in this order:

1. **Credential storage** — securely store API key/secret locally
2. **OAuth login flow** — local redirect server, token capture, token save
3. **Token validity check** — detect expired token on startup, prompt re-login
4. **Sandbox mode** — let users test without live risk from day one
5. **Instrument search** — fetch and search the instrument master file (CSV published by Upstox daily)
6. **REST market quote** — basic price fetch to confirm connection works
7. **WebSocket market feed** — live price streaming for watchlist
8. **Historical candle fetch** — chart data with auto-chunking for windowed intervals
9. **Order placement** — market and limit orders only first, then SL types
10. **Order book and portfolio** — read current positions, holdings, open orders
11. **WebSocket portfolio feed** — live order fill notifications
12. **GTT orders** — stop-loss and bracket order management
13. **Margins and charges** — pre-trade margin check and brokerage calculator
14. **Multi-order / batch** — only after single-order flow is stable

---

## Reference Links

| Resource | URL |
|---|---|
| API Documentation Home | https://upstox.com/developer/api-documentation/open-api |
| Developer Apps (create/manage) | https://account.upstox.com/developer/apps |
| Authentication Docs | https://upstox.com/developer/api-documentation/authentication |
| Rate Limits | https://upstox.com/developer/api-documentation/rate-limiting |
| Sandbox Guide | https://upstox.com/developer/api-documentation/sandbox |
| WebSocket Docs | https://upstox.com/developer/api-documentation/websocket |
| Orders API | https://upstox.com/developer/api-documentation/orders |
| GTT Orders | https://upstox.com/developer/api-documentation/gtt-orders |
| Historical Data V3 | https://upstox.com/developer/api-documentation/historical-data |
| Community Forum | https://community.upstox.com/c/developer-api |
| Python SDK | https://upstox.com/developer/api-documentation/sdk |

---

*This document is based on the Upstox Developer API documentation as of March 2026. API behaviour, limits, and available sandbox features may change — always verify against the official docs before implementation.*