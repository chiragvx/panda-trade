import React, { useState, useEffect, useRef } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { upstoxApi } from '../../services/upstoxApi';
import { upstoxSearch, UpstoxSearchResult } from '../../services/upstoxSearch';
import { COLOR, TYPE, BORDER, ROW_HEIGHT, SPACE } from '../../ds/tokens';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { Badge } from '../../ds/components/Badge';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { EmptyState } from '../../ds/components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Sigma, ShoppingBag, Settings2, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { isIsin } from '../../utils/liveSymbols';

interface MarketData {
  ltp: number;
  close_price?: number;
  volume?: number;
  oi?: number;
  prev_oi?: number;
  pChange?: number;
}

interface Greeks {
  delta?: number;
  theta?: number;
  gamma?: number;
  vega?: number;
  iv?: number;
}

interface OptionData {
  instrument_key: string;
  option_type: 'CE' | 'PE';
  market_data?: MarketData;
  option_greeks?: Greeks;
}

interface StrikeRow {
  strike: number;
  expiry: string;
  pcr?: number;
  spot?: number;
  ce?: OptionData;
  pe?: OptionData;
}

const COLUMN_WIDTH = 100;

export const OptionChainWidget: React.FC = () => {
  const { accessToken, prices } = useUpstoxStore();
  const { selectedSymbol, setSelectedSymbol } = useSelectionStore();
  const { openOrderModal } = useLayoutStore();

  const [expiries, setExpiries] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [chain, setChain] = useState<StrikeRow[]>([]);
  const [strikeLimit, setStrikeLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [showGreeks, setShowGreeks] = useState(false);
  const [basketMode, setBasketMode] = useState(false);
  const [basket, setBasket] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState(false);

  const [currentRootKey, setCurrentRootKey] = useState<string>('');

  // Search
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UpstoxSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Sync scroll Refs
  const ceHeaderRef = useRef<HTMLDivElement>(null);
  const peHeaderRef = useRef<HTMLDivElement>(null);
  const ceBodyRef = useRef<HTMLDivElement>(null);
  const peBodyRef = useRef<HTMLDivElement>(null);

  const isSyncing = useRef(false);

  const syncScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const scrollLeft = Math.abs(e.currentTarget.scrollLeft);
    const target = e.currentTarget;
    [ceHeaderRef, peHeaderRef, ceBodyRef, peBodyRef].forEach(ref => {
      if (ref.current && ref.current !== target) {
        ref.current.scrollLeft = scrollLeft;
      }
    });
    requestAnimationFrame(() => { isSyncing.current = false; });
  };

  const loadOptionChain = async (symbolKey: string) => {
    if (!accessToken || !symbolKey) return;
    setExpiries([]); setSelectedExpiry(''); setChain([]); setError(null);
    setExpiryLoading(true);
    let firstExpiry = '';
    try {
      const res = await upstoxApi.getExpiries(accessToken, symbolKey);
      if (res.status === 'success') {
        const today = new Date().toISOString().split('T')[0];
        let dates = Array.isArray(res.data) ? res.data : res.data?.expiry_date || [];
        dates = dates.filter((d: string) => d >= today).sort((a: string, b: string) => a.localeCompare(b));
        setExpiries(dates);
        if (dates.length > 0) { firstExpiry = dates[0]; setSelectedExpiry(firstExpiry); }
        else { setError('NO_ACTIVE_EXPIRIES_FOUND'); setExpiryLoading(false); return; }
      } else { setError(`FAIL: ${res?.errors?.[0]?.message || 'UNKNOWN'}`); setExpiryLoading(false); return; }
    } catch (err: any) { setError(`ERR: ${err.message}`); setExpiryLoading(false); return; }
    finally { setExpiryLoading(false); }
    if (firstExpiry) await fetchChain(symbolKey, firstExpiry);
  };

  const fetchChain = async (symbolKey: string, expiry: string) => {
    if (!accessToken || !symbolKey || !expiry) return;
    setLoading(true); setError(null);
    try {
      const res = await upstoxApi.getOptionChain(accessToken, symbolKey, expiry);
      if (res.status === 'success' && res.data) {
        const data = Array.isArray(res.data) ? res.data : [];
        if (data.length === 0) setError('EMPTY_CHAIN');
        else {
            const sorted = data.map((row: any) => ({
              strike: Number(row.strike_price), expiry: row.expiry, pcr: row.pcr, spot: row.underlying_spot_price,
              ce: row.call_options ? { ...row.call_options, option_type: 'CE' } : undefined,
              pe: row.put_options ? { ...row.put_options, option_type: 'PE' } : undefined
            })).sort((a: any, b: any) => a.strike - b.strike);
            setChain(sorted);
        }
      } else setError(res?.errors?.[0]?.message || 'FAILED LOAD');
    } catch (err: any) { setError(`ERR: ${err.message}`); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedSymbol?.instrument_key) {
      const isOption = selectedSymbol.exchange === 'NFO' || isIsin(selectedSymbol.instrument_key);
      if (!isOption && selectedSymbol.instrument_key !== currentRootKey) {
        setCurrentRootKey(selectedSymbol.instrument_key);
        loadOptionChain(selectedSymbol.instrument_key);
      }
    }
  }, [selectedSymbol?.instrument_key, accessToken]);

  const handleExpiryChange = (newExpiry: string) => { 
    setSelectedExpiry(newExpiry); 
    if (currentRootKey) fetchChain(currentRootKey, newExpiry); 
  };

  useEffect(() => {
    if (!search.trim() || !accessToken) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const hits = await upstoxSearch.searchSymbols(accessToken, search);
        setSearchResults(hits.filter(h => h.instrumentKey.includes('INDEX') || h.instrumentKey.includes('EQ')));
      } finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, accessToken]);

  const currentSpot = prices[selectedSymbol?.instrument_key || '']?.ltp || selectedSymbol?.ltp || 0;
  
  const { atmIndex, visibleChain, hasMoreAbove, hasMoreBelow } = React.useMemo(() => {
    if (!chain.length) return { atmIndex: 0, visibleChain: [], hasMoreAbove: false, hasMoreBelow: false };
    const idx = chain.findIndex(r => r.strike >= currentSpot);
    const resolvedIdx = idx === -1 ? chain.length - 1 : idx;
    const start = Math.max(0, resolvedIdx - strikeLimit);
    const end = Math.min(chain.length, resolvedIdx + strikeLimit);
    return {
      atmIndex: resolvedIdx,
      visibleChain: chain.slice(start, end),
      hasMoreAbove: start > 0,
      hasMoreBelow: end < chain.length
    };
  }, [chain, currentSpot, strikeLimit]);

  // CE cols: LTP nearest to Strike, wider columns scroll outward left
  const GreeksCols = ['IV', 'THETA', 'DELTA'];
  const StdCols = ['VOLUME', 'OI CHG', 'OI', 'LTP'];
  const ceCols = [...(showGreeks ? GreeksCols : []), ...StdCols];
  const peCols = ['LTP', 'OI', 'OI CHG', 'VOLUME', ...(showGreeks ? ['DELTA', 'THETA', 'IV'] : [])];

  const FINAL_ROW_HEIGHT = 32;
  const STRIKE_W = 80;
  const CE_TOTAL_W = ceCols.length * COLUMN_WIDTH;
  const PE_TOTAL_W = peCols.length * COLUMN_WIDTH;

  const renderCell = (opt: OptionData | undefined, strike: number, col: string, side: 'CE' | 'PE') => {
    if (!opt) return <div key={col} style={{ width: COLUMN_WIDTH, height: FINAL_ROW_HEIGHT, borderRight: BORDER.standard, flexShrink: 0, boxSizing: 'border-box' }} />;
    const mData = opt.market_data;
    const gData = opt.option_greeks;
    const liveLtp = prices[opt.instrument_key]?.ltp || mData?.ltp || 0;
    const inTheMoney = side === 'CE' ? strike < currentSpot : strike > currentSpot;
    const isSelected = basket.includes(opt.instrument_key);
    let content: React.ReactNode = null;
    switch (col) {
      case 'LTP': content = <div style={{ display: 'flex', flexDirection: 'column', alignItems: side === 'CE' ? 'flex-end' : 'flex-start' }}><span style={{ fontWeight: TYPE.weight.bold }}>{Number(liveLtp).toFixed(2)}</span><Change value={mData?.pChange || 0} format="percent" size="xs" /></div>; break;
      case 'OI': content = (mData?.oi || 0).toLocaleString(); break;
      case 'OI CHG': content = <Change value={(mData?.oi || 0) - (mData?.prev_oi || 0)} format="absolute" size="xs" />; break;
      case 'VOLUME': content = (mData?.volume || 0).toLocaleString(); break;
      case 'DELTA': content = gData?.delta?.toFixed(2) || '0.00'; break;
      case 'THETA': content = gData?.theta?.toFixed(2) || '0.00'; break;
      case 'IV': content = `${(gData?.iv || 0).toFixed(1)}%`; break;
    }
    return (
      <div key={`${opt.instrument_key}-${col}`} onClick={() => basketMode && setBasket(prev => prev.includes(opt.instrument_key) ? prev.filter(k => k !== opt.instrument_key) : [...prev, opt.instrument_key])} style={{ 
        width: COLUMN_WIDTH, height: FINAL_ROW_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: side === 'CE' ? 'flex-end' : 'flex-start', padding: '0 8px', borderRight: BORDER.standard, flexShrink: 0, boxSizing: 'border-box',
        background: isSelected ? `${COLOR.semantic.info}25` : inTheMoney ? `${COLOR.semantic.warning}08` : 'transparent', fontSize: '10px', color: col === 'IV' ? COLOR.semantic.info : COLOR.text.primary, cursor: basketMode ? 'pointer' : 'default', position: 'relative', overflow: 'hidden'
      }} className="group">
        {content}
        {col === 'LTP' && !basketMode && (
          <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-bg-overlay flex items-center justify-center gap-1 z-10 transition-opacity">
            <Button variant="buy" size="xs" onClick={(e) => { e.stopPropagation(); setSelectedSymbol({ ticker: selectedSymbol?.ticker || '', name: selectedSymbol?.name || '', exchange: 'NFO', instrument_key: opt.instrument_key, ltp: liveLtp } as any); setTimeout(() => openOrderModal('BUY'), 0); }}>B</Button>
            <Button variant="sell" size="xs" onClick={(e) => { e.stopPropagation(); setSelectedSymbol({ ticker: selectedSymbol?.ticker || '', name: selectedSymbol?.name || '', exchange: 'NFO', instrument_key: opt.instrument_key, ltp: liveLtp } as any); setTimeout(() => openOrderModal('SELL'), 0); }}>S</Button>
          </div>
        )}
      </div>
    );
  };

  const openOptionOrder = (side: 'BUY' | 'SELL', key: string, ltp: number) => {
    setSelectedSymbol({ ticker: selectedSymbol?.ticker || '', name: selectedSymbol?.name || '', exchange: 'NFO', instrument_key: key, ltp } as any);
    setTimeout(() => openOrderModal(side), 0);
  };

  return (
    <WidgetShell>
        <WidgetShell.Toolbar>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <div style={{ position: 'relative' }}>
                    <div onClick={() => setShowSearch(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 8px', background: COLOR.bg.surface, border: BORDER.standard, cursor: 'text', minWidth: '160px' }}>
                        <Search size={12} style={{ color: COLOR.text.muted }} />
                        <span style={{ fontSize: '11px', color: COLOR.text.primary, fontWeight: TYPE.weight.bold }}>{selectedSymbol?.ticker || 'SEARCH...'}</span>
                        <Price value={currentSpot} size="xs" color="info" />
                    </div>
                    <AnimatePresence>{showSearch && (
                        <>
                            <div onClick={() => setShowSearch(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', left: 0, width: '320px', background: COLOR.bg.overlay, border: BORDER.standard, zIndex: 2000 }}>
                                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="TICKER OR INDEX..." style={{ width: '100%', background: COLOR.bg.surface, border: 'none', borderBottom: BORDER.standard, padding: '10px', color: '#fff' }} />
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {searchResults.map(res => (
                                        <div key={res.instrumentKey} onClick={() => { setSelectedSymbol({ ticker: res.ticker, instrument_key: res.instrumentKey, exchange: res.exchange, name: res.name } as any); setShowSearch(false); setSearch(''); }} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} className="hover:bg-interactive-hover">
                                            <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 'bold', fontSize: '11px' }}>{res.ticker}</span><span style={{ fontSize: '9px', color: COLOR.text.muted }}>{res.name}</span></div>
                                            <Badge label={res.exchange} variant="exchange-nse" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}</AnimatePresence>
                </div>
                <div style={{ position: 'relative' }}>
                    <select value={selectedExpiry} onChange={e => handleExpiryChange(e.target.value)} disabled={expiryLoading || expiries.length === 0} style={{ background: COLOR.bg.base, border: BORDER.standard, color: COLOR.text.primary, padding: '2px 8px', fontSize: '11px', appearance: 'none', paddingRight: '24px' }}>
                        {expiryLoading ? <option>LOADING...</option> : expiries.length === 0 ? <option>NO_EXPIRY</option> : expiries.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => setBasketMode(!basketMode)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 10px', background: basketMode ? `${COLOR.semantic.info}22` : 'transparent', border: basketMode ? `1px solid ${COLOR.semantic.info}` : BORDER.standard, color: basketMode ? COLOR.semantic.info : COLOR.text.primary, fontSize: '10px' }}><ShoppingBag size={12} /> BASKET ({basket.length})</button>
                <button onClick={() => setShowGreeks(!showGreeks)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 10px', background: showGreeks ? `${COLOR.semantic.info}22` : 'transparent', border: showGreeks ? `1px solid ${COLOR.semantic.info}` : BORDER.standard, color: showGreeks ? COLOR.semantic.info : COLOR.text.primary, fontSize: '10px' }}><Sigma size={12} /> GREEKS</button>
                <button onClick={() => currentRootKey && fetchChain(currentRootKey, selectedExpiry)} style={{ padding: '4px', border: BORDER.standard, color: COLOR.text.muted }}><RotateCcw size={12} /></button>
            </div>
        </WidgetShell.Toolbar>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {/* Table Header — fixed, no vertical scroll */}
            <div style={{ display: 'flex', height: '28px', flexShrink: 0, background: COLOR.bg.surface, borderBottom: BORDER.standard, fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, boxSizing: 'border-box', overflow: 'hidden' }}>
                <div ref={ceHeaderRef} onScroll={syncScroll} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', direction: 'rtl', borderRight: BORDER.standard }} className="hide-scrollbar">
                    <div style={{ display: 'flex', direction: 'ltr', width: CE_TOTAL_W, flexShrink: 0 }}>
                        {ceCols.map(c => <div key={c} style={{ width: COLUMN_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px', borderRight: BORDER.standard, flexShrink: 0, boxSizing: 'border-box' }}>{c}</div>)}
                    </div>
                </div>
                <div style={{ width: STRIKE_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.bg.elevated, borderRight: BORDER.standard, zIndex: 20, boxSizing: 'border-box' }}>STRIKE</div>
                <div ref={peHeaderRef} onScroll={syncScroll} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex' }} className="hide-scrollbar">
                    <div style={{ display: 'flex', width: PE_TOTAL_W, flexShrink: 0 }}>
                        {peCols.map(c => <div key={c} style={{ width: COLUMN_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0 8px', borderRight: BORDER.standard, flexShrink: 0, boxSizing: 'border-box' }}>{c}</div>)}
                    </div>
                </div>
            </div>

            {/* BODY — single vertical scroll container */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', position: 'relative' }} className="custom-scrollbar">

                {/* CE BODY */}
                <div ref={ceBodyRef} onScroll={syncScroll} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', direction: 'rtl', borderRight: BORDER.standard }} className="hide-scrollbar">
                    <div style={{ display: 'flex', flexDirection: 'column', direction: 'ltr', width: CE_TOTAL_W, flexShrink: 0 }}>
                        {hasMoreAbove && <div onClick={() => setStrikeLimit(p => p + 20)} style={{ height: FINAL_ROW_HEIGHT, minHeight: FINAL_ROW_HEIGHT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.semantic.info, color: '#fff', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>LOAD MORE</div>}
                        {visibleChain.map(row => (
                            <div key={row.strike} style={{ display: 'flex', height: FINAL_ROW_HEIGHT, minHeight: FINAL_ROW_HEIGHT, flexShrink: 0, borderBottom: '1px solid #1a1a1a', boxSizing: 'border-box', overflow: 'hidden' }}>
                                {ceCols.map(c => renderCell(row.ce, row.strike, c, 'CE'))}
                            </div>
                        ))}
                        {hasMoreBelow && <div onClick={() => setStrikeLimit(p => p + 20)} style={{ height: FINAL_ROW_HEIGHT, minHeight: FINAL_ROW_HEIGHT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.semantic.info, color: '#fff', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>LOAD MORE</div>}
                    </div>
                </div>

                {/* STRIKE COLUMN */}
                <div style={{ width: STRIKE_W, flexShrink: 0, display: 'flex', flexDirection: 'column', background: COLOR.bg.elevated, borderRight: BORDER.standard, zIndex: 5 }}>
                    {hasMoreAbove && <div style={{ height: FINAL_ROW_HEIGHT, minHeight: FINAL_ROW_HEIGHT, flexShrink: 0, boxSizing: 'border-box' }} />}
                    {visibleChain.map(row => (
                        <div key={row.strike} style={{ height: FINAL_ROW_HEIGHT, minHeight: FINAL_ROW_HEIGHT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1a1a1a', fontWeight: 'bold', fontSize: '10px', color: COLOR.text.primary, position: 'relative', boxSizing: 'border-box' }}>
                            {Math.abs(row.strike - currentSpot) <= 25 && <div style={{ position: 'absolute', inset: 0, borderTop: `1px solid ${COLOR.semantic.info}`, borderBottom: `1px solid ${COLOR.semantic.info}`, pointerEvents: 'none' }} />}
                            {row.strike.toLocaleString()}
                        </div>
                    ))}
                    {hasMoreBelow && <div style={{ height: FINAL_ROW_HEIGHT, minHeight: FINAL_ROW_HEIGHT, flexShrink: 0, boxSizing: 'border-box' }} />}
                </div>

                {/* PE BODY */}
                <div ref={peBodyRef} onScroll={syncScroll} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex' }} className="hide-scrollbar">
                    <div style={{ display: 'flex', flexDirection: 'column', width: PE_TOTAL_W, flexShrink: 0 }}>
                        {hasMoreAbove && <div onClick={() => setStrikeLimit(p => p + 20)} style={{ height: FINAL_ROW_HEIGHT, minHeight: FINAL_ROW_HEIGHT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.semantic.info, color: '#fff', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>LOAD MORE</div>}
                        {visibleChain.map(row => (
                            <div key={row.strike} style={{ display: 'flex', height: FINAL_ROW_HEIGHT, minHeight: FINAL_ROW_HEIGHT, flexShrink: 0, borderBottom: '1px solid #1a1a1a', boxSizing: 'border-box', overflow: 'hidden' }}>
                                {peCols.map(c => renderCell(row.pe, row.strike, c, 'PE'))}
                            </div>
                        ))}
                        {hasMoreBelow && <div onClick={() => setStrikeLimit(p => p + 20)} style={{ height: FINAL_ROW_HEIGHT, minHeight: FINAL_ROW_HEIGHT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.semantic.info, color: '#fff', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', boxSizing: 'border-box' }}>LOAD MORE</div>}
                    </div>
                </div>

            </div>{/* end BODY */}

            {(expiryLoading || (loading && chain.length === 0)) && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 className="animate-spin" size={32} />
                </div>
            )}
        </div>{/* end flex column */}

        {basketMode && basket.length > 0 && (
            <div style={{ height: '40px', background: COLOR.semantic.info, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><ShoppingBag size={14} /><span>{basket.length} POSITIONS IN BASKET</span></div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setBasket([])} style={{ background: 'transparent', border: '1px solid #fff', padding: '2px 12px' }}>CLEAR</button>
                    <button style={{ background: '#fff', color: '#000', padding: '2px 16px' }}>EXECUTE</button>
                </div>
            </div>
        )}
    </WidgetShell>
  );
};

