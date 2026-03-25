# Mock Data Usage — OpenTrader PoC

This document outlines all instances and sources of mock data within the OpenTrader Proof of Concept.

## 1. Market Data
- **Symbols**: 15 NSE symbols (HIFIF, RELIANCE, TCS, etc.) with static attributes (name, exchange, base open/close prices).
  - *File*: `src/mock/symbols.ts`
- **Live Prices**: Simulated "Random Walk" generator. Each price is updated every 1 second based on its last traded price with a ±0.1% volatility.
  - *Hook*: `useMockTicker` (Ref-counted singleton to shared intervals across widgets).
- **OHLCV Data**: 365 daily candles generated on-the-fly for any requested symbol.
  - *Hook*: `useMockOHLCV`
- **Movers**: Top 3 Gainers and Top 3 Losers filtered dynamically from the mock symbols list based on their simulated daily change.
  - *Hook*: `useMockMovers`

## 2. Analytics & News
- **News Feed**: 10 static news items from mixed sources (MarketWatch, Bloomberg, Reuters, etc.).
  - *Hook*: `useMockNews`
- **Trending Symbols**: Sorted top volume symbols from the static mock symbols list.
  - *Hook*: `useMockTrending`

## 3. Account & Fulfillment
- **Positions**: 2 static open positions (RELIANCE and HDFCBANK) with hardcoded average prices and calculated P&L based on simulated LTP.
  - *Hook*: `useMockPositions`
- **Orders**: 1 static "PENDING" order for TCS.
  - *Hook*: `useMockOrders`
- **Order Execution**: All "Buy" and "Sell" actions in the Order Entry modal are simulated via UI feedback only. No actual state change is persisted to a backend.
- **Funds/Margin**: Hardcoded `₹0.00` available funds. Margin calculations use a 5X leverage multiplier against the simulated LTP.

## 4. UI Layout
- **Initial State**: The docking system loads from `DEFAULT_LAYOUT` in `src/constants/layouts.ts` unless a user has previously called "Save Layout" (persisted to Browser LocalStorage).
- **Widget Registry**: All widgets are registered with static configurations (icon, category, default name) in `src/widgets/registry.ts`.
