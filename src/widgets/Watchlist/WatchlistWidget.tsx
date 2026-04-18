import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { buildSymbolFromFeed, getDisplayTicker, isUselessTicker } from '../../utils/liveSymbols';
import { upstoxSearch } from '../../services/upstoxSearch';
import { useToastStore } from '../../components/ToastContainer';
import { Trash2, Plus, X, ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';

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
    let result = symbols;
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
  }, [symbols, sortCol, sortDir]);

  useEffect(() => {
    if (!accessToken || !activeWatchlist?.keys) return;

    const resolveMissing = async () => {
      const keysToResolve = activeWatchlist.keys.filter(k => {
        const meta = instrumentMeta[k];
        return !meta || (isUselessTicker(meta.ticker) && isUselessTicker(meta.name));
      });

      if (keysToResolve.length === 0) return;

      for (const k of keysToResolve) {
        try {
          const [, raw] = k.split('|');
          const results = await upstoxSearch.searchSymbols(accessToken, raw || k, 1);
          if (results.length > 0) {
            const best = results[0];
            setInstrumentMeta({ [k]: { ticker: best.ticker, name: best.name, exchange: best.exchange } });
          }
        } catch (e) {
          console.warn('Failed to resolve name for', k, e);
        }
      }
    };

    resolveMissing();
  }, [accessToken, activeWatchlist?.keys.length]);

  const handleSelectResult = (res: any) => {
    addKeyToActive(res.instrumentKey);
    setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
    addToast(`Added ${res.ticker} to ${activeWatchlist.name}`, 'success');
  };

  const handleRightClick = (e: React.MouseEvent, symbol: SymbolData) => {
    e.preventDefault();
    setSelectedSymbol(symbol);

    const displayTicker = getDisplayTicker({
      ticker: symbol.ticker,
      name: symbol.name,
      instrumentKey: symbol.instrument_key,
      fallback: '--',
    });
    const isIndex = symbol.instrument_key?.includes('_INDEX') || symbol.instrument_key?.includes('VIX');

    const options = [
      { 
        label: 'Buy ' + displayTicker, 
        icon: <ArrowUpCircle size={14} />, 
        variant: 'info' as const,
        onClick: () => { openOrderModal('BUY'); } 
      },
      { 
        label: 'Sell ' + displayTicker, 
        icon: <ArrowDownCircle size={14} />, 
        variant: 'danger' as const,
        onClick: () => { openOrderModal('SELL'); } 
      },
      { 
        label: 'View Fundamentals', 
        icon: <Info size={14} />, 
        variant: 'muted' as const,
        onClick: () => { 
            setSelectedSymbol(symbol); 
            if ((window as any).replaceTab) (window as any).replaceTab('fundamentals');
        } 
      }
    ];

    const filteredOptions = isIndex ? options.filter(o => !o.label.startsWith('Buy') && !o.label.startsWith('Sell')) : options;
    openContextMenu(e.clientX, e.clientY, filteredOptions);
  };

  const columns = [
    {
      key: 'SYMBOL',
      label: 'SYMBOL',
      width: 140,
      sortable: true,
      render: (_: any, symbol: SymbolData, idx: number) => {
        const displaySymbol = getDisplayTicker({
          ticker: symbol.ticker,
          name: symbol.name,
          instrumentKey: symbol.instrument_key,
          fallback: '--',
        });
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', position: 'relative', width: '100%', height: '100%' }}>
            <Text weight="bold" size="sm" color="primary" block ellipsis style={{ maxWidth: '120px' }}>
                {displaySymbol}
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
            <HoverActions 
                isVisible={hoveredIndex === idx}
                onBuy={() => { setSelectedSymbol(symbol); setTimeout(() => openOrderModal('BUY'), 0); }}
                onSell={() => { setSelectedSymbol(symbol); setTimeout(() => openOrderModal('SELL'), 0); }}
                onInfo={() => { setSelectedSymbol(symbol); if ((window as any).replaceTab) (window as any).replaceTab('fundamentals'); }}
                onChart={() => { 
                    setSelectedSymbol(symbol); 
                    if ((window as any).targetWidget) (window as any).targetWidget('chart'); 
                }}
                onDelete={() => removeKeyFromActive(symbol.instrument_key!)}
            />
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

      {/* Search Bar — uses shared WidgetSymbolSearch for consistent dropdown */}
      <div style={{ borderBottom: BORDER.standard }}>
        <WidgetSymbolSearch onSelect={handleSelectResult} placeholder="Search symbols..." />
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
            stickyLastColumn
        />
      </div>
    </div>
  );
};
