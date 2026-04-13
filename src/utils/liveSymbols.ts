import { SymbolData } from '../types';
import type { InstrumentMeta } from '../store/useUpstoxStore';

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getTickerFromInstrumentKey = (instrumentKey: string): string => {
  if (!instrumentKey) return '';
  const [, rawTicker = instrumentKey] = instrumentKey.split('|');
  return rawTicker.trim().toUpperCase();
};

export const isIsin = (s: string): boolean => {
  if (!s) return false;
  const trimmed = s.trim().toUpperCase();
  if (trimmed.length !== 12) return false;
  return /^[A-Z]{2}[A-Z0-9]{10}$/.test(trimmed);
};

export const isNumericId = (s: string): boolean => {
  if (!s) return false;
  const trimmed = s.trim();
  return /^\d+$/.test(trimmed);
};

export const isUselessTicker = (s: string): boolean => {
  if (!s) return true;
  return isIsin(s) || isNumericId(s);
};

export const buildSymbolFromFeed = (
  instrumentKey: string,
  feed?: {
    ltp?: number;
    cp?: number;
    change?: number;
    pChange?: number;
    bid?: number;
    ask?: number;
    volume?: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  },
  meta?: InstrumentMeta
): SymbolData => {
  const ltp = toNumber(feed?.ltp);
  const cp = toNumber(feed?.cp);
  const fallbackChange = ltp - cp;
  const change = toNumber(feed?.change ?? fallbackChange);
  const fallbackPct = cp !== 0 ? (fallbackChange / cp) * 100 : 0;
  const changePct = toNumber(feed?.pChange ?? fallbackPct);
  const bid = toNumber(feed?.bid);
  const ask = toNumber(feed?.ask);
  const volume = toNumber(feed?.volume);
  
  const derivedTicker = getTickerFromInstrumentKey(instrumentKey);
  
  // Clean up ISIN tickers
  let ticker = String(meta?.ticker || derivedTicker).toUpperCase();
  let name = String(meta?.name || ticker).toUpperCase();

  if (isIsin(ticker) && name && !isIsin(name)) {
    // If ticker is ISIN but name is a proper name, use name as ticker 
    // or at least favor the name in UI (handled in components)
    // But here we can swap if they are the same or ticker is just an ID
  }

  const exchange: string = meta?.exchange || (instrumentKey.startsWith('BSE') ? 'BSE' : 'NSE');
  const close = cp || ltp;
  const open = toNumber(feed?.open, close);
  const high = toNumber(feed?.high, Math.max(open, ltp));
  const low = toNumber(feed?.low, Math.min(open, ltp));

  return {
    ticker,
    name,
    exchange,
    ltp,
    change,
    changePct,
    volume,
    open,
    high,
    low,
    close,
    bid,
    ask,
    instrument_key: instrumentKey,
  };
};
