import React from 'react';
import { useSelectionStore, useWatchlistStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';

export const WatchlistPanel: React.FC = () => {
  const { watchlists, activeWatchlistId } = useWatchlistStore();
  const { prices, instrumentMeta } = useUpstoxStore();
  const { selectedSymbol, setSelectedSymbol } = useSelectionStore();

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId) || watchlists[0];
  const symbols = (activeWatchlist?.keys || []).map((key) => buildSymbolFromFeed(key, prices[key], instrumentMeta[key]));

  return (
    <div className="flex flex-col h-full bg-bg-secondary w-[320px] border-r border-border shrink-0 select-none">
      <div className="p-3 border-b border-border/10">
        <div className="text-[10px] uppercase text-text-muted font-bold tracking-[0.2em]">Watchlist</div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {symbols.length === 0 ? (
          <div className="p-4 text-[11px] text-text-muted">No live symbols available.</div>
        ) : (
          symbols.map((symbol) => {
            const isSelected = selectedSymbol?.ticker === symbol.ticker;
            return (
              <button
                key={symbol.instrument_key || symbol.ticker}
                onClick={() => setSelectedSymbol(symbol)}
                className={`w-full text-left px-3 py-2 border-b border-border/10 text-[11px] ${isSelected ? 'bg-bg-row-hover text-text-primary' : 'text-text-secondary hover:bg-bg-row-hover/50'}`}
              >
                <div className="font-bold uppercase">{symbol.ticker}</div>
                <div className="font-mono text-[10px]">{symbol.ltp.toFixed(2)}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
