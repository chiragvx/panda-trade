import { create } from 'zustand';
import { SymbolData } from '../types';
import { MOCK_SYMBOLS } from '../mock/symbols';

interface SelectionStore {
  selectedSymbol: SymbolData | null;
  setSelectedSymbol: (symbol: SymbolData) => void;
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedSymbol: MOCK_SYMBOLS[0],
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
}));

interface LayoutStore {
  pinnedTabsets: Record<string, boolean>;
  activeTabsetId: string | null;
  workspace: 'INTRADAY' | 'RESEARCH' | 'F&O' | 'ECOSYSTEM';
  isOrderModalOpen: boolean;
  orderMode: 'BUY' | 'SELL';
  setWorkspace: (ws: 'INTRADAY' | 'RESEARCH' | 'F&O' | 'ECOSYSTEM') => void;
  togglePin: (tabsetId: string) => void;
  setActiveTabsetId: (id: string | null) => void;
  openOrderModal: (mode: 'BUY' | 'SELL') => void;
  closeOrderModal: () => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  pinnedTabsets: {},
  activeTabsetId: null,
  workspace: 'INTRADAY',
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

interface WatchlistStore {
  visibleColumns: string[];
  activeTab: 'ALL' | 'F&O';
  setColumns: (cols: string[]) => void;
  toggleColumn: (col: string) => void;
  setActiveTab: (tab: 'ALL' | 'F&O') => void;
}

export const useWatchlistStore = create<WatchlistStore>((set) => ({
  visibleColumns: ['SYMBOL', 'LTP', 'CHG', '%CHG', 'DELIVERY%'],
  activeTab: 'ALL',
  setColumns: (cols) => set({ visibleColumns: cols }),
  toggleColumn: (col) => set((state) => ({
    visibleColumns: state.visibleColumns.includes(col)
      ? state.visibleColumns.filter(c => c !== col)
      : [...state.visibleColumns, col]
  })),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
