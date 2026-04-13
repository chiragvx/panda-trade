import { create } from 'zustand';
import { Position, Alert } from '../types';

interface GlobalState {
  activeSymbol: string;
  watchlist: string[];
  positions: Position[];
  setActiveSymbol: (symbol: string) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  activeSymbol: "",
  watchlist: [],
  positions: [],
  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  addToWatchlist: (symbol) => 
    set((state) => ({ 
      watchlist: state.watchlist.includes(symbol) 
        ? state.watchlist 
        : [...state.watchlist, symbol] 
    })),
  removeFromWatchlist: (symbol) => 
    set((state) => ({ 
      watchlist: state.watchlist.filter((s) => s !== symbol) 
    })),
}));
