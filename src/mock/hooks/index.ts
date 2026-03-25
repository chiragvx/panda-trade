import { useState, useEffect, useRef, useMemo } from 'react';
import { MOCK_SYMBOLS } from '../symbols';
import { SymbolData, OHLCV, Order, Position } from '../../types';

// Ref-counted singleton ticker
const tickers: Record<string, { price: number; count: number; interval: any }> = {};
const listeners: Record<string, Set<(price: number) => void>> = {};

export function useMockTicker(symbolTicker: string) {
  const [price, setPrice] = useState<number>(() => {
    const s = MOCK_SYMBOLS.find(s => s.ticker === symbolTicker);
    return s ? s.ltp : 0;
  });

  useEffect(() => {
    if (!tickers[symbolTicker]) {
      const s = MOCK_SYMBOLS.find(s => s.ticker === symbolTicker);
      tickers[symbolTicker] = {
        price: s ? s.ltp : 0,
        count: 1,
        interval: setInterval(() => {
          const change = (Math.random() - 0.5) * (tickers[symbolTicker].price * 0.001);
          tickers[symbolTicker].price = parseFloat((tickers[symbolTicker].price + change).toFixed(2));
          listeners[symbolTicker]?.forEach(cb => cb(tickers[symbolTicker].price));
        }, 1000)
      };
      listeners[symbolTicker] = new Set();
    } else {
      tickers[symbolTicker].count++;
    }

    const callback = (newPrice: number) => setPrice(newPrice);
    listeners[symbolTicker].add(callback);

    return () => {
      listeners[symbolTicker].delete(callback);
      tickers[symbolTicker].count--;
      if (tickers[symbolTicker].count <= 0) {
        clearInterval(tickers[symbolTicker].interval);
        delete tickers[symbolTicker];
        delete listeners[symbolTicker];
      }
    };
  }, [symbolTicker]);

  return price;
}

export function useMockSymbols(): SymbolData[] {
  const commonKeys: Record<string, string> = {
    'RELIANCE': 'NSE_EQ|INE002A01018',
    'TATASTEEL': 'NSE_EQ|INE848E01016',
    'HDFCBANK': 'NSE_EQ|INE040A01034',
    'INFY': 'NSE_EQ|INE009A01021',
    'TCS': 'NSE_EQ|INE467B01029',
    'SBIN': 'NSE_EQ|INE062A01020',
  };

  return useMemo(() => MOCK_SYMBOLS.map(s => ({
    ...s,
    instrument_key: commonKeys[s.ticker],
    bid: s.ltp * 0.9995,
    ask: s.ltp * 1.0005,
    deliveryPct: 10 + Math.random() * 80,
    low52w: s.ltp * 0.7,
    high52w: s.ltp * 1.3,
    circuitLimit: s.ltp * 1.2,
    oiChangePct: (Math.random() - 0.5) * 15,
    lotSize: s.ticker.includes('NIFTY') ? 50 : 1,
    expiry: '25 APR 24',
    iv: 12 + Math.random() * 20,
  })), []);
}

export function useMockOHLCV(symbolTicker: string) {
  const [data, setData] = useState<OHLCV[]>([]);

  useEffect(() => {
    const s = MOCK_SYMBOLS.find(s => s.ticker === symbolTicker);
    let price = s ? s.ltp : 1000;
    // Mock date fix: shift 2 years back from "2026" to 2024 to avoid user confusion
    const now = new Date();
    now.setFullYear(now.getFullYear() - 2);
    const bars: OHLCV[] = [];
    
    for (let i = 0; i < 365; i++) {
        const time = new Date(now.getTime() - (365 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const open = price + (Math.random() - 0.5) * (price * 0.05);
        const close = open + (Math.random() - 0.5) * (price * 0.05);
        const high = Math.max(open, close) + Math.random() * (price * 0.02);
        const low = Math.min(open, close) - Math.random() * (price * 0.02);
        
        bars.push({ time, open, high, low, close, volume: Math.random() * 10000000 });
        price = close;
    }
    setData(bars);
  }, [symbolTicker]);

  return data;
}

export function useMockNews() {
  return [
    { id: 1, title: "Federal Reserve hints at interest rate pause", source: "MarketWatch", time: "10m ago" },
    { id: 2, title: "Nifty hits all-time high amid global rally", source: "ET Now", time: "45m ago" },
    { id: 3, title: "Reliance Industries to report Q4 earnings tomorrow", source: "CNBC TV18", time: "2h ago" },
    { id: 4, title: "Steel stocks surge on infra spending boom", source: "MoneyControl", time: "4h ago" },
    { id: 5, title: "Crypto markets see $100M liquidations", source: "Reuters", time: "6h ago" },
    { id: 6, title: "Tesla recalls 1.2M vehicles over software glitch", source: "Bloomberg", time: "8h ago" },
    { id: 7, title: "Oil prices steady near $85/barrel", source: "OPEC+", time: "12h ago" },
    { id: 8, title: "Apple Vision Pro sales exceed expectations", source: "WSJ", time: "1d ago" },
    { id: 9, title: "HDFC Bank merger synergies starting to play out", source: "Mint", time: "1d ago" },
    { id: 10, title: "Indian GDP forecast upgraded to 7.2%", source: "IMF", time: "2d ago" },
  ];
}

export function useMockPositions(): Position[] {
    return [
        { symbol: 'RELIANCE', exchange: 'NSE', quantity: 10, avgPrice: 2850, ltp: 2945, pnl: 950, pnlPct: 3.33 },
        { symbol: 'HDFCBANK', exchange: 'NSE', quantity: 50, avgPrice: 1620, ltp: 1642.50, pnl: 1125, pnlPct: 1.39 },
    ];
}

export function useMockOrders(): Order[] {
    return [
        { id: '1', symbol: 'TCS', exchange: 'NSE', side: 'BUY', orderType: 'LIMIT', quantity: 5, price: 3850, status: 'PENDING', timestamp: Date.now(), productType: 'TRADING' },
    ];
}

export function useMockMovers() {
    return {
        gainers: MOCK_SYMBOLS.filter(s => s.changePct > 1).sort((a, b) => b.changePct - a.changePct),
        losers: MOCK_SYMBOLS.filter(s => s.changePct < -1).sort((a, b) => a.changePct - b.changePct),
    };
}

export function useMockTrending() {
    return MOCK_SYMBOLS.sort((a, b) => b.volume - a.volume).slice(0, 5);
}

export function useMockHoldings() {
    return [
        { symbol: 'RELIANCE', exchange: 'NSE', quantity: 25, avgCost: 2450.75, ltp: 2945.10, marketValue: 73627.50, pnl: 12358.75, pnlPct: 20.17 },
        { symbol: 'HDFCBANK', exchange: 'NSE', quantity: 100, avgCost: 1580.20, ltp: 1642.50, marketValue: 164250.00, pnl: 6230.00, pnlPct: 3.94 },
        { symbol: 'INFY', exchange: 'NSE', quantity: 40, avgCost: 1420.00, ltp: 1395.40, marketValue: 55816.00, pnl: -984.00, pnlPct: -1.73 },
        { symbol: 'TCS', exchange: 'NSE', quantity: 15, avgCost: 3650.00, ltp: 3842.15, marketValue: 57632.25, pnl: 2882.25, pnlPct: 5.26 },
        { symbol: 'SBIN', exchange: 'NSE', quantity: 200, avgCost: 580.00, ltp: 742.30, marketValue: 148460.00, pnl: 32460.00, pnlPct: 27.98 },
    ];
}
