import { create } from 'zustand';
import { SymbolData } from '../types';

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
  isOrderModalOpen: boolean;
  orderMode: 'BUY' | 'SELL';
  editingOrder: any | null;
  viewingOrder: any | null;
  viewingHolding: any | null;
  togglePin: (tabsetId: string) => void;
  setActiveTabsetId: (id: string | null) => void;
  openOrderModal: (mode: 'BUY' | 'SELL') => void;
  openModifyModal: (order: any) => void;
  openOrderDetails: (order: any) => void;
  openHoldingDetails: (holding: any) => void;
  closeOrderModal: () => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  pinnedTabsets: {},
  activeTabsetId: null,
  togglePin: (tabsetId) => set((state) => ({
    pinnedTabsets: {
      ...state.pinnedTabsets,
      [tabsetId]: !state.pinnedTabsets[tabsetId]
    }
  })),
  setActiveTabsetId: (id) => set({ activeTabsetId: id }),
  isOrderModalOpen: false,
  orderMode: 'BUY',
  editingOrder: null,
  viewingOrder: null,
  viewingHolding: null,
  openOrderModal: (mode) => set({ isOrderModalOpen: true, orderMode: mode, editingOrder: null, viewingOrder: null, viewingHolding: null }),
  openModifyModal: (order) => set({ isOrderModalOpen: true, orderMode: order.side, editingOrder: order, viewingOrder: null, viewingHolding: null }),
  openOrderDetails: (order) => set({ isOrderModalOpen: true, viewingOrder: order, editingOrder: null, viewingHolding: null }),
  openHoldingDetails: (holding) => set({ isOrderModalOpen: true, viewingHolding: holding, editingOrder: null, viewingOrder: null }),
  closeOrderModal: () => set({ isOrderModalOpen: false, editingOrder: null, viewingOrder: null, viewingHolding: null }),
}));

import { persist } from 'zustand/middleware';

export interface Watchlist {
  id: string;
  name: string;
  keys: string[];
}

interface WatchlistStore {
  watchlists: Watchlist[];
  activeWatchlistId: string;
  visibleColumns: string[];
  
  // Actions
  setActiveWatchlist: (id: string) => void;
  createWatchlist: (name: string) => void;
  deleteWatchlist: (id: string) => void;
  renameWatchlist: (id: string, name: string) => void;
  addKeyToActive: (key: string) => void;
  removeKeyFromActive: (key: string) => void;
  toggleColumn: (col: string) => void;
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set) => ({
      watchlists: [
        {
          id: 'default',
          name: 'Watchlist 1',
          keys: [
            'NSE_INDEX|Nifty 50',
            'NSE_INDEX|Nifty Bank',
            'NSE_INDEX|Nifty Fin Service',
            'NSE_INDEX|India VIX',
            'BSE_INDEX|SENSEX',
          ],
        }
      ],
      activeWatchlistId: 'default',
      visibleColumns: ['SYMBOL', 'LTP', 'CHG', '%CHG', 'BID', 'ASK', 'VOLUME', 'DELIVERY%'],

      setActiveWatchlist: (id) => set({ activeWatchlistId: id }),
      createWatchlist: (name) => set((state) => ({
        watchlists: [...state.watchlists, { id: Date.now().toString(), name, keys: [] }]
      })),
      deleteWatchlist: (id) => set((state) => ({
        watchlists: state.watchlists.filter(w => w.id !== id),
        activeWatchlistId: state.activeWatchlistId === id ? (state.watchlists[0]?.id || '') : state.activeWatchlistId
      })),
      renameWatchlist: (id, name) => set((state) => ({
        watchlists: state.watchlists.map(w => w.id === id ? { ...w, name } : w)
      })),
      addKeyToActive: (key) => set((state) => ({
        watchlists: state.watchlists.map(w =>
          w.id === state.activeWatchlistId
            ? { ...w, keys: w.keys.includes(key) ? w.keys : [...w.keys, key] }
            : w
        )
      })),
      removeKeyFromActive: (key) => set((state) => ({
        watchlists: state.watchlists.map(w =>
          w.id === state.activeWatchlistId
            ? { ...w, keys: w.keys.filter(k => k !== key) }
            : w
        )
      })),
      toggleColumn: (col) => set((state) => ({
        visibleColumns: state.visibleColumns.includes(col)
          ? state.visibleColumns.filter(c => c !== col)
          : [...state.visibleColumns, col]
      })),
    }),
    { name: 'watchlist-storage-v2' }
  )
);
