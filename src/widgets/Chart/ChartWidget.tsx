import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData, LineData, CrosshairMode } from 'lightweight-charts';
import { Settings, Layers, Camera, Minus, MousePointer2, TrendingUp, Type, Bell, Split, Layout as LayoutIcon, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { useLayoutStore } from '../../store/useStore';
import { upstoxSearch, UpstoxSearchResult } from '../../services/upstoxSearch';
import { AnimatePresence, motion } from 'framer-motion';

const calculateVWAP = (data: CandlestickData[]): LineData[] => {
  let cumulativePV = 0;
  let cumulativeV = 0;
  return data.map((d) => {
    const volume = Number((d as CandlestickData & { volume?: number }).volume || 0);
    const price = ((d.high || 0) + (d.low || 0) + (d.close || 0)) / 3;
    cumulativePV += price * volume;
    cumulativeV += volume;
    return { time: d.time, value: cumulativeV > 0 ? cumulativePV / cumulativeV : 0 };
  });
};

const parseCandleTime = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1e12) return Math.floor(value / 1000);
    if (value > 1e9) return Math.floor(value);
    return null;
  }

  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      if (asNumber > 1e12) return Math.floor(asNumber / 1000);
      if (asNumber > 1e9) return Math.floor(asNumber);
    }

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return Math.floor(parsed / 1000);
    }
  }

  return null;
};

const ToolbarIcon = ({ icon: Icon, id, label, active, onClick }: any) => (
  <div className="relative group/tooltip">
    <button
      onClick={() => onClick?.(id)}
      style={{
        padding: '6px',
        borderRadius: 0,
        transition: 'all 80ms linear',
        color: active ? COLOR.semantic.info : COLOR.text.muted,
        background: active ? COLOR.interactive.hover : 'transparent',
      }}
      className="hover:text-text-primary"
    >
      <Icon size={16} />
    </button>
    <div
      style={{
        position: 'absolute',
        left: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        marginLeft: '8px',
        padding: '3px 6px',
        background: COLOR.bg.overlay,
        border: BORDER.standard,
        fontSize: '9px',
        color: COLOR.text.primary,
        whiteSpace: 'nowrap',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: 100,
        transition: 'opacity 150ms',
      }}
      className="group-hover/tooltip:opacity-100 uppercase font-mono tracking-widest"
    >
      {label}
    </div>
  </div>
);

export const ChartWidget: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const vwapRef = useRef<ISeriesApi<'Line'> | null>(null);

  const { selectedSymbol } = useSelectionStore();
  const { accessToken, prices } = useUpstoxStore();
  const { openOrderModal } = useLayoutStore();

  const [timeframe, setTimeframe] = useState<'1minute' | '30minute' | 'day'>('1minute');
  const [liveData, setLiveData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [activeTool, setActiveTool] = useState('cursor');
  const [showVWAP, setShowVWAP] = useState(true);
  const [candlestickInfo, setCandlestickInfo] = useState<CandlestickData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UpstoxSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const liveFeed = selectedSymbol?.instrument_key ? prices[selectedSymbol.instrument_key] : undefined;
  const currentPrice = selectedSymbol?.instrument_key
    ? Number(liveFeed?.ltp ?? selectedSymbol?.ltp ?? 0)
    : Number(selectedSymbol?.ltp ?? 0);
  const liveChangePct = Number(liveFeed?.pChange ?? selectedSymbol?.changePct ?? 0);
  const { setSelectedSymbol } = useSelectionStore();
  const { setInstrumentMeta } = useUpstoxStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
        return;
      }

      if (showSearch) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(searchResults.length - 1, prev + 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === 'Enter') {
          const selected = searchResults[selectedIndex];
          if (selected) {
            handleSelectSymbol(selected);
          }
        }
        return;
      }

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.hasAttribute('contenteditable'))) {
        return;
      }

      // '/' to open search
      if (e.key === '/') {
        e.preventDefault();
        setShowSearch(true);
      }
      
      // Just start typing to search
      if (/^[a-z0-9]$/i.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setShowSearch(true);
        setSearchQuery(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, searchResults, selectedIndex]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleSelectSymbol = (res: UpstoxSearchResult) => {
    setInstrumentMeta({
      [res.instrumentKey]: {
        ticker: res.ticker,
        name: res.name,
        exchange: res.exchange,
      },
    });
    
    // Create a SymbolData roughly - it'll get updated via prices
    setSelectedSymbol({
      ticker: res.ticker,
      name: res.name,
      exchange: res.exchange,
      instrument_key: res.instrumentKey,
      ltp: 0,
      change: 0,
      changePct: 0,
      volume: 0,
      open: 0,
      high: 0,
      low: 0,
      close: 0,
    });
    
    setShowSearch(false);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!searchQuery.trim() || !accessToken) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const hits = await upstoxSearch.searchSymbols(accessToken, searchQuery);
        setSearchResults(hits);
        setSelectedIndex(0);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, accessToken]);

  useEffect(() => {
    const fetchLive = async () => {
      if (!accessToken || !selectedSymbol?.instrument_key) {
        setLiveData([]);
        return;
      }

      setLoading(true);
      try {
        const toDate = format(new Date(), 'yyyy-MM-dd');
        const fromDate = format(new Date(Date.now() - (timeframe === 'day' ? 365 : 7) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        const res = await upstoxApi.getHistoricalData(accessToken, selectedSymbol.instrument_key, timeframe, fromDate, toDate);
        if (res.status === 'success' && res.data?.candles) {
          const mapped = (res.data.candles as any[])
            .map((c: any) => {
              const time = parseCandleTime(c?.[0]);
              const open = Number(c?.[1]);
              const high = Number(c?.[2]);
              const low = Number(c?.[3]);
              const close = Number(c?.[4]);
              const volume = Number(c?.[5] ?? 0);

              if (
                time === null ||
                !Number.isFinite(open) ||
                !Number.isFinite(high) ||
                !Number.isFinite(low) ||
                !Number.isFinite(close)
              ) {
                return null;
              }

              return {
                time: time as any,
                open,
                high,
                low,
                close,
                volume: Number.isFinite(volume) ? volume : 0,
              } as CandlestickData;
            })
            .filter((row): row is CandlestickData => row !== null)
            .sort((a, b) => Number(a.time) - Number(b.time));

          const byTime = new Map<number, CandlestickData>();
          mapped.forEach((row) => {
            byTime.set(Number(row.time), row);
          });

          setLiveData(Array.from(byTime.values()));
        } else {
          setLiveData([]);
        }
      } catch (err) {
        console.error('Historical fetch failed:', err);
        setLiveData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLive();
  }, [selectedSymbol, accessToken, timeframe]);

  const ohlcvData = liveData;

  const volumeProfile = useMemo(() => {
    if (ohlcvData.length === 0) return [];
    const recent = ohlcvData.slice(-40);
    const maxVol = Math.max(
      ...recent.map((bar) => Number((bar as CandlestickData & { volume?: number }).volume || 0)),
      1
    );
    return recent.map((bar, i) => ({
      id: i,
      width: (Number((bar as CandlestickData & { volume?: number }).volume || 0) / maxVol) * 100,
      color: bar.close >= bar.open ? COLOR.semantic.up : COLOR.semantic.down,
    }));
  }, [ohlcvData]);

  useEffect(() => {
    if (!chartContainerRef.current || ohlcvData.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: COLOR.text.muted,
        fontSize: 10,
        fontFamily: TYPE.family.mono,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderColor: COLOR.bg.border,
        autoScale: true,
        alignLabels: true,
      },
      timeScale: {
        borderColor: COLOR.bg.border,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: COLOR.semantic.info, width: 1, style: 2, labelBackgroundColor: COLOR.semantic.info },
        horzLine: { color: COLOR.semantic.info, width: 1, style: 2, labelBackgroundColor: COLOR.semantic.info },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: COLOR.semantic.up,
      downColor: COLOR.semantic.down,
      borderVisible: false,
      wickUpColor: COLOR.semantic.up,
      wickDownColor: COLOR.semantic.down,
    });

    candlestickSeries.setData(ohlcvData as any);
    seriesRef.current = candlestickSeries;
    chartRef.current = chart;

    if (showVWAP) {
      const vwapSeries = chart.addLineSeries({
        color: COLOR.semantic.info,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      vwapSeries.setData(calculateVWAP(ohlcvData));
      vwapRef.current = vwapSeries;
    }

    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const data = param.seriesData.get(candlestickSeries) as CandlestickData | undefined;
        setCandlestickInfo(data || null);
      }
    });

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth,
        height: chartContainerRef.current?.clientHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [ohlcvData, showVWAP]);

  useEffect(() => {
    if (!seriesRef.current || ohlcvData.length === 0) return;
    const last = ohlcvData[ohlcvData.length - 1];
    seriesRef.current.update({
      ...last,
      close: currentPrice,
      high: Math.max(last.high, currentPrice),
      low: Math.min(last.low, currentPrice),
    } as any);
  }, [currentPrice, ohlcvData]);

  const lastCandle = candlestickInfo || ohlcvData[ohlcvData.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface, overflow: 'hidden' }}>
      <div style={{ height: '32px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', background: COLOR.bg.elevated }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>
              {selectedSymbol?.ticker || '--'}
            </span>
            <div style={{ display: 'flex', gap: '2px', marginLeft: '8px', border: BORDER.standard, padding: '1px' }}>
              {(['1minute', '30minute', 'day'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontFamily: TYPE.family.mono,
                    cursor: 'pointer',
                    background: timeframe === tf ? COLOR.semantic.info : 'transparent',
                    border: 'none',
                    color: timeframe === tf ? 'black' : COLOR.text.muted,
                    fontWeight: timeframe === tf ? 'bold' : 'normal',
                  }}
                >
                  {tf === '1minute' ? '1m' : tf === '30minute' ? '30m' : '1d'}
                </button>
              ))}
            </div>
          </div>

          {lastCandle && (
            <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontFamily: TYPE.family.mono }}>
              <span style={{ color: COLOR.text.muted }}>O:<span style={{ color: COLOR.text.primary }}>{lastCandle.open.toFixed(2)}</span></span>
              <span style={{ color: COLOR.text.muted }}>H:<span style={{ color: COLOR.text.primary }}>{lastCandle.high.toFixed(2)}</span></span>
              <span style={{ color: COLOR.text.muted }}>L:<span style={{ color: COLOR.text.primary }}>{lastCandle.low.toFixed(2)}</span></span>
              <span style={{ color: COLOR.text.muted }}>C:<span style={{ color: COLOR.text.primary }}>{lastCandle.close.toFixed(2)}</span></span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {loading && <div style={{ fontSize: '9px', color: COLOR.semantic.info, marginRight: '8px', animation: 'pulse 1s infinite' }}>SYNCING...</div>}
          <ToolbarIcon icon={Split} label="Split View" active={isSplit} onClick={() => setIsSplit(!isSplit)} />
          <div style={{ width: '1px', height: '16px', background: COLOR.bg.border, margin: '0 4px' }} />
          <ToolbarIcon icon={Layers} label="Indicators" onClick={() => setShowVWAP(!showVWAP)} active={showVWAP} />
          <ToolbarIcon icon={Bell} label="Set Alert" />
          <ToolbarIcon icon={LayoutIcon} label="Save Layout" />
          <ToolbarIcon icon={Settings} label="Settings" />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <div style={{ width: '32px', borderRight: BORDER.standard, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0', background: COLOR.bg.surface }}>
          <ToolbarIcon icon={MousePointer2} id="cursor" label="Crosshair" active={activeTool === 'cursor'} onClick={setActiveTool} />
          <ToolbarIcon icon={TrendingUp} id="trend" label="Trend Line" active={activeTool === 'trend'} onClick={setActiveTool} />
          <ToolbarIcon icon={Minus} id="horiz" label="Horizontal Ray" active={activeTool === 'horiz'} onClick={setActiveTool} />
          <ToolbarIcon icon={Type} id="text" label="Anchor Text" active={activeTool === 'text'} onClick={setActiveTool} />
          <ToolbarIcon icon={Scissors} id="fib" label="Fib Retracement" active={activeTool === 'fib'} onClick={setActiveTool} />
          <div style={{ flex: 1 }} />
          <ToolbarIcon icon={Camera} label="Take Snapshot" />
        </div>

        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          <div style={{ flex: 1, position: 'relative', borderRight: isSplit ? BORDER.standard : 'none' }}>
            <div ref={chartContainerRef} style={{ position: 'absolute', inset: 0 }} />

            <div style={{ position: 'absolute', top: '12px', left: '16px', pointerEvents: 'none', zIndex: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>
                    {selectedSymbol?.ticker || '--'}
                  </span>
                  <div style={{ border: `1px solid ${COLOR.semantic.info}`, padding: '1px 4px', fontSize: '9px', color: COLOR.semantic.info, fontFamily: TYPE.family.mono }}>LIVE</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.lg, color: COLOR.text.primary }}>₹{currentPrice.toFixed(2)}</span>
                  <Change value={liveChangePct} format="percent" size="sm" />
                </div>
                {selectedSymbol && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', pointerEvents: 'auto' }}>
                    <Button 
                      variant="buy" 
                      size="xs" 
                      onClick={() => openOrderModal('BUY')}
                      style={{ padding: '2px 12px', fontWeight: 'bold' }}
                    >
                      BUY
                    </Button>
                    <Button 
                      variant="sell" 
                      size="xs" 
                      onClick={() => openOrderModal('SELL')}
                      style={{ padding: '2px 12px', fontWeight: 'bold' }}
                    >
                      SELL
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ position: 'absolute', right: '40px', top: '10%', bottom: '10%', width: '80px', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '1px', opacity: 0.2 }}>
              {volumeProfile.map((row) => (
                <div key={row.id} style={{ height: '3px', background: row.color, alignSelf: 'flex-end', width: `${row.width}%` }} />
              ))}
            </div>

            {ohlcvData.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>NO HISTORICAL DATA</div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{
                  position: 'absolute',
                  top: '50px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '320px',
                  background: COLOR.bg.overlay,
                  border: BORDER.standard,
                  zIndex: 200,
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ padding: '8px', borderBottom: BORDER.standard }}>
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search instrument..."
                    style={{
                      width: '100%',
                      background: COLOR.bg.surface,
                      border: BORDER.standard,
                      padding: '6px 10px',
                      color: COLOR.text.primary,
                      fontFamily: TYPE.family.mono,
                      fontSize: TYPE.size.sm,
                      outline: 'none',
                    }}
                  />
                  {isSearching && <div style={{ fontSize: '9px', color: COLOR.semantic.info, marginTop: '4px', textTransform: 'uppercase' }}>Searching...</div>}
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {searchResults.map((res, idx) => (
                    <div
                      key={res.instrumentKey}
                      onClick={() => handleSelectSymbol(res)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        background: idx === selectedIndex ? COLOR.interactive.selected : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: 'bold' }}>{res.ticker}</span>
                        <span style={{ fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase' }}>{res.name}</span>
                      </div>
                      <span style={{ fontSize: '8px', padding: '1px 4px', border: BORDER.standard, color: COLOR.text.muted }}>{res.exchange}</span>
                    </div>
                  ))}
                  {!isSearching && searchQuery.length > 1 && searchResults.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '10px', color: COLOR.text.muted }}>NO RESULTS FOUND</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div style={{ height: '22px', borderTop: BORDER.standard, background: COLOR.bg.elevated, display: 'flex', alignItems: 'center', padding: '0 8px', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLOR.semantic.up }} />
          <span style={{ fontFamily: TYPE.family.mono, fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase' }}>Connected</span>
        </div>
        <span style={{ fontFamily: TYPE.family.mono, fontSize: '9px', color: COLOR.text.muted }}>UTC+5:30</span>
      </div>
    </div>
  );
};
