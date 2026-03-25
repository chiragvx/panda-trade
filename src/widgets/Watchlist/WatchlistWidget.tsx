import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMockSymbols, useMockTicker } from '../../mock/hooks';
import { useSelectionStore, useLayoutStore, useWatchlistStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { SymbolData } from '../../types';
import { COLOR, TYPE, ROW_HEIGHT, BORDER } from '../../ds/tokens';
import { Badge } from '../../ds/components/Badge';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';
import { Sparkline } from '../../ds/components/Sparkline';
import { Button } from '../../ds/components/Button';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── HOOKS ─────────────────────────────────────────────────── */
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

const MOCK_SPARK = () => Array.from({ length: 12 }, () => 90 + Math.random() * 20);

/* ─── COMPONENTS ────────────────────────────────────────────── */
const RangeBar: React.FC<{ low: number; high: number; current: number }> = ({ low, high, current }) => {
  const pct = ((current - low) / (high - low)) * 100;
  return (
    <div style={{ width: '48px', height: '3px', background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ 
        position: 'absolute', left: `${Math.min(95, Math.max(0, pct))}%`, 
        top: 0, bottom: 0, width: '4px', background: COLOR.text.secondary,
        boxShadow: `0 0 4px ${COLOR.text.secondary}44`
      }} />
    </div>
  );
};

const ColumnHeader: React.FC<{ 
  id: string; label: string; width?: number; flex?: boolean;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ id, label, width, flex, onContextMenu }) => (
  <div 
    onContextMenu={onContextMenu}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: id === 'SYMBOL' ? 'flex-start' : 'flex-end',
      ...(flex ? { flex: 1 } : { width }),
      paddingLeft: id === 'SYMBOL' ? '8px' : '4px', paddingRight: id === 'SYMBOL' ? '4px' : '8px',
      fontFamily: TYPE.family.mono, fontSize: '9px', fontWeight: TYPE.weight.bold,
      color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase',
      userSelect: 'none', cursor: 'pointer',
    }}
  >
    {label}
  </div>
);

const COLUMN_WIDTHS: Record<string, number> = {
  'SYMBOL': 0, // Flex
  'LTP': 80,
  'CHG': 68,
  '%CHG': 68,
  'BID': 72,
  'ASK': 72,
  'VOLUME': 72,
  'DELIVERY%': 72,
  '52W RANGE': 80,
  'SPREAD': 64,
  'OI CHG': 64
};

/* ─── ROW COMPONENT ─────────────────────────────────────────── */
const WatchlistRow: React.FC<{ 
    symbol: SymbolData; 
    visibleColumns: string[]; 
    isSelected: boolean;
    onContextMenu: (e: React.MouseEvent, s: SymbolData) => void;
    onClick: () => void;
}> = ({ symbol, visibleColumns, isSelected, onContextMenu, onClick }) => {
  const { openOrderModal } = useLayoutStore();
  const { setSelectedSymbol } = useSelectionStore();
  const { prices } = useUpstoxStore();
  
  const mockPrice = useMockTicker(symbol.ticker);
  
  // Favor Upstox price if available for this symbol
  const livePrice = symbol.instrument_key ? (prices[symbol.instrument_key]?.ltp) : null;
  const price = livePrice !== undefined && livePrice !== null ? livePrice : mockPrice;
  
  const flash = usePriceFlash(price);
  const [hovered, setHovered] = useState(false);
  const [spark] = useState(MOCK_SPARK);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={e => onContextMenu(e, symbol)}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', height: ROW_HEIGHT.compact,
        borderBottom: BORDER.standard, cursor: 'default', position: 'relative',
        background: isSelected ? COLOR.interactive.selected : hovered ? COLOR.interactive.hover : 'transparent',
        borderLeft: isSelected ? `2px solid ${COLOR.semantic.info}` : hovered ? `2px solid ${COLOR.bg.border}` : '2px solid transparent',
        userSelect: 'none',
      }}
    >
      {visibleColumns.map(col => {
        switch (col) {
          case 'SYMBOL':
            return (
              <div key={col} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', paddingLeft: '8px', minWidth: '120px' }}>
                <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.md, fontWeight: TYPE.weight.medium, color: COLOR.text.primary }}>
                  {symbol.ticker}
                </span>
                <Badge label={symbol.exchange} variant={symbol.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
              </div>
            );
          case 'LTP':
            return (
              <div key={col} style={{ width: COLUMN_WIDTHS[col], textAlign: 'right', paddingRight: '12px', flexShrink: 0 }}>
                <Price value={price} currency="" size="md" flash={flash} weight="extrabold" />
              </div>
            );
          case 'CHG':
            return (
              <div key={col} style={{ width: COLUMN_WIDTHS[col], textAlign: 'right', paddingRight: '8px', flexShrink: 0 }}>
                <Change value={symbol.change} format="absolute" size="xs" weight="bold" />
              </div>
            );
          case '%CHG':
            return (
              <div key={col} style={{ width: COLUMN_WIDTHS[col], textAlign: 'right', paddingRight: '8px', position: 'relative', flexShrink: 0 }}>
                 <AnimatePresence mode="wait">
                    {hovered ? (
                        <motion.div 
                          key="spark"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}
                        >
                            <Sparkline data={spark} width={48} height={14} />
                        </motion.div>
                    ) : (
                        <motion.div key="pct" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Change value={symbol.changePct} format="percent" size="sm" />
                        </motion.div>
                    )}
                 </AnimatePresence>
              </div>
            );
          case 'DELIVERY%':
            return (
              <div key={col} style={{ width: COLUMN_WIDTHS[col], textAlign: 'right', paddingRight: '12px', flexShrink: 0 }}>
                 <span style={{ 
                    fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, 
                    color: (symbol.deliveryPct || 0) > 60 ? COLOR.semantic.up : (symbol.deliveryPct || 0) < 25 ? COLOR.semantic.down : COLOR.text.secondary
                  }}>
                    {(symbol.deliveryPct || 0).toFixed(1)}%
                 </span>
              </div>
            );
          case '52W RANGE':
            return (
              <div key={col} style={{ width: COLUMN_WIDTHS[col], display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '12px', flexShrink: 0 }}>
                <RangeBar low={symbol.low52w || 0} high={symbol.high52w || 0} current={price} />
              </div>
            );
          case 'SPREAD':
              return (
                <div key={col} style={{ width: COLUMN_WIDTHS[col], textAlign: 'right', paddingRight: '8px', flexShrink: 0 }}>
                   <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>
                      {((symbol.ask || 0) - (symbol.bid || 0)).toFixed(2)}
                   </span>
                </div>
              );
          case 'BID':
              return (
                <div key={col} style={{ width: COLUMN_WIDTHS[col], textAlign: 'right', paddingRight: '8px', flexShrink: 0 }}>
                   <Price value={symbol.bid || 0} size="sm" weight="bold" />
                </div>
              );
          case 'ASK':
              return (
                <div key={col} style={{ width: COLUMN_WIDTHS[col], textAlign: 'right', paddingRight: '8px', flexShrink: 0 }}>
                   <Price value={symbol.ask || 0} size="sm" weight="bold" />
                </div>
              );
          case 'VOLUME':
              return (
                <div key={col} style={{ width: COLUMN_WIDTHS[col], textAlign: 'right', paddingRight: '8px', flexShrink: 0 }}>
                   <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>
                      {((symbol.volume || 0) / 1000000).toFixed(2)}M
                   </span>
                </div>
              );
          case 'OI CHG':
              return (
                <div key={col} style={{ width: COLUMN_WIDTHS[col], textAlign: 'right', paddingRight: '8px', flexShrink: 0 }}>
                   <Change value={symbol.oiChangePct || 0} format="percent" size="sm" />
                </div>
              );
          default:
            return null;
        }
      })}

      {/* Row actions: B/S visible on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          display: 'flex', alignItems: 'center', gap: '3px', padding: '0 6px',
          background: COLOR.interactive.hover, borderLeft: `1px solid ${COLOR.bg.border}`,
        }}>
          <Button variant="buy" size="xs" onClick={e => { e.stopPropagation(); setSelectedSymbol(symbol); openOrderModal('BUY'); }}>B</Button>
          <Button variant="sell" size="xs" onClick={e => { e.stopPropagation(); setSelectedSymbol(symbol); openOrderModal('SELL'); }}>S</Button>
        </div>
      )}
    </div>
  );
};

/* ─── MAIN WIDGET ───────────────────────────────────────────── */
export const WatchlistWidget: React.FC = () => {
  const symbols = useMockSymbols();
  const { visibleColumns, activeTab, toggleColumn, setActiveTab } = useWatchlistStore();
  const { selectedSymbol, setSelectedSymbol } = useSelectionStore();
  const { openOrderModal } = useLayoutStore();
  
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState<{ x: number; y: number; symbol: SymbolData } | null>(null);
  const [headerMenu, setHeaderMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(() => {
    let list = symbols.filter(s => s.ticker.toLowerCase().includes(search.toLowerCase()));
    if (activeTab === 'F&O') {
      list = list.filter(s => s.ticker.includes('NIFTY') || s.ticker.includes('BANK') || Math.random() > 0.5); // Mock F&O filter
    }
    return list;
  }, [symbols, search, activeTab]);

  /* Keyboard Nav */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(filtered.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        setSelectedSymbol(filtered[selectedIndex]);
        (window as any).addNodeToLayout('chart');
      } else if (e.key.toLowerCase() === 'b') {
          setSelectedSymbol(filtered[selectedIndex]);
          openOrderModal('BUY');
      } else if (e.key.toLowerCase() === 's') {
          setSelectedSymbol(filtered[selectedIndex]);
          openOrderModal('SELL');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, setSelectedSymbol, openOrderModal]);

  useEffect(() => {
    const nextSymbol = filtered[selectedIndex];
    if (nextSymbol && nextSymbol.ticker !== selectedSymbol?.ticker) {
      setSelectedSymbol(nextSymbol);
    }
  }, [selectedIndex, filtered, setSelectedSymbol, selectedSymbol]);

  const allColumns = ['SYMBOL', 'LTP', 'CHG', '%CHG', 'BID', 'ASK', 'VOLUME', 'DELIVERY%', '52W RANGE', 'SPREAD', 'OI CHG'];

  return (
    <div 
      onContextMenu={e => e.preventDefault()}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface, overflow: 'hidden' }}
    >
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: BORDER.standard, height: '26px', background: COLOR.bg.elevated }}>
        {(['ALL', 'F&O'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              borderBottom: activeTab === tab ? `1px solid ${COLOR.semantic.info}` : '1px solid transparent',
              fontFamily: TYPE.family.mono, fontSize: '10px', letterSpacing: '0.1em',
              color: activeTab === tab ? COLOR.text.primary : COLOR.text.muted,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '4px 6px', borderBottom: BORDER.standard, flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
          placeholder="TICKER..."
          style={{
            width: '100%', background: COLOR.bg.overlay, border: BORDER.standard, borderRadius: 0,
            color: COLOR.text.primary, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm,
            padding: '3px 8px', outline: 'none', caretColor: COLOR.semantic.info,
          }}
        />
      </div>

      {/* Headers */}
      <div style={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
        {visibleColumns.map(col => (
          <ColumnHeader 
            key={col} id={col} label={col} 
            flex={col === 'SYMBOL'} 
            width={COLUMN_WIDTHS[col] || 64}
            onContextMenu={e => { e.preventDefault(); setHeaderMenu({ x: e.clientX, y: e.clientY }); }}
          />
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
        {filtered.map((s, idx) => (
          <WatchlistRow 
            key={s.ticker} symbol={s} visibleColumns={visibleColumns} 
            isSelected={selectedIndex === idx}
            onClick={() => { setSelectedIndex(idx); setSelectedSymbol(s); }}
            onContextMenu={(e, sym) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, symbol: sym }); }}
          />
        ))}
      </div>

      {/* Context Menus */}
      <AnimatePresence>
        {headerMenu && (
             <div 
               onClick={() => setHeaderMenu(null)}
               style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
             >
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    position: 'fixed', left: headerMenu.x, top: headerMenu.y,
                    width: '160px', background: COLOR.bg.overlay, border: BORDER.standard,
                    padding: '4px 0',
                  }}
                >
                    <div style={{ padding: '4px 10px', borderBottom: BORDER.standard, color: COLOR.text.muted, fontSize: '9px', fontFamily: TYPE.family.mono, textTransform: 'uppercase' }}>Columns</div>
                    {allColumns.map(col => (
                        <button 
                          key={col} 
                          onClick={(e) => { e.stopPropagation(); toggleColumn(col); }}
                          style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                width: '100%', padding: '5px 10px', background: 'transparent', border: 'none',
                                cursor: 'pointer', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm,
                                color: visibleColumns.includes(col) ? COLOR.text.primary : COLOR.text.muted,
                          }}
                        >
                            {col}
                            {visibleColumns.includes(col) && <span style={{ color: COLOR.semantic.info }}>✓</span>}
                        </button>
                    ))}
                </motion.div>
             </div>
        )}

        {menu && (
            <div 
              onClick={() => setMenu(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
            >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{
                    position: 'fixed', left: menu.x, top: menu.y,
                    width: '180px', background: COLOR.bg.overlay, border: BORDER.standard,
                    padding: '4px 0',
                  }}
                >
                    <div style={{ padding: '6px 10px', borderBottom: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{menu.symbol.ticker}</span>
                        <Badge label={menu.symbol.exchange} variant="exchange-nse" />
                    </div>
                    {[
                        { label: 'BUY (B)', action: () => openOrderModal('BUY'), color: COLOR.semantic.up },
                        { label: 'SELL (S)', action: () => openOrderModal('SELL'), color: COLOR.semantic.down },
                        { label: 'CHART (Enter)', action: () => (window as any).addNodeToLayout('chart') },
                        { label: 'DEPTH (F6)', action: () => (window as any).addNodeToLayout('depth') },
                    ].map((item, i) => (
                        <button key={i} onClick={item.action} style={{
                            width: '100%', padding: '6px 10px', background: 'transparent', border: 'none',
                            cursor: 'pointer', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm,
                            textAlign: 'left', color: item.color || COLOR.text.secondary
                        }}>
                            {item.label}
                        </button>
                    ))}
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
