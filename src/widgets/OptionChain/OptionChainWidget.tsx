import React, { useState, useEffect, useMemo } from 'react';
import { NIFTY_50 } from '../../utils/defaultSymbol';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { upstoxApi } from '../../services/upstoxApi';
import { upstoxSearch, UpstoxSearchResult } from '../../services/upstoxSearch';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';
import { Badge } from '../../ds/components/Badge';
import { Select } from '../../ds';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { DataTable } from '../../ds/components/DataTable';
import { HoverActions } from '../../ds/components/HoverActions';
import { SegmentedControl } from '../../ds/components/SegmentedControl';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Sigma, ShoppingBag, RotateCcw } from 'lucide-react';
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

export const OptionChainWidget: React.FC = () => {
  const { accessToken, prices } = useUpstoxStore();
  const { selectedSymbol, setSelectedSymbol } = useSelectionStore();
  const { openOrderModal } = useLayoutStore();

  const [expiries, setExpiries] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [chain, setChain] = useState<StrikeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentRootKey, setCurrentRootKey] = useState<string>('');
  const [localKey, setLocalKey] = useState<string | null>(null);
  const [localTicker, setLocalTicker] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UpstoxSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Redesign state
  const [optionType, setOptionType] = useState<'CE'|'PE'>('CE');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [showGreeks, setShowGreeks] = useState(false);
  const [basketMode, setBasketMode] = useState(false);
  const [basket, setBasket] = useState<string[]>([]);

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
    if (!accessToken) return;
    
    const targetKey = localKey || selectedSymbol?.instrument_key || NIFTY_50.instrument_key;
    
    if (targetKey) {
      const isOption = selectedSymbol?.exchange === 'NFO' || isIsin(targetKey);
      if (!isOption && targetKey !== currentRootKey) {
        setCurrentRootKey(targetKey);
        loadOptionChain(targetKey);
      }
    } else if (!currentRootKey) {
        const defaultKey = 'NSE_INDEX|Nifty 50';
        setCurrentRootKey(defaultKey);
        loadOptionChain(defaultKey);
    }
  }, [selectedSymbol?.instrument_key, localKey, accessToken, currentRootKey]);

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

  const currentSpot = prices[localKey || selectedSymbol?.instrument_key || '']?.ltp || selectedSymbol?.ltp || chain[0]?.spot || 0;

  const atmStrike = useMemo(() => {
    if (!chain.length || currentSpot === 0) return null;
    return chain.reduce((prev, curr) => 
      Math.abs(curr.strike - currentSpot) < Math.abs(prev.strike - currentSpot) ? curr : prev
    ).strike;
  }, [chain, currentSpot]);

  const columns = useMemo(() => {
    const baseCols: any[] = [
      {
          key: 'strike',
          label: 'STRIKE',
          width: 80,
          render: (val: number) => {
              const isAtm = val === atmStrike;
              return (
                <span style={{ 
                    fontWeight: TYPE.weight.black, 
                    fontFamily: TYPE.family.mono,
                    color: isAtm ? COLOR.text.primary : COLOR.text.secondary
                }}>
                  {val.toLocaleString()}
                </span>
              );
          }
      },
      {
          key: 'ltp',
          label: 'LTP',
          align: 'right' as const,
          width: 90,
          render: (_: any, item: StrikeRow) => {
              const opt = optionType === 'CE' ? item.ce : item.pe;
              const liveLtp = prices[opt?.instrument_key || '']?.ltp || opt?.market_data?.ltp || 0;
              return <Price value={liveLtp} size="sm" />;
          }
      },
      {
          key: 'change',
          label: 'CHG',
          align: 'right' as const,
          width: 80,
          render: (_: any, item: StrikeRow) => {
              const opt = optionType === 'CE' ? item.ce : item.pe;
              const chg = opt?.market_data?.pChange || 0;
              return <Change value={chg} format="percent" size="sm" />;
          }
      }
    ];

    if (showGreeks) {
      baseCols.push(
        {
          key: 'iv',
          label: 'IV',
          align: 'right' as const,
          width: 70,
          render: (_: any, item: StrikeRow) => {
            const opt = optionType === 'CE' ? item.ce : item.pe;
            return <span style={{ color: COLOR.semantic.info, fontSize: '11px' }}>{(opt?.option_greeks?.iv || 0).toFixed(1)}%</span>;
          }
        },
        {
          key: 'delta',
          label: 'DELTA',
          align: 'right' as const,
          width: 70,
          render: (_: any, item: StrikeRow) => {
            const opt = optionType === 'CE' ? item.ce : item.pe;
            return <span style={{ color: COLOR.text.secondary, fontSize: '11px' }}>{(opt?.option_greeks?.delta || 0).toFixed(2)}</span>;
          }
        },
        {
          key: 'theta',
          label: 'THETA',
          align: 'right' as const,
          width: 70,
          render: (_: any, item: StrikeRow) => {
            const opt = optionType === 'CE' ? item.ce : item.pe;
            return <span style={{ color: COLOR.text.secondary, fontSize: '11px' }}>{(opt?.option_greeks?.theta || 0).toFixed(2)}</span>;
          }
        }
      );
    }

    baseCols.push(
      {
          key: 'volume',
          label: 'VOL',
          align: 'right' as const,
          width: 80,
          render: (_: any, item: StrikeRow) => {
              const opt = optionType === 'CE' ? item.ce : item.pe;
              const vol = opt?.market_data?.volume || 0;
              return (
                <span style={{ fontSize: '11px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>
                  {vol > 1000000 ? `${(vol / 1000000).toFixed(1)}M` : vol > 1000 ? `${(vol / 1000).toFixed(1)}K` : vol}
                </span>
              );
          }
      },
      {
          key: 'oi',
          label: 'OI',
          align: 'right' as const,
          width: 90,
          render: (_: any, item: StrikeRow) => {
              const opt = optionType === 'CE' ? item.ce : item.pe;
              const oi = opt?.market_data?.oi || 0;
              return <span style={{ fontWeight: TYPE.weight.bold, fontSize: '11px', color: COLOR.text.secondary }}>{oi.toLocaleString()}</span>;
          }
      },
      {
          key: 'oi_chg',
          label: 'OI CHG',
          align: 'right' as const,
          width: 90,
          render: (_: any, item: StrikeRow) => {
              const opt = optionType === 'CE' ? item.ce : item.pe;
              const mData = opt?.market_data;
              const val = (mData?.oi || 0) - (mData?.prev_oi || 0);
              return <Change value={val} format="absolute" size="sm" />;
          }
      },
      {
          key: 'actions',
          label: '',
          width: 200,
          align: 'right' as const,
          render: (_: any, item: StrikeRow, index: number) => {
              const opt = optionType === 'CE' ? item.ce : item.pe;
              const liveLtp = prices[opt?.instrument_key || '']?.ltp || opt?.market_data?.ltp || 0;
              
              if (!opt) return null;

              if (basketMode) {
                const isSelected = basket.includes(opt.instrument_key);
                return (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setBasket(prev => isSelected ? prev.filter(k => k !== opt.instrument_key) : [...prev, opt.instrument_key]);
                    }}
                    style={{
                      background: isSelected ? COLOR.semantic.info : 'transparent',
                      border: `1px solid ${COLOR.semantic.info}`,
                      color: isSelected ? COLOR.text.inverse : COLOR.semantic.info,
                      padding: '2px 10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    {isSelected ? 'ADDED' : 'ADD'}
                  </button>
                );
              }

              return (
                  <HoverActions 
                      isVisible={hoveredRow === index}
                      position="sticky"
                      onBuy={() => { 
                          setSelectedSymbol({ ticker: selectedSymbol?.ticker || '', name: selectedSymbol?.name || '', exchange: 'NFO', instrument_key: opt.instrument_key, ltp: liveLtp } as any); 
                          setTimeout(() => openOrderModal('BUY'), 0); 
                      }}
                      onSell={() => { 
                          setSelectedSymbol({ ticker: selectedSymbol?.ticker || '', name: selectedSymbol?.name || '', exchange: 'NFO', instrument_key: opt.instrument_key, ltp: liveLtp } as any); 
                          setTimeout(() => openOrderModal('SELL'), 0); 
                      }}
                      onChart={() => {
                        setSelectedSymbol({ ticker: selectedSymbol?.ticker || '', name: selectedSymbol?.name || '', exchange: 'NFO', instrument_key: opt.instrument_key, ltp: liveLtp } as any); 
                        (window as any).targetWidget?.('chart');
                      }}
                  />
              );
          }
      }
    );

    return baseCols;
  }, [optionType, hoveredRow, prices, currentSpot, atmStrike, selectedSymbol, setSelectedSymbol, openOrderModal, showGreeks, basketMode, basket]);

  return (
    <WidgetShell>
        <WidgetShell.Toolbar height="32px" style={{ padding: 0, gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, height: '100%' }}>
                <SegmentedControl 
                    options={[
                        { label: 'CALLS', value: 'CE' },
                        { label: 'PUTS', value: 'PE' }
                    ]}
                    value={optionType}
                    onChange={(val) => setOptionType(val as 'CE' | 'PE')}
                    size="sm"
                    style={{ height: '100%', borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}
                />

                <div style={{ position: 'relative', height: '100%' }}>
                    <div onClick={() => setShowSearch(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', background: COLOR.bg.surface, borderRight: BORDER.standard, cursor: 'text', height: '100%', minWidth: '180px' }}>
                        <Search size={12} style={{ color: COLOR.text.muted }} />
                        <span style={{ fontSize: '11px', color: COLOR.text.primary, fontWeight: TYPE.weight.bold, letterSpacing: TYPE.letterSpacing.caps }}>
                            {localTicker || selectedSymbol?.ticker || 'SEARCH...'}
                        </span>
                        <Price value={currentSpot} size="xs" color="info" />
                    </div>
                    <AnimatePresence>{showSearch && (
                        <>
                            <div onClick={() => setShowSearch(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', left: 0, width: '320px', background: COLOR.bg.overlay, border: BORDER.standard, zIndex: 2000 }}>
                                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="TICKER OR INDEX..." style={{ width: '100%', background: COLOR.bg.surface, border: 'none', borderBottom: BORDER.standard, padding: '10px', color: '#fff', outline: 'none' }} />
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {searchResults.map(res => (
                                        <div key={res.instrumentKey} onClick={() => { 
                                            setLocalKey(res.instrumentKey); 
                                            setLocalTicker(res.ticker);
                                            setSearch(''); 
                                            setShowSearch(false);
                                        }} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box' }} className="hover:bg-interactive-hover transition-colors">
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: TYPE.weight.black, fontSize: TYPE.size.xs }}>{res.ticker}</span>
                                                {res.name && res.name !== res.ticker && (
                                                  <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>{res.name}</span>
                                                )}
                                            </div>
                                            <Badge label={res.exchange} variant="exchange-nse" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}</AnimatePresence>
                </div>

                <Select 
                    value={selectedExpiry} 
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleExpiryChange(e.target.value)} 
                    disabled={expiryLoading || expiries.length === 0}
                    selectSize="sm"
                    style={{ height: '32px', border: 'none', borderRight: BORDER.standard }}
                >
                    {expiryLoading ? <option>LOADING...</option> : expiries.length === 0 ? <option>NO_EXPIRY</option> : expiries.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </Select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: '100%' }}>
                <button 
                  onClick={() => setBasketMode(!basketMode)} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', height: '100%', padding: '0 12px', 
                    background: basketMode ? `${COLOR.semantic.info}22` : 'transparent', 
                    border: 'none',
                    borderLeft: BORDER.standard, 
                    color: basketMode ? COLOR.semantic.info : COLOR.text.primary, 
                    fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, cursor: 'pointer', outline: 'none'
                  }}
                >
                  <ShoppingBag size={12} /> BASKET ({basket.length})
                </button>
                <button 
                  onClick={() => setShowGreeks(!showGreeks)} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', height: '100%', padding: '0 12px', 
                    background: showGreeks ? `${COLOR.semantic.info}22` : 'transparent', 
                    border: 'none',
                    borderLeft: BORDER.standard, 
                    color: showGreeks ? COLOR.semantic.info : COLOR.text.primary, 
                    fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, cursor: 'pointer', outline: 'none'
                  }}
                >
                  <Sigma size={12} /> GREEKS
                </button>
                <button 
                  onClick={() => currentRootKey && fetchChain(currentRootKey, selectedExpiry)} 
                  style={{ height: '100%', padding: '0 12px', border: 'none', borderLeft: BORDER.standard, color: COLOR.text.muted, cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', outline: 'none' }}
                >
                  <RotateCcw size={12} className={(loading || expiryLoading) ? 'animate-spin' : ''} />
                </button>
            </div>
        </WidgetShell.Toolbar>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <DataTable 
                data={chain}
                columns={columns}
                rowHeight="compact"
                stickyFirstColumn={true}
                stickyLastColumn={true}
                onRowMouseEnter={(_, idx) => setHoveredRow(idx)}
                onRowMouseLeave={() => setHoveredRow(null)}
                getRowStyle={(item) => {
                    const isAtm = item.strike === atmStrike;
                    const inTheMoney = optionType === 'CE' ? item.strike < currentSpot : item.strike > currentSpot;
                    
                    const style: React.CSSProperties = {};
                    
                    if (inTheMoney) {
                        style.background = `${COLOR.semantic.warning}0B`;
                    }
                    
                    if (isAtm) {
                        style.borderTop = `1px solid ${COLOR.semantic.info}`;
                        style.borderBottom = `1px solid ${COLOR.semantic.info}`;
                    }
                    
                    return style;
                }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            />
        </div>

        {basketMode && basket.length > 0 && (
            <div style={{ height: '32px', background: COLOR.semantic.info, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', zIndex: 100, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                  <ShoppingBag size={14} />
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{basket.length} POSITIONS IN BASKET</span>
                </div>
                <div style={{ display: 'flex', gap: '1px' }}>
                    <button 
                      onClick={() => setBasket([])} 
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', height: '24px', padding: '0 12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      CLEAR
                    </button>
                    <button 
                      style={{ background: '#fff', color: COLOR.semantic.info, border: 'none', height: '24px', padding: '0 16px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      EXECUTE
                    </button>
                </div>
            </div>
        )}
    </WidgetShell>
  );
};
