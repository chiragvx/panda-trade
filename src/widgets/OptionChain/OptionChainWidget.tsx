import React, { useState, useEffect, useRef } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { upstoxApi } from '../../services/upstoxApi';
import { upstoxSearch, UpstoxSearchResult } from '../../services/upstoxSearch';
import { COLOR, TYPE, BORDER, ROW_HEIGHT } from '../../ds/tokens';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { Badge } from '../../ds/components/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Sigma, ShoppingBag, Settings2, RotateCcw } from 'lucide-react';
import { isIsin } from '../../utils/liveSymbols';

interface MarketData {
  ltp: number;
  close?: number;
  volume?: number;
  oi?: number;
  oi_change?: number;
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
  ticker: string;
  strike_price: number;
  expiry: string;
  option_type: 'CE' | 'PE';
  market_data?: MarketData;
  greeks?: Greeks;
}

interface StrikeRow {
  strike: number;
  ce?: OptionData;
  pe?: OptionData;
}

const COLUMN_WIDTH = 80;

export const OptionChainWidget: React.FC = () => {
  const { accessToken, prices } = useUpstoxStore();
  const { selectedSymbol, setSelectedSymbol } = useSelectionStore();
  const { openOrderModal } = useLayoutStore();

  const [expiries, setExpiries] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [chain, setChain] = useState<StrikeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGreeks, setShowGreeks] = useState(false);
  const [basketMode, setBasketMode] = useState(false);
  const [basket, setBasket] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState(false);

  // Search
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UpstoxSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const ceHeaderRef = useRef<HTMLDivElement>(null);
  const peHeaderRef = useRef<HTMLDivElement>(null);
  const ceBodyRef = useRef<HTMLDivElement>(null);
  const peBodyRef = useRef<HTMLDivElement>(null);

  const syncScroll = (e: React.UIEvent<HTMLDivElement>, others: React.RefObject<HTMLDivElement | null>[]) => {
    const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
    others.forEach(ref => {
      if (ref.current && ref.current !== e.target) ref.current.scrollLeft = scrollLeft;
    });
  };

  useEffect(() => {
    if (!accessToken || !selectedSymbol?.instrument_key) return;
    const key = selectedSymbol.instrument_key;
    const fetchExpiries = async () => {
      console.log('[OptionChain] Fetching Expiries for:', key);
      try {
        const res = await upstoxApi.getExpiries(accessToken, key);
        if (res.status === 'success' && res.data?.expiry_date) {
          setExpiries(res.data.expiry_date);
          setSelectedExpiry(res.data.expiry_date[0]);
        } else {
            console.error('[OptionChain] Expiries fail:', res);
            setError(`EXPIRY_FAIL: ${res?.errors?.[0]?.message || 'UNKNOWN'}`);
        }
      } catch (err: any) { 
          console.error('[OptionChain] Expiries error:', err); 
          setError(`EXPIRY_ERR: ${err.response?.status} - ${err.message}`);
      }
    };
    fetchExpiries();
  }, [selectedSymbol?.instrument_key, accessToken]);

  const fetchChain = async () => {
    if (!accessToken || !selectedSymbol?.instrument_key || !selectedExpiry) return;
    setLoading(true);
    setError(null);
    try {
      const res = await upstoxApi.getOptionChain(accessToken, selectedSymbol.instrument_key!, selectedExpiry);
      if (res.status === 'success' && res.data) {
        const rowsMap = new Map<number, StrikeRow>();
        const data = Array.isArray(res.data) ? res.data : [];
        if (data.length === 0) setError('EMPTY_CHAIN_RETURNED');
        
        data.forEach((opt: any) => {
          const strike = Number(opt.strike_price);
          const existing = rowsMap.get(strike) || { strike };
          if (opt.option_type === 'CE') existing.ce = opt;
          else existing.pe = opt;
          rowsMap.set(strike, existing);
        });
        const sorted = Array.from(rowsMap.values()).sort((a, b) => a.strike - b.strike);
        setChain(sorted);
      } else {
        setError(res?.errors?.[0]?.message || 'FAILED TO LOAD CHAIN');
      }
    } catch (err) { 
      console.error('Chain error:', err);
      setError('NETWORK_OR_AUTH_ERROR');
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchChain();
  }, [selectedSymbol?.instrument_key, selectedExpiry, accessToken]);

  // Handle Search
  useEffect(() => {
    if (!search.trim() || !accessToken) {
      setSearchResults([]);
      return;
    }
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

  const GreeksCols = ['DELTA', 'THETA', 'IV'];
  const StdCols = ['VOLUME', 'OI CHG', 'OI', 'LTP'];
  const ceCols = [...(showGreeks ? GreeksCols : []), ...StdCols];
  const peCols = [...StdCols, ...(showGreeks ? GreeksCols : [])];

  const renderCell = (opt: OptionData | undefined, col: string, side: 'CE' | 'PE') => {
    if (!opt) return <div key={col} style={{ width: COLUMN_WIDTH, borderRight: BORDER.standard }} />;
    
    const mData = opt.market_data;
    const gData = opt.greeks;
    
    const liveLtp = prices[opt.instrument_key]?.ltp || mData?.ltp || 0;
    const inTheMoney = side === 'CE' ? opt.strike_price < currentSpot : opt.strike_price > currentSpot;
    const isSelected = basket.includes(opt.instrument_key);

    let content: React.ReactNode = null;
    let textColor: string = COLOR.text.primary;

    switch (col) {
      case 'LTP': 
        content = (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: side === 'CE' ? 'flex-end' : 'flex-start' }}>
            <span style={{ fontWeight: 'bold' }}>{Number(liveLtp).toFixed(2)}</span>
            <Change value={mData?.pChange || 0} format="percent" size="xs" />
          </div>
        );
        break;
      case 'OI': content = (mData?.oi || 0).toLocaleString(); textColor = COLOR.text.secondary; break;
      case 'OI CHG': content = <Change value={mData?.oi_change || 0} format="absolute" size="xs" />; break;
      case 'VOLUME': content = (mData?.volume || 0).toLocaleString(); textColor = COLOR.text.muted; break;
      case 'DELTA': content = gData?.delta?.toFixed(2) || '0.00'; break;
      case 'THETA': content = gData?.theta?.toFixed(2) || '0.00'; break;
      case 'IV': content = `${(gData?.iv || 0).toFixed(1)}%`; textColor = COLOR.semantic.info; break;
    }

    return (
      <div 
        key={`${opt.instrument_key}-${col}`}
        className="group relative"
        onClick={() => basketMode && setBasket(prev => prev.includes(opt.instrument_key) ? prev.filter(k => k !== opt.instrument_key) : [...prev, opt.instrument_key])}
        style={{ 
          width: COLUMN_WIDTH, height: '100%', display: 'flex', alignItems: 'center', justifyContent: side === 'CE' ? 'flex-end' : 'flex-start',
          padding: '0 8px', background: isSelected ? `${COLOR.semantic.info}25` : inTheMoney ? 'rgba(255,215,0,0.04)' : 'transparent',
          borderRight: BORDER.standard, fontFamily: TYPE.family.mono, fontSize: '10px', color: textColor, cursor: basketMode ? 'pointer' : 'default',
        }}
      >
        {content}
        {col === 'LTP' && !basketMode && (
          <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-bg-overlay flex items-center justify-center gap-1 z-10">
            <Button variant="buy" size="xs" onClick={(e) => { e.stopPropagation(); setSelectedSymbol({ ticker: opt.ticker, name: opt.ticker, exchange: 'NFO', instrument_key: opt.instrument_key, ltp: liveLtp } as any); setTimeout(() => openOrderModal('BUY'), 0); }}>B</Button>
            <Button variant="sell" size="xs" onClick={(e) => { e.stopPropagation(); setSelectedSymbol({ ticker: opt.ticker, name: opt.ticker, exchange: 'NFO', instrument_key: opt.instrument_key, ltp: liveLtp } as any); setTimeout(() => openOrderModal('SELL'), 0); }}>S</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000000', overflow: 'hidden' }}>
      {/* Toolbar with Search */}
      <div style={{ height: '40px', borderBottom: `1px solid #222222`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: '#000000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <div style={{ position: 'relative', width: '220px' }}>
                <div 
                    onClick={() => setShowSearch(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: '#000000', border: `1px solid #222222`, cursor: 'text' }}
                >
                    <Search size={14} color={COLOR.text.muted} />
                    <span style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 'bold' }}>{isIsin(selectedSymbol?.ticker || '') ? (selectedSymbol?.name || 'SEARCH...') : (selectedSymbol?.ticker || 'SEARCH...')}</span>
                    <Badge label={`₹${currentSpot.toFixed(2)}`} variant="exchange-nse" />
                </div>
                
                <AnimatePresence>
                    {showSearch && (
                        <>
                            <div onClick={() => setShowSearch(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', left: 0, width: '320px', background: COLOR.bg.overlay, border: BORDER.standard, zIndex: 2000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxHeight: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="TICKER OR INDEX..." style={{ width: '100%', background: COLOR.bg.surface, border: 'none', borderBottom: BORDER.standard, padding: '10px', color: '#fff', outline: 'none', fontFamily: TYPE.family.mono }} />
                                <div style={{ overflowY: 'auto' }} className="custom-scrollbar">
                                    {searchResults.map(res => (
                                        <div key={res.instrumentKey} onClick={() => { setSelectedSymbol({ ticker: res.ticker, instrument_key: res.instrumentKey, exchange: res.exchange, name: res.name } as any); setShowSearch(false); setSearch(''); }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }} className="hover:bg-interactive-hover">
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{res.ticker}</span>
                                                <span style={{ fontSize: '9px', color: COLOR.text.muted }}>{res.name}</span>
                                            </div>
                                            <Badge label={res.exchange} variant="exchange-nse" />
                                        </div>
                                    ))}
                                    {isSearching && <div style={{ padding: '12px', textAlign: 'center', fontSize: '10px' }}>SEARCHING...</div>}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            <div style={{ position: 'relative' }}>
                <select value={selectedExpiry} onChange={e => setSelectedExpiry(e.target.value)} style={{ background: COLOR.bg.base, border: BORDER.standard, color: COLOR.text.primary, padding: '2px 8px', fontSize: '11px', fontFamily: TYPE.family.mono, outline: 'none', appearance: 'none', paddingRight: '24px' }}>
                    {expiries.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: COLOR.text.muted }} />
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setBasketMode(!basketMode)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: basketMode ? `${COLOR.semantic.info}22` : 'transparent', border: basketMode ? `1px solid ${COLOR.semantic.info}` : BORDER.standard, color: basketMode ? COLOR.semantic.info : COLOR.text.primary, fontFamily: TYPE.family.mono, fontSize: '10px' }}><ShoppingBag size={12} /> BASKET {basket.length > 0 && `(${basket.length})`}</button>
            <button onClick={() => setShowGreeks(!showGreeks)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: showGreeks ? `${COLOR.semantic.info}22` : 'transparent', border: showGreeks ? `1px solid ${COLOR.semantic.info}` : BORDER.standard, color: showGreeks ? COLOR.semantic.info : COLOR.text.primary, fontFamily: TYPE.family.mono, fontSize: '10px' }}><Sigma size={12} /> GREEKS</button>
            <button onClick={() => fetchChain()} style={{ padding: '6px', border: BORDER.standard, color: COLOR.text.muted }}><RotateCcw size={14} /></button>
            <button style={{ padding: '6px', border: BORDER.standard, color: COLOR.text.muted }}><Settings2 size={14} /></button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '28px', background: COLOR.bg.surface, borderBottom: BORDER.standard, fontSize: '9px', fontWeight: 'bold', color: COLOR.text.muted }}>
          <div ref={ceHeaderRef} onScroll={e => syncScroll(e, [ceBodyRef])} style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', direction: 'rtl' }} className="no-scrollbar">
            <div style={{ display: 'flex', direction: 'ltr' }}>
              {ceCols.map(c => <div key={c} style={{ width: COLUMN_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: BORDER.standard }}>{c}</div>)}
            </div>
          </div>
          <div style={{ width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.bg.elevated, borderRight: BORDER.standard }}>STRIKE</div>
          <div ref={peHeaderRef} onScroll={e => syncScroll(e, [peBodyRef])} style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }} className="no-scrollbar">
            {peCols.map(c => <div key={c} style={{ width: COLUMN_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: BORDER.standard }}>{c}</div>)}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: COLOR.text.muted }}>SYNCING REAL-TIME DATA...</div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: COLOR.semantic.down, fontFamily: TYPE.family.mono, fontSize: '12px' }}>
              <div style={{ color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>DATA UNAVAILABLE</div>
              <div>{error}</div>
              <div style={{ marginTop: '4px', fontSize: '10px', color: COLOR.text.muted }}>KEY: {selectedSymbol?.instrument_key}</div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Button size="xs" onClick={() => fetchChain()}>RETRY FETCH</Button>
                <Button size="xs" onClick={() => setDebug(!debug)}>TOGGLE DEBUG</Button>
              </div>
              {debug && (
                  <pre style={{ marginTop: '20px', textAlign: 'left', background: '#000', padding: '10px', fontSize: '10px', overflowX: 'auto' }}>
                    {JSON.stringify({ selectedSymbol, selectedExpiry, hasToken: !!accessToken }, null, 2)}
                  </pre>
              )}
            </div>
          ) : chain.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: COLOR.text.muted }}>NO DATA AVAILABLE FOR {selectedSymbol?.ticker} @ {selectedExpiry}</div>
          ) : chain.map(row => (
            <div key={row.strike} style={{ display: 'flex', height: ROW_HEIGHT.compact, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div ref={ceBodyRef} onScroll={e => syncScroll(e, [ceHeaderRef])} style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', direction: 'rtl' }} className="no-scrollbar">
                <div style={{ display: 'flex', direction: 'ltr' }}>
                  {ceCols.map(c => renderCell(row.ce, c, 'CE'))}
                </div>
              </div>
              <div style={{ width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', borderRight: `1px solid #222222`, zIndex: 5, fontWeight: 'bold', fontSize: '11px', color: '#FFFFFF', borderLeft: row.strike === Math.round(currentSpot/50)*50 ? `2px solid #FF7722` : 'none' }}>
                {row.strike.toLocaleString()}
              </div>
              <div ref={peBodyRef} onScroll={e => syncScroll(e, [peHeaderRef])} style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }} className="no-scrollbar">
                {peCols.map(c => renderCell(row.pe, c, 'PE'))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {basketMode && basket.length > 0 && (
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} style={{ height: '40px', background: COLOR.semantic.info, color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', fontWeight: 'bold', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><ShoppingBag size={14} /><span>{basket.length} POSITIONS IN BASKET</span></div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setBasket([])} style={{ background: 'transparent', border: '1px solid black', padding: '2px 12px', fontSize: '11px', fontWeight: 'bold' }}>CLEAR</button>
                    <button style={{ background: 'black', color: 'white', border: 'none', padding: '2px 16px', fontSize: '11px', fontWeight: 'bold' }}>EXECUTE STRATEGY</button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
