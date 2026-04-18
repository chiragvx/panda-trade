import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveInstrumentText } from '../utils/liveSymbols';

export interface DepthLevel {
  price: number;
  quantity: number;
  orders: number;
}

export interface LivePriceData {
  ltp: number;
  cp: number;
  change: number;
  pChange: number;
  ts: number;
  bid?: number;
  ask?: number;
  bidQty?: number;
  askQty?: number;
  volume?: number;
  oi?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  depth?: {
    buy: DepthLevel[];
    sell: DepthLevel[];
  };
}

export interface InstrumentMeta {
  ticker: string;
  name: string;
  exchange: string;
}

const inferExchange = (value: unknown): string => {
  const upper = String(value || '').toUpperCase();
  if (upper.includes('BSE')) return 'BSE';
  if (upper.includes('NSE')) return 'NSE';
  if (upper.includes('MCX')) return 'MCX';
  if (upper.includes('NFO')) return 'NFO';
  if (upper.includes('CDS')) return 'CDS';
  return 'NSE';
};

const buildInstrumentMetaMap = (rows: any[]): Record<string, InstrumentMeta> => {
  const out: Record<string, InstrumentMeta> = {};

  rows.forEach((row) => {
    const instrumentKey = String(row?.instrument_token || row?.instrument_key || '').trim();
    if (!instrumentKey) return;

    const { ticker, name } = resolveInstrumentText({
      instrumentKey,
      candidates: [
        row?.trading_symbol,
        row?.tradingsymbol,
        row?.symbol,
        row?.short_name,
        row?.name,
        row?.company_name,
        row?.description,
      ],
    });

    if (!ticker) return;

    out[instrumentKey] = {
      ticker,
      name: name || ticker,
      exchange: inferExchange(row?.exchange || instrumentKey),
    };
  });

  return out;
};

interface UpstoxState {
  apiKey: string;
  apiSecret: string;
  accessToken: string | null;
  expiryTime: number | null;
  status: 'connected' | 'disconnected' | 'expired';
  isSandbox: boolean;
  prices: Record<string, LivePriceData>;
  instrumentMeta: Record<string, InstrumentMeta>;
  funds: any | null;
  positions: any[];
  orders: any[];
  holdings: any[];
  lastAccountSyncTs: number | null;

  setCredentials: (apiKey: string, apiSecret: string) => void;
  setToken: (token: string, expiresIn: number) => void;
  setPrices: (newPrices: Record<string, LivePriceData>) => void;
  setInstrumentMeta: (meta: Record<string, InstrumentMeta>) => void;
  setAccountData: (data: { funds?: any | null; positions?: any[]; orders?: any[]; holdings?: any[] }) => void;
  clearRuntimeData: () => void;
  logout: () => void;
  toggleSandbox: (val: boolean) => void;
  checkTokenValidity: () => void;
}

export const useUpstoxStore = create<UpstoxState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      apiSecret: '',
      accessToken: null,
      expiryTime: null,
      status: 'disconnected',
      isSandbox: false,
      prices: {},
      instrumentMeta: {},
      funds: null,
      positions: [],
      orders: [],
      holdings: [],
      lastAccountSyncTs: null,

      setCredentials: (apiKey, apiSecret) => set({ apiKey, apiSecret }),
      
      setToken: (accessToken, expiresIn) => {
        const expiryTime = Date.now() + expiresIn * 1000;
        set({ accessToken, expiryTime, status: 'connected' });
      },

      setPrices: (newPrices) => set((state) => ({ 
        prices: { ...state.prices, ...newPrices } 
      })),

      setInstrumentMeta: (meta) => set((state) => ({
        instrumentMeta: {
          ...state.instrumentMeta,
          ...meta,
        },
      })),

      setAccountData: (data) =>
        set((state) => {
          const nextPositions = data.positions !== undefined ? data.positions : state.positions;
          const nextOrders = data.orders !== undefined ? data.orders : state.orders;
          const nextHoldings = data.holdings !== undefined ? data.holdings : state.holdings;

          const discoveredMeta = buildInstrumentMetaMap([
            ...nextPositions,
            ...nextOrders,
            ...nextHoldings,
          ]);

          return {
            funds: data.funds !== undefined ? data.funds : state.funds,
            positions: nextPositions,
            orders: nextOrders,
            holdings: nextHoldings,
            instrumentMeta: {
              ...state.instrumentMeta,
              ...discoveredMeta,
            },
            lastAccountSyncTs: Date.now(),
          };
        }),

      clearRuntimeData: () =>
        set({
          prices: {},
          instrumentMeta: {},
          funds: null,
          positions: [],
          orders: [],
          holdings: [],
          lastAccountSyncTs: null,
        }),

      logout: () =>
        set({
          accessToken: null,
          expiryTime: null,
          status: 'disconnected',
          prices: {},
          instrumentMeta: {},
          funds: null,
          positions: [],
          orders: [],
          holdings: [],
          lastAccountSyncTs: null,
        }),

      toggleSandbox: (isSandbox) => set({ isSandbox }),

      checkTokenValidity: () => {
        const { accessToken, expiryTime } = get();
        if (!accessToken) {
          set({
            status: 'disconnected',
            prices: {},
            instrumentMeta: {},
            funds: null,
            positions: [],
            orders: [],
            holdings: [],
            lastAccountSyncTs: null,
          });
          return;
        }
        if (expiryTime && Date.now() > expiryTime) {
          set({
            status: 'expired',
            prices: {},
            instrumentMeta: {},
            funds: null,
            positions: [],
            orders: [],
            holdings: [],
            lastAccountSyncTs: null,
          });
        } else {
          set({ status: 'connected' });
        }
      },
    }),
    {
      name: 'upstox-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        apiSecret: state.apiSecret,
        accessToken: state.accessToken,
        expiryTime: state.expiryTime,
        isSandbox: state.isSandbox,
        instrumentMeta: state.instrumentMeta,
      }),
    }
  )
);
