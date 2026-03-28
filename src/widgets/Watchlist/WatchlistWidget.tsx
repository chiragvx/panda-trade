import React, { useState, useEffect, useRef, useMemo } from 'react';
import { isIsin } from '../../utils/liveSymbols';
import { useSelectionStore, useLayoutStore, useWatchlistStore, Watchlist } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useContextMenuStore } from '../../store/useContextMenuStore';
import { SymbolData } from '../../types';
import { COLOR, TYPE, ROW_HEIGHT, BORDER, SPACE } from '../../ds/tokens';
import { Badge } from '../../ds/components/Badge';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { upstoxSearch, UpstoxSearchResult } from '../../services/upstoxSearch';
import { useToastStore } from '../../components/ToastContainer';
import { Trash2, Search, Plus, Filter, LayoutGrid, List, MoreVertical, X, ChevronUp, ChevronDown, BarChart3, ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react';

export function usePriceFlash(price: number) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPrice = useRef(price);
  useEffect(() => {
    if (price > prevPrice.current) setFlash('up');
    else if (price < prevPrice.current) setFlash('down');
    prevPrice.current = price;
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [price]);
  return flash;
}

const COLUMN_WIDTHS: Record<string, number> = {
  SYMBOL: 140,
  LTP: 90,
  CHG: 80,
  '%CHG': 80,
  BID: 80,
  ASK: 80,
  VOLUME: 90,
  'DELIVERY%': 80,
  '52W RANGE': 100,
};

const WatchlistRow: React.FC<{
  symbol: SymbolData;
  visibleColumns: string[];
  isSelected: boolean;
  onClick: () => void;
}> = ({ symbol, visibleColumns, isSelected, onClick }) => {
  const { openOrderModal } = useLayoutStore();
  const { setSelectedSymbol } = useSelectionStore();
  const { removeKeyFromActive } = useWatchlistStore();
  const { openContextMenu } = useContextMenuStore();
  const { prices } = useUpstoxStore();
  const [hovered, setHovered] = useState(false);

  const livePrice = symbol.instrument_key ? prices[symbol.instrument_key]?.ltp : undefined;
  const price = livePrice !== undefined && livePrice !== null ? Number(livePrice) : Number(symbol.ltp || 0);
  const flash = usePriceFlash(price);
  const isIndex = symbol.instrument_key?.includes('_INDEX') || symbol.instrument_key?.includes('VIX');

  const tickerIsIsin = isIsin(symbol.ticker);
  const displayTicker = tickerIsIsin ? (symbol.name || 'INSTRUMENT') : (symbol.ticker || '--');

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedSymbol(symbol);
    
    const options = [
      { 
        label: 'BUY ' + displayTicker, 
        icon: <ArrowUpCircle size={14} />, 
        variant: 'info' as const,
        onClick: () => { openOrderModal('BUY'); } 
      },
      { 
        label: 'SELL ' + displayTicker, 
        icon: <ArrowDownCircle size={14} />, 
        variant: 'danger' as const,
        onClick: () => { openOrderModal('SELL'); } 
      },
      { 
        label: 'OPEN ON CHART', 
        icon: <BarChart3 size={14} />, 
        variant: 'muted' as const,
        onClick: () => { /* Chart updates automatically via setSelectedSymbol */ } 
      },
      { 
        label: 'VIEW FUNDAMENTALS', 
        icon: <Info size={14} />, 
        variant: 'muted' as const,
        onClick: () => { 
            setSelectedSymbol(symbol); 
            if ((window as any).replaceTab) (window as any).replaceTab('fundamentals');
        } 
      }
    ];

    // Filter out trading options for indexes/VIX
    const filteredOptions = isIndex ? options.filter(o => o.label.includes('CHART')) : options;

    openContextMenu(e.clientX, e.clientY, filteredOptions);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={handleRightClick}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: ROW_HEIGHT.compact,
        borderBottom: `1px solid #111111`,
        cursor: 'default',
        position: 'relative',
        background: isSelected ? '#1a110a' : hovered ? '#080808' : 'transparent',
        borderLeft: isSelected ? `2px solid #FF7722` : '2px solid transparent',
        userSelect: 'none',
        transition: 'background 0.05s linear',
      }}
    >
      {visibleColumns.map((col) => {
        const width = COLUMN_WIDTHS[col] || 80;
        const baseStyle: React.CSSProperties = {
          width,
          minWidth: width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: col === 'SYMBOL' ? 'flex-start' : 'flex-end',
          padding: '0 12px',
          height: '100%',
          flex: 'none',
          borderRight: '1px solid #111111',
        };

        switch (col) {
          case 'SYMBOL':
            return (
              <div 
                key={col} 
                style={{ 
                    ...baseStyle, 
                    position: 'sticky', 
                    left: 0, 
                    zIndex: 10, 
                    background: isSelected ? '#1a110a' : hovered ? '#080808' : '#000000'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                            fontFamily: TYPE.family.mono, 
                            fontSize: '12px', 
                            fontWeight: '900', 
                            color: '#FFFFFF',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                        {displayTicker}
                        </span>
                        <Badge label={symbol.exchange} variant={symbol.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
                    </div>
                </div>
              </div>
            );
          case 'LTP':
            return (
              <div key={col} style={baseStyle}>
                <Price value={price} currency="" size="md" flash={flash} weight="black" />
              </div>
            );
          case 'CHG':
            return (
              <div key={col} style={baseStyle}>
                <Change value={symbol.change || 0} format="absolute" size="xs" weight="bold" />
              </div>
            );
          case '%CHG':
            return (
              <div key={col} style={baseStyle}>
                <Change value={symbol.changePct || 0} format="percent" size="sm" weight="bold" />
              </div>
            );
          case 'BID':
            return (
              <div key={col} style={baseStyle}>
                <Price value={symbol.bid || 0} size="xs" color={COLOR.text.secondary} weight="bold" />
              </div>
            );
          case 'ASK':
            return (
              <div key={col} style={baseStyle}>
                <Price value={symbol.ask || 0} size="xs" color={COLOR.text.secondary} weight="bold" />
              </div>
            );
          case 'VOLUME':
            return (
              <div key={col} style={baseStyle}>
                <span style={{ fontFamily: TYPE.family.mono, fontSize: '10px', color: COLOR.text.muted }}>
                  {((symbol.volume || 0) / 1000000).toFixed(2)}M
                </span>
              </div>
            );
          case 'DELIVERY%':
            return (
              <div key={col} style={baseStyle}>
                <span
                  style={{
                    fontFamily: TYPE.family.mono,
                    fontSize: '10px',
                    color: (symbol.deliveryPct || 0) > 60 ? COLOR.semantic.up : COLOR.text.muted,
                  }}
                >
                  {(symbol.deliveryPct || 0).toFixed(1)}%
                </span>
              </div>
            );
          default:
            return null;
        }
      })}

      <AnimatePresence>
        {hovered && (
            <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            style={{
                position: 'sticky',
                right: 0,
                top: 0,
                bottom: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0 8px',
                background: '#000000',
                borderLeft: `1px solid #333333`,
                zIndex: 20,
                marginLeft: 'auto', 
            }}
            >
            {!isIndex && (
                <>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedSymbol(symbol); if ((window as any).replaceTab) (window as any).replaceTab('fundamentals'); }} style={{ color: COLOR.text.muted, border: 'none', background: 'transparent' }}><Info size={16} /></Button>
                <div style={{ width: '1px', height: '12px', background: '#222', margin: '0 4px' }} />
                <Button variant="buy" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedSymbol(symbol); setTimeout(() => openOrderModal('BUY'), 0); }} style={{ background: COLOR.semantic.up, color: COLOR.text.inverse }}>BUY</Button>
                <Button variant="sell" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedSymbol(symbol); setTimeout(() => openOrderModal('SELL'), 0); }} style={{ background: COLOR.semantic.down, color: COLOR.text.inverse }}>SELL</Button>
                </>
            )}
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeKeyFromActive(symbol.instrument_key!); }} style={{ color: '#ff4444', border: 'none', background: 'transparent' }}><Trash2 size={16} /></Button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const WatchlistWidget: React.FC = () => {
  const { 
    watchlists, 
    activeWatchlistId, 
    visibleColumns, 
    setActiveWatchlist, 
    createWatchlist, 
    deleteWatchlist, 
    renameWatchlist,
    addKeyToActive,
    toggleColumn
  } = useWatchlistStore();

  const { accessToken, prices, instrumentMeta, setInstrumentMeta } = useUpstoxStore();
  const { selectedSymbol, setSelectedSymbol } = useSelectionStore();
  const { openOrderModal } = useLayoutStore();
  const { addToast } = useToastStore();

  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UpstoxSearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchDropdownIndex, setSearchDropdownIndex] = useState(0);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const activeWatchlist = useMemo(() => watchlists.find(w => w.id === activeWatchlistId) || watchlists[0], [watchlists, activeWatchlistId]);

  const symbols = useMemo(
    () => (activeWatchlist?.keys || []).map((key) => buildSymbolFromFeed(key, prices[key], instrumentMeta[key])),
    [activeWatchlist, prices, instrumentMeta]
  );

  const sortedAndFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = symbols.filter((s: SymbolData) => {
      if (!q) return true;
      return s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    });

    if (sortCol) {
      result = [...result].sort((a, b) => {
        let valA: any, valB: any;
        switch (sortCol) {
          case 'SYMBOL': valA = a.ticker; valB = b.ticker; break;
          case 'LTP': valA = a.ltp; valB = b.ltp; break;
          case 'CHG': valA = a.change; valB = b.change; break;
          case '%CHG': valA = a.changePct; valB = b.changePct; break;
          case 'VOLUME': valA = a.volume; valB = b.volume; break;
          case 'DELIVERY%': valA = a.deliveryPct; valB = b.deliveryPct; break;
          case 'BID': valA = a.bid; valB = b.bid; break;
          case 'ASK': valA = a.ask; valB = b.ask; break;
          default: valA = 0; valB = 0;
        }
        
        if (typeof valA === 'string') {
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDir === 'asc' ? Number(valA || 0) - Number(valB || 0) : Number(valB || 0) - Number(valA || 0);
      });
    }
    return result;
  }, [symbols, search, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  useEffect(() => {
    if (!search.trim() || !accessToken) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const hits = await upstoxSearch.searchSymbols(accessToken, search);
        setSearchResults(hits);
        if (hits.length > 0) {
            setShowSearchDropdown(true);
            setSearchDropdownIndex(0);
        }
      } catch (err) {
          console.error('Search error:', err);
      } finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, accessToken]);

  const handleSelectResult = (res: UpstoxSearchResult) => {
    addKeyToActive(res.instrumentKey);
    setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
    setSearch('');
    setShowSearchDropdown(false);
    addToast(`ADDED ${res.ticker} TO ${activeWatchlist.name}`, 'success');
  };

  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const syncScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = (e.currentTarget as HTMLDivElement).scrollLeft;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000', overflow: 'hidden' }}>
      {/* Watchlist Tabs */}
      <div style={{ display: 'flex', alignItems: 'stretch', height: '32px', borderBottom: `1px solid #222222`, background: '#000000', overflowX: 'auto' }} className="no-scrollbar">
        {watchlists.map(w => (
          <div 
            key={w.id} 
            onClick={() => setActiveWatchlist(w.id)}
            onDoubleClick={() => { setEditingId(w.id); setEditValue(w.name); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', 
              borderRight: `1px solid #111111`, cursor: 'pointer',
              background: activeWatchlistId === w.id ? '#111111' : 'transparent',
              borderBottom: activeWatchlistId === w.id ? `1px solid #FF7722` : 'none',
              transition: 'all 0.1s linear',
              flexShrink: 0
            }}
          >
            {editingId === w.id ? (
              <input 
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => { renameWatchlist(w.id, editValue); setEditingId(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { renameWatchlist(w.id, editValue); setEditingId(null); } }}
                style={{ background: '#000', border: 'none', color: '#fff', fontSize: '10px', width: '80px', outline: 'none', fontFamily: TYPE.family.mono }}
              />
            ) : (
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: activeWatchlistId === w.id ? '#FFFFFF' : COLOR.text.muted, fontFamily: TYPE.family.mono, letterSpacing: '0.1em' }}>{w.name}</span>
            )}
            {watchlists.length > 1 && activeWatchlistId === w.id && !editingId && (
                <X size={10} color="#666" onClick={(e) => { e.stopPropagation(); deleteWatchlist(w.id); }} className="hover:text-red-500" />
            )}
          </div>
        ))}
        <button 
          onClick={() => createWatchlist(`Watchlist ${watchlists.length + 1}`)}
          style={{ padding: '0 12px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '8px', borderBottom: `1px solid #111111`, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#000', border: `1px solid #333333`, height: '32px', padding: '0 10px', gap: '10px' }}>
          <Search size={14} color="#666" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH / ADD SYMBOL..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '11px', outline: 'none', fontFamily: TYPE.family.mono }}
          />
        </div>
        
        <AnimatePresence>
            {showSearchDropdown && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', left: '8px', right: '8px', background: '#050505', border: `1px solid #333`, zIndex: 100, maxHeight: '300px', overflowY: 'auto' }}>
                    {searchResults.map((res, idx) => (
                        <div key={res.instrumentKey} onClick={() => handleSelectResult(res)} style={{ padding: '8px 12px', borderBottom: '1px solid #111', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover:bg-zinc-900">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', fontFamily: TYPE.family.mono }}>{res.ticker}</span>
                                <span style={{ fontSize: '9px', color: '#666' }}>{res.name}</span>
                            </div>
                            <Badge label={res.exchange} variant="exchange-nse" />
                        </div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div 
        ref={headerRef}
        style={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT.header, background: '#000000', borderBottom: `1px solid #222222`, flexShrink: 0, overflow: 'hidden' }}
      >
        {visibleColumns.map((col) => {
          const width = COLUMN_WIDTHS[col] || 80;
          const isActive = sortCol === col;
          return (
            <div
              key={col}
              onClick={() => handleSort(col)}
              style={{
                width,
                minWidth: width,
                display: 'flex',
                alignItems: 'center',
                justifyContent: col === 'SYMBOL' ? 'flex-start' : 'flex-end',
                padding: '0 12px',
                fontFamily: TYPE.family.mono,
                fontSize: '9px',
                fontWeight: '900',
                color: isActive ? '#FFFFFF' : '#666666',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                flex: 'none',
                borderRight: '1px solid #111111',
                height: '100%',
                position: col === 'SYMBOL' ? 'sticky' : 'static',
                left: col === 'SYMBOL' ? 0 : 'auto',
                zIndex: col === 'SYMBOL' ? 20 : 1,
                background: '#000000',
                cursor: 'pointer',
                transition: 'all 0.1s linear',
                userSelect: 'none',
                gap: '4px'
              }}
              className="hover:bg-zinc-950 transition-colors"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = '#666666'; }}
            >
              {col === 'SYMBOL' && isActive && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
              <span>{col}</span>
              {col !== 'SYMBOL' && isActive && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
            </div>
          );
        })}
      </div>

      {/* Scrollable Content */}
      <div 
        ref={contentRef}
        onScroll={syncScroll}
        style={{ flex: 1, overflow: 'auto', padding: '0' }} 
        className="custom-scrollbar"
      >
        <div style={{ minWidth: 'fit-content' }}>
            {sortedAndFiltered.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#444', fontSize: '11px', fontFamily: TYPE.family.mono }}>{search ? 'NO RESULTS FOUND' : 'ADD SYMBOLS TO START'}</div>
            ) : (
              sortedAndFiltered.map((s, idx) => (
                    <WatchlistRow
                        key={s.instrument_key || s.ticker}
                        symbol={s}
                        visibleColumns={visibleColumns}
                        isSelected={selectedSymbol?.instrument_key === s.instrument_key}
                        onClick={() => setSelectedSymbol(s)}
                    />
                ))
            )}
        </div>
      </div>
    </div>
  );
};
