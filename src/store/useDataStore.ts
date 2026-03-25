import { create } from 'zustand';
import { InstrumentData, Order, Position, Holding } from '../types';

interface DataState {
  // Market Data
  prices: Record<string, number>; // instrument_key -> ltp
  symbols: Record<string, InstrumentData>; // instrument_key -> data
  
  // Account Data
  funds: { margin_used: number; available_margin: number } | null;
  positions: Position[];
  orders: Order[];
  holdings: Holding[];

  // Actions
  setPrice: (key: string, price: number) => void;
  setPrices: (prices: Record<string, number>) => void;
  setSymbol: (key: string, data: InstrumentData) => void;
  setAccountData: (data: { funds?: any; positions?: Position[]; orders?: Order[]; holdings?: Holding[] }) => void;
  reset: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  prices: {},
  symbols: {},
  funds: null,
  positions: [],
  orders: [],
  holdings: [],

  setPrice: (key, price) => set((state) => ({
    prices: { ...state.prices, [key]: price }
  })),

  setPrices: (newPrices) => set((state) => ({
    prices: { ...state.prices, ...newPrices }
  })),

  setSymbol: (key, data) => set((state) => ({
    symbols: { ...state.symbols, [key]: data }
  })),

  setAccountData: (data) => set((state) => ({
    funds: data.funds !== undefined ? data.funds : state.funds,
    positions: data.positions !== undefined ? data.positions : state.positions,
    orders: data.orders !== undefined ? data.orders : state.orders,
    holdings: data.holdings !== undefined ? data.holdings : state.holdings,
  })),

  reset: () => set({
    prices: {},
    symbols: {},
    funds: null,
    positions: [],
    orders: [],
    holdings: [],
  }),
}));
