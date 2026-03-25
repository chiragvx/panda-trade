import React from 'react';
import { Search, Plus, Filter, MoreHorizontal, Settings, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMarketStore, useUIStore } from '../../store/useStore';
import { SymbolData } from '../../types';

export const WatchlistPanel: React.FC = () => {
  const { symbols, selectedSymbol, setSelectedSymbol } = useMarketStore();
  const { openOrderModal } = useUIStore();

  const formatVolume = (vol: number) => {
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)}Cr`;
    if (vol >= 100000) return `${(vol / 100000).toFixed(2)}L`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(2)}K`;
    return vol;
  };

  const WatchlistRow: React.FC<{ symbol: SymbolData }> = ({ symbol }) => {
    const isSelected = selectedSymbol?.ticker === symbol.ticker;
    const isPositive = symbol.change >= 0;

    return (
      <div 
        onClick={() => setSelectedSymbol(symbol)}
        className={`group flex items-center h-10 px-3 cursor-pointer transition-colors border-b border-border/10 ${
          isSelected ? 'bg-bg-row-hover ring-1 ring-inset ring-accent-teal/30' : 'hover:bg-bg-row-hover/50'
        }`}
      >
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-text-primary truncate uppercase">{symbol.ticker}</span>
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-bg-elevated border border-border/50 text-text-muted">
              {symbol.exchange}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-3/4">
          <div className="flex-1 text-right">
            <div className="text-xs font-mono text-text-primary">
              {symbol.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`w-20 text-right text-[11px] font-mono leading-none ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
            <div>{isPositive ? '+' : ''}{symbol.change.toFixed(2)}</div>
            <div className="opacity-80">({symbol.changePct.toFixed(2)}%)</div>
          </div>
          <div className="w-16 text-right text-[10px] text-text-muted font-mono hidden sm:block">
            {formatVolume(symbol.volume)}
          </div>
        </div>

        {/* Quick action overlay */}
        <div className="hidden group-hover:flex items-center space-x-1 bg-gradient-to-l from-bg-row-hover via-bg-row-hover to-transparent pl-4">
          <button 
            onClick={(e) => { e.stopPropagation(); openOrderModal('BUY'); }}
            className="w-7 h-7 flex items-center justify-center bg-accent-green text-bg-primary rounded-md font-bold text-[10px]"
          >
            B
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); openOrderModal('SELL'); }}
            className="w-7 h-7 flex items-center justify-center bg-accent-red text-bg-primary rounded-md font-bold text-[10px]"
          >
            S
          </button>
          <button className="w-7 h-7 flex items-center justify-center bg-bg-elevated text-text-secondary rounded-md">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary w-[320px] border-r border-border shrink-0 select-none">
      {/* Search Header */}
      <div className="p-3 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 flex items-center space-x-2 bg-bg-elevated border border-border/50 rounded-md px-2 h-7">
            <Search size={14} className="text-text-muted" />
            <input 
              type="text" 
              placeholder="Search e.g. INFOSYS, NIFTY FUT" 
              className="bg-transparent border-none outline-none text-[11px] w-full placeholder:text-text-muted"
            />
          </div>
          <button className="p-1 px-1.5 bg-bg-elevated border border-border/50 rounded-md text-accent-teal">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-bg-elevated text-[10px] font-medium border border-border/50 cursor-pointer text-text-secondary hover:text-text-primary transition-colors">
              <span>Dividend Yield</span>
              <Filter size={10} />
            </div>
          </div>
          <div className="flex items-center space-x-2 text-text-muted">
            <Settings size={14} className="cursor-pointer hover:text-text-primary" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {symbols.map(s => <WatchlistRow key={s.ticker} symbol={s} />)}
      </div>

      {/* Watchlist Footer Summary */}
      <div className="p-3 bg-bg-primary/30 border-t border-border/10 grid grid-cols-2 gap-3 text-[10px]">
        <div className="flex flex-col space-y-1">
          <span className="text-text-muted">Daily Total Vol</span>
          <span className="text-text-primary font-mono">₹ 142.12Cr</span>
        </div>
        <div className="flex flex-col space-y-1 text-right">
          <span className="text-text-muted">Filtered Gainers</span>
          <span className="text-accent-green font-mono">12 / 20</span>
        </div>
      </div>
    </div>
  );
};
