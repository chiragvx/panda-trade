import { upstoxApi } from './upstoxApi';
import { InstrumentMeta } from '../store/useUpstoxStore';

export type UpstoxSearchResult = {
  instrumentKey: string;
  ticker: string;
  name: string;
  exchange: string;
};

const inferExchange = (value: unknown, instrumentKey?: string): string => {
  const upper = String(value || '').toUpperCase();
  if (upper.includes('BSE')) return 'BSE';
  if (upper.includes('NSE')) return 'NSE';
  if (upper.includes('MCX')) return 'MCX';
  if (upper.includes('NFO')) return 'NFO';
  if (upper.includes('CDS')) return 'CDS';
  if (upper.includes('BCD')) return 'BCD';
  
  // Fallback to instrument key prefix
  const prefix = String(instrumentKey || '').split('|')[0] || '';
  if (prefix) return prefix.split('_')[0] || prefix;

  return 'NSE';
};

const normalizeRows = (rows: any[]): UpstoxSearchResult[] => {
  const out: UpstoxSearchResult[] = [];
  const seen = new Set<string>();

  rows.forEach((row) => {
    const instrumentKey = String(row?.instrument_key || row?.instrument_token || '').trim();
    if (!instrumentKey || seen.has(instrumentKey)) return;

    const ticker = String(
      row?.trading_symbol ||
      row?.symbol ||
      row?.short_name ||
      ''
    )
      .trim()
      .toUpperCase();

    if (!ticker) return;

    const name = String(
      row?.name ||
      row?.description ||
      row?.company_name ||
      ticker
    )
      .trim()
      .toUpperCase();

    out.push({
      instrumentKey,
      ticker,
      name: name || ticker,
      exchange: inferExchange(row?.exchange || row?.segment || instrumentKey, instrumentKey),
    });

    seen.add(instrumentKey);
  });

  return out;
};

const searchCache = new Map<string, UpstoxSearchResult[]>();

export const upstoxSearch = {
  resolveSymbolToKey: (symbol: string, exchange: string = 'NSE_EQ'): string => {
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) return '';
    if (trimmed.includes('|')) return trimmed;
    return `${exchange}|${trimmed}`;
  },

  searchSymbols: async (token: string, query: string, limit = 10): Promise<UpstoxSearchResult[]> => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return [];
    if (trimmed.length < 2) return [];

    // Check local cache
    const cached = searchCache.get(trimmed);
    if (cached) return cached.slice(0, Math.max(1, limit));

    try {
      const response = await upstoxApi.searchInstruments(token, trimmed);
      const rows = Array.isArray(response?.data) ? response.data : [];
      const normalized = normalizeRows(rows);
      
      // Store in cache
      searchCache.set(trimmed, normalized);
      
      return normalized.slice(0, Math.max(1, limit));
    } catch (error) {
      console.error('Symbol search failed:', error);
      return [];
    }
  },

  // Helper to fetch and index common NSE instruments once
  preFetchInstruments: async (store: any) => {
    try {
      // For now we just search for standard NIFTY 50 or common names on demand
      // but we could call upstoxApi.getInstruments('NSE_EQ') here.
      // However, it's often better to just use the search API with good debouncing.
    } catch (e) {
      console.error('Pre-fetch failed:', e);
    }
  }
};
