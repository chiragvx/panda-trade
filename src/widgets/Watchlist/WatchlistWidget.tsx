import React, { useState, useEffect, useRef, useMemo } from 'react';
import { isIsin } from '../../utils/liveSymbols';
import { useSelectionStore, useLayoutStore, useWatchlistStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useContextMenuStore } from '../../store/useContextMenuStore';
import { SymbolData } from '../../types';
import { 
  COLOR, 
  TYPE, 
  ROW_HEIGHT, 
  BORDER, 
  Text,
  Badge,
  Price,
  Change,
  Button,
  DataTable,
  HoverActions
} from '../../ds';
import { motion, AnimatePresence } from 'framer-motion';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { upstoxSearch, UpstoxSearchResult } from '../../services/upstoxSearch';
import { useToastStore } from '../../components/ToastContainer';
import { Trash2, Search, Plus, X, ArrowUpCircle, ArrowDownCircle, Info, BarChart3, MoreVertical } from 'lucide-react';

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

const PriceCell = ({ symbol }: { symbol: SymbolData }) => {
  const { prices } = useUpstoxStore();
  const livePrice = symbol.instrument_key ? prices[symbol.instrument_key]?.ltp : undefined;
  const price = livePrice !== undefined && livePrice !== null ? Number(livePrice) : Number(symbol.ltp || 0);
  const flash = usePriceFlash(price);
  return <Price value={price} currency="" size="md" flash={flash} weight="bold" />;
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
    removeKeyFromActive
  } = useWatchlistStore();

  const { accessToken, prices, instrumentMeta, setInstrumentMeta } = useUpstoxStore();
  const { selectedSymbol, setSelectedSymbol } = useSelectionStore();
  const { openOrderModal } = useLayoutStore();
  const { openContextMenu } = useContextMenuStore();
  const { addToast } = useToastStore();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UpstoxSearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
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
      return s.ticker.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q);
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

  useEffect(() => {
    if (!search.trim() || !accessToken) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const hits = await upstoxSearch.searchSymbols(accessToken, search);
        setSearchResults(hits);
        setShowSearchDropdown(hits.length > 0);
      } catch (err) {
          console.error('Search error:', err);
      }
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

  const handleRightClick = (e: React.MouseEvent, symbol: SymbolData) => {
    e.preventDefault();
    setSelectedSymbol(symbol);
    
    const tickerIsIsin = isIsin(symbol.ticker);
    const displayTicker = tickerIsIsin ? (symbol.name || 'INSTRUMENT') : (symbol.ticker || '--');
    const isIndex = symbol.instrument_key?.includes('_INDEX') || symbol.instrument_key?.includes('VIX');

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
        label: 'VIEW FUNDAMENTALS', 
        icon: <Info size={14} />, 
        variant: 'muted' as const,
        onClick: () => { 
            setSelectedSymbol(symbol); 
            if ((window as any).replaceTab) (window as any).replaceTab('fundamentals');
        } 
      }
    ];

    const filteredOptions = isIndex ? options.filter(o => o.label.includes('CHART')) : options;
    openContextMenu(e.clientX, e.clientY, filteredOptions);
  };

  const columns = [
    {
      key: 'SYMBOL',
      label: 'SYMBOL',
      width: 140,
      sortable: true,
      render: (_: any, symbol: SymbolData, idx: number) => {
        const tickerIsIsin = isIsin(symbol.ticker);
        const displayTicker = tickerIsIsin ? (symbol.name || 'INSTRUMENT') : (symbol.ticker || '--');
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', position: 'relative', width: '100%', height: '100%' }}>
            <Text weight="bold" size="sm" color="primary" block ellipsis style={{ maxWidth: '90px' }}>
                {displayTicker}
            </Text>
            <Badge label={symbol.exchange} variant={symbol.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
          </div>
        );
      }
    },
    {
      key: 'LTP',
      label: 'LTP',
      width: 90,
      align: 'right' as const,
      sortable: true,
      render: (_: any, symbol: SymbolData) => <PriceCell symbol={symbol} />
    },
    {
      key: 'change',
      label: 'CHG',
      width: 80,
      align: 'right' as const,
      sortable: true,
      render: (_: any, s: SymbolData) => <Change value={s.change || 0} format="absolute" size="xs" weight="medium" />
    },
    {
      key: 'changePct',
      label: '%CHG',
      width: 80,
      align: 'right' as const,
      sortable: true,
      render: (val: any) => <Change value={val || 0} format="percent" size="sm" weight="medium" />
    },
    {
      key: 'volume',
      label: 'VOLUME',
      width: 90,
      align: 'right' as const,
      sortable: true,
      render: (val: any) => <Text size="xs" color="muted">{(Number(val || 0) / 1000000).toFixed(2)}M</Text>
    },
    {
        key: 'actions',
        label: '',
        width: 140,
        render: (_: any, symbol: SymbolData, idx: number) => (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <HoverActions 
                    isVisible={hoveredIndex === idx}
                    onBuy={() => { setSelectedSymbol(symbol); setTimeout(() => openOrderModal('BUY'), 0); }}
                    onSell={() => { setSelectedSymbol(symbol); setTimeout(() => openOrderModal('SELL'), 0); }}
                    onInfo={() => { setSelectedSymbol(symbol); if ((window as any).replaceTab) (window as any).replaceTab('fundamentals'); }}
                    onDelete={() => removeKeyFromActive(symbol.instrument_key!)}
                    position="sticky"
                />
            </div>
        )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.base, overflow: 'hidden' }}>
      {/* Watchlist Tabs */}
      <div style={{ display: 'flex', alignItems: 'stretch', height: '32px', borderBottom: BORDER.standard, background: COLOR.bg.base, overflowX: 'auto' }} className="no-scrollbar">
        {watchlists.map(w => (
          <div 
            key={w.id} 
            onClick={() => setActiveWatchlist(w.id)}
            onDoubleClick={() => { setEditingId(w.id); setEditValue(w.name); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '32px',
              borderRight: BORDER.standard, cursor: 'pointer',
              background: activeWatchlistId === w.id ? COLOR.bg.surface : 'transparent',
              borderBottom: activeWatchlistId === w.id ? `2px solid ${COLOR.semantic.info}` : 'none',
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
                style={{ background: COLOR.bg.base, border: 'none', color: COLOR.text.primary, fontSize: TYPE.size.xs, width: '80px', outline: 'none', fontFamily: TYPE.family.mono }}
              />
            ) : (
              <Text 
                size="xs" 
                weight="bold" 
                color={activeWatchlistId === w.id ? 'primary' : 'muted'}
                style={{ letterSpacing: '0.1em' }}
              >
                {w.name}
              </Text>
            )}
            {watchlists.length > 1 && activeWatchlistId === w.id && !editingId && (
                <X size={10} color={COLOR.text.muted} onClick={(e) => { e.stopPropagation(); deleteWatchlist(w.id); }} className="hover:text-red-500" />
            )}
          </div>
        ))}
        <button 
          onClick={() => createWatchlist(`Watchlist ${watchlists.length + 1}`)}
          style={{ padding: 0, background: 'transparent', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: 0, borderBottom: BORDER.standard, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: COLOR.bg.base, border: BORDER.standard, height: '32px', padding: '0 8px', gap: '8px' }}>
          <Search size={14} color={COLOR.text.muted} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH_SYMBOLS..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: COLOR.text.primary, fontSize: TYPE.size.sm, outline: 'none', fontFamily: TYPE.family.mono }}
          />
        </div>
        
        <AnimatePresence>
            {showSearchDropdown && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', left: '8px', right: '8px', background: COLOR.bg.elevated, border: BORDER.standard, zIndex: 100, maxHeight: '300px', overflowY: 'auto' }}>
                    {searchResults.map((res) => (
                        <div key={res.instrumentKey} onClick={() => handleSelectResult(res)} style={{ padding: 0, borderBottom: BORDER.standard, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover:bg-zinc-900">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text weight="medium" color="primary">{res.ticker}</Text>
                                <Text size="xs" color="muted">{res.name}</Text>
                            </div>
                            <Badge label={res.exchange} variant="exchange-nse" />
                        </div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Data Table */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <DataTable 
            data={sortedAndFiltered}
            columns={columns}
            onRowClick={(item) => setSelectedSymbol(item)}
            onRowContextMenu={handleRightClick}
            onRowMouseEnter={(_, idx) => setHoveredIndex(idx)}
            onRowMouseLeave={() => setHoveredIndex(null)}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={setSortCol}
            stickyFirstColumn
        />
      </div>
    </div>
  );
};
