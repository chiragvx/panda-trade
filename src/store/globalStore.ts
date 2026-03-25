import { create } from 'zustand';
import { Position, Alert } from '../types';

interface GlobalState {
  activeSymbol: string;
  watchlist: string[];
  positions: Position[];
  workspace: "intraday" | "research" | "fno";
  setActiveSymbol: (symbol: string) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setWorkspace: (workspace: "intraday" | "research" | "fno") => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  activeSymbol: "HDFCBANK",
  watchlist: ["HDFCBANK", "RELIANCE", "INFY", "TCS"],
  positions: [],
  workspace: "intraday",
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
  setWorkspace: (workspace) => set({ workspace }),
}));
