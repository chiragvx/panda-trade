**# OpenTrader Pro POC Feedback: Brutal 20+ Year Bloomberg + IBKR Veteran Review**

**Date:** 25 March 2026  
**Reviewer:** Senior Prop Trader (ex-Bloomberg Terminal daily user since 2005, IBKR TWS power user, 7-figure daily volume across cash, F&O, commodities)  
**Format requested:** Markdown PRD-style prompt for your dev/product team.  
**Tone:** No sugar-coating. This is a POC, so I’m treating it like a raw Bloomberg prototype I would kill or fund.

---

### 1. Overall Verdict (1-sentence summary)
**This is a pretty dashboard pretending to be a professional trading terminal.**  
It has the visual polish of a fintech marketing site but the information density and workflow efficiency of a 2018 retail broker app. Bloomberg users will laugh and close it in <30 seconds. IBKR TWS users will be frustrated within 2 minutes.

**Score out of 10:**  
- Bloomberg parity: **3.8/10**  
- IBKR parity: **4.5/10**  
- Retail trader appeal: **7.2/10**  
- Current state readiness for live trading: **Do NOT ship**

---

### 2. Critical UI/UX Failures (the brutal part)

**2.1 Screen real-estate crime**  
- First screenshot is 70% pure black void with giant “BROKER DISCONNECTED” placeholders. In Bloomberg I have 6 monitors with 40+ windows live. Here I have three giant empty tiles. Unacceptable.  
- Every panel should have a **compact mode / dense mode / collapse** toggle. Right now it feels like a Figma mockup, not a terminal.

**2.2 Visual hierarchy is non-existent**  
- NIFTY header is tiny and buried. In any pro terminal the index level + % change + absolute points should dominate the top 80px like a war room.  
- Red/green coloring is okay but **zero contrast differentiation** between +0.44% (Nifty) and +14% movers in watchlist. My eyes bleed trying to scan.  
- Font weights and sizing are amateur. Bloomberg uses clear hierarchy (bold for LTP, semi-bold for change, light for delivery %).

**2.3 “Ecosystem” tab is a joke**  
- Satellite Port Activity (JNPT/Mundra) is a cool alternative-data flex… but why is it in the main dashboard when **broker is disconnected** and I can’t even see my P&L?  
- FII/DII tracker, Block Deal feed, Correlation Matrix — all amazing ideas, but they are fighting for space in a disconnected state. Prioritize **execution > intelligence**.

**2.4 Charting is 2015-level**  
- Candles look like TradingView free tier.  
- No volume profile, no order-flow footprint, no cumulative delta, no heatmap.  
- Time axis showing “2026” on live charts is embarrassing (mock data bug — fix immediately).  
- No multi-chart layout (1/2/4/6/8 charts). Bloomberg and even IBKR let me tile 8 symbols instantly.

**2.5 Tab structure is broken**  
- INTRADAY / RESEARCH / F&O / ECOSYSTEM feels like four different apps glued together.  
- I want **one unified workspace** with draggable, savable layouts (Bloomberg-style “Views” or IBKR “Layouts”).  
- Current tab system forces me to lose context when switching.

---

### 3. Missing Pro Features (Bloomberg/IBKR parity gaps)

| Feature | Status | Priority | Bloomberg Equivalent |
|---------|--------|----------|----------------------|
| Command-line / Quick command bar | Missing | **MUST HAVE** | `HIFIF <GO>` or `HIFIF GP` |
| Saved workspaces / multi-monitor profiles | Missing | **MUST HAVE** | Bloomberg “Views” |
| Native multi-broker support (Upstox + Zerodha + IBKR + Alice Blue) | Upstox-only | Critical | IBKR + any prime broker |
| Advanced option chain (Greeks live, IV skew, OI heatmap) | Partial | High | Bloomberg OVME |
| Level 2 + full DOM with heat map | Partial | High | IBKR Mosaic DOM |
| One-click algo orders (VWAP, TWAP, Iceberg, POV) | Missing | High | IBKR algos |
| Custom hotkeys (global) | Missing | High | Bloomberg + IBKR |
| Natural Language Screener that actually works | Partial (“TYPE_QUERY…”) | Medium | Bloomberg <EQUITY> <GO> + NL |
| Portfolio P&L attribution live (by sector, by strategy) | Missing | High | Bloomberg PORT |
| Options Greek risk matrix (delta/gamma/vega exposure) | Missing | High | Bloomberg OV |

---

### 4. Specific Screen-by-Screen PRD Prompts

**4.1 Main Dashboard (Ecosystem view)**
> Redesign as **“Mission Control”**. Default to 4×4 grid of resizable, draggable widgets. Every widget must have: (1) Compact/Dense toggle, (2) Refresh rate indicator, (3) “Pin to top” option. Remove all “BROKER DISCONNECTED” giant messages — replace with subtle red banner at top only. Satellite Port Activity and Correlation Matrix should be optional modules users can remove.

**4.2 Research + Intraday tabs**
> Merge into single **“Market Monitor”** workspace. Left sidebar = watchlist (draggable columns, custom fields, color coding by % delivery / FII flow). Center = multi-chart container (default 2 charts side-by-side). Right panel = context-aware (News / Option Chain / Depth / Positions). Add “Clone Chart” button.

**4.3 F&O tab**
> This is your strongest screen. Make it the default landing page for power users. Add:
> - OI change % column in option chain (color coded)
> - IV percentile rank
> - Max Pain line on chart
> - Put/Call ratio sparkline at top

**4.4 Terminal Control / Upstox Bridge**
> Hide this in Settings → “Broker Integration”. Add support for **multiple simultaneous brokers** with color-coded status (green = live, amber = delayed, red = disconnected). API key fields should support 1-click “Test Connection” with latency shown.

---

### 5. Non-Negotiable Technical & UX Requirements

1. **Dark theme only** — but **true black** (#000000) with proper contrast ratios (WCAG AA).
2. **Global hotkeys** must work even when not focused (like Bloomberg).
3. **Data latency** must show in every panel (e.g., “FII data 14s ago”).
4. **Mock data bug** — never ship charts with 2026 dates again.
5. **Performance** — 60 fps chart rendering minimum on 4K. No lag when scrolling 200-symbol watchlist.
6. **Export** — every table must have CSV + Excel + API endpoint.
7. **Mobile companion** — at minimum a read-only watchlist + price alerts (Bloomberg mobile is excellent; copy that).

---

### 6. Final Recommendation as PRD Prompt for Your Team

**Copy-paste this to your product manager:**

> “Build OpenTrader Pro v1.0 to be the **Bloomberg Terminal for Indian retail + HNI traders**.  
> Core philosophy: Information density > pretty UI.  
> Every screen must answer in <3 seconds: (1) Where is my P&L? (2) What is moving? (3) Where is my edge?  
> Kill all empty black panels. Make the dashboard feel alive even in disconnected state (show last known data + timestamp).  
> Target user: 20-year veteran who currently pays ₹15k/month for Bloomberg + ₹4k brokerage. We must make them cancel both.”

**Ship the command bar first.**  
Once I can type `HIFIF 1M <ENTER>` and get a clean chart + depth + news in one window, I will pay whatever you ask.

I’m happy to do a 30-minute Zoom screen-share and walk through a live Bloomberg vs your POC comparison if you want.

Let’s make this the first Indian terminal that actually feels pro.

— 20+ year trader who is rooting for you but will not lie.