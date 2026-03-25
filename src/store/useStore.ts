import { create } from 'zustand';
import { SymbolData } from '../types';
import { MOCK_SYMBOLS } from '../mock/symbols';

interface SelectionStore {
  selectedSymbol: SymbolData | null;
  setSelectedSymbol: (symbol: SymbolData) => void;
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedSymbol: null, // Start null, will be populated on first selection
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
}));

interface LayoutStore {
  pinnedTabsets: Record<string, boolean>;
  activeTabsetId: string | null;
  workspace: 'EXECUTION' | 'ANALYSIS' | 'DERIVATIVES' | 'API';
  isOrderModalOpen: boolean;
  orderMode: 'BUY' | 'SELL';
  setWorkspace: (ws: 'EXECUTION' | 'ANALYSIS' | 'DERIVATIVES' | 'API') => void;
  togglePin: (tabsetId: string) => void;
  setActiveTabsetId: (id: string | null) => void;
  openOrderModal: (mode: 'BUY' | 'SELL') => void;
  closeOrderModal: () => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  pinnedTabsets: {},
  activeTabsetId: null,
  workspace: 'EXECUTION',
  setWorkspace: (ws) => set({ workspace: ws }),
  togglePin: (tabsetId) => set((state) => ({
    pinnedTabsets: {
      ...state.pinnedTabsets,
      [tabsetId]: !state.pinnedTabsets[tabsetId]
    }
  })),
  setActiveTabsetId: (id) => set({ activeTabsetId: id }),
  isOrderModalOpen: false,
  orderMode: 'BUY',
  openOrderModal: (mode) => set({ isOrderModalOpen: true, orderMode: mode }),
  closeOrderModal: () => set({ isOrderModalOpen: false }),
}));

import { persist } from 'zustand/middleware';

interface WatchlistStore {
  visibleColumns: string[];
  activeTab: 'ALL' | 'F&O';
  instrumentKeys: string[];
  setColumns: (cols: string[]) => void;
  toggleColumn: (col: string) => void;
  setActiveTab: (tab: 'ALL' | 'F&O') => void;
  addKey: (key: string) => void;
  removeKey: (key: string) => void;
  setKeys: (keys: string[]) => void;
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set) => ({
      visibleColumns: ['SYMBOL', 'LTP', 'CHG', '%CHG', 'BID', 'ASK', 'VOLUME', 'DELIVERY%'],
      activeTab: 'ALL',
      instrumentKeys: ['NSE_EQ|INE002A01018', 'NSE_EQ|INE467B01029', 'NSE_EQ|INE040A01034'], // Reliance, TCS, HDFC as defaults
      setColumns: (cols) => set({ visibleColumns: cols }),
      toggleColumn: (col) => set((state) => ({
        visibleColumns: state.visibleColumns.includes(col)
          ? state.visibleColumns.filter(c => c !== col)
          : [...state.visibleColumns, col]
      })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      addKey: (key) => set((state) => ({
        instrumentKeys: state.instrumentKeys.includes(key) ? state.instrumentKeys : [...state.instrumentKeys, key]
      })),
      removeKey: (key) => set((state) => ({
        instrumentKeys: state.instrumentKeys.filter(k => k !== key)
      })),
      setKeys: (keys) => set({ instrumentKeys: keys }),
    }),
    { name: 'watchlist-storage' }
  )
);
