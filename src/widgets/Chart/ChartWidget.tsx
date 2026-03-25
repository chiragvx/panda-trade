import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData, LineData, HistogramData, CrosshairMode } from 'lightweight-charts';
import { 
  Maximize2, 
  Settings, 
  Layers, 
  Camera, 
  Plus, 
  Minus, 
  Crosshair, 
  MousePointer2, 
  LineChart as LineChartIcon,
  BarChart, 
  Info,
  ChevronDown,
  Calendar,
  Zap,
  TrendingUp,
  Type,
  Bell,
  Split,
  Layout as LayoutIcon,
  Scissors
} from 'lucide-react';
import { useMockTicker, useMockOHLCV } from '../../mock/hooks';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { format } from 'date-fns';

/* ─── HELPERS ───────────────────────────────────────────────── */
const calculateVWAP = (data: CandlestickData[]): LineData[] => {
  let cumulativePV = 0;
  let cumulativeV = 0;
  return data.map(d => {
    const volume = (d as any).volume || 1000;
    const price = ((d.high || 0) + (d.low || 0) + (d.close || 0)) / 3;
    cumulativePV += price * volume;
    cumulativeV += volume;
    return { time: d.time, value: cumulativePV / cumulativeV };
  });
};

const ToolbarIcon = ({ icon: Icon, id, label, active, onClick }: any) => (
  <div className="relative group/tooltip">
    <button 
      onClick={() => onClick?.(id)}
      style={{
        padding: '6px', borderRadius: 0, transition: 'all 80ms linear',
        color: active ? COLOR.semantic.info : COLOR.text.muted,
        background: active ? COLOR.interactive.hover : 'transparent'
      }}
      className="hover:text-text-primary"
    >
      <Icon size={16} />
    </button>
    <div style={{
        position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
        marginLeft: '8px', padding: '3px 6px', background: COLOR.bg.overlay, border: BORDER.standard,
        fontSize: '9px', color: COLOR.text.primary, whiteSpace: 'nowrap',
        opacity: 0, pointerEvents: 'none', zIndex: 100, transition: 'opacity 150ms'
    }} className="group-hover/tooltip:opacity-100 uppercase font-mono tracking-widest">
      {label}
    </div>
  </div>
);

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export const ChartWidget: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const vwapRef = useRef<ISeriesApi<"Line"> | null>(null);
  
  const { selectedSymbol } = useSelectionStore();
  const { accessToken, prices, status } = useUpstoxStore();

  const [timeframe, setTimeframe] = useState<'1minute' | '30minute' | 'day'>('1minute');
  const [liveData, setLiveData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);

  const mockPrice = useMockTicker(selectedSymbol?.ticker || 'RELIANCE');
  const mockOHLCV = useMockOHLCV(selectedSymbol?.ticker || 'RELIANCE');
  
  const currentPrice = selectedSymbol?.instrument_key ? (prices[selectedSymbol.instrument_key]?.ltp || mockPrice) : mockPrice;

  // Fetch Live Data from Upstox if available
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
                const formatted: CandlestickData[] = res.data.candles.map((c: any) => ({
                    time: (c[0] / 1000) as any,
                    open: c[1],
                    high: c[2],
                    low: c[3],
                    close: c[4],
                    volume: c[5]
                })).reverse();
                setLiveData(formatted);
            }
        } catch (err) {
            console.error("Historical fetch failed:", err);
            setLiveData([]);
        } finally {
            setLoading(false);
        }
    };
    fetchLive();
  }, [selectedSymbol, accessToken, timeframe]);

  const ohlcvData = liveData.length > 0 ? liveData : mockOHLCV;

  const [isSplit, setIsSplit] = useState(false);
  const [activeTool, setActiveTool] = useState('cursor');
  const [showVWAP, setShowVWAP] = useState(true);
  const [candlestickInfo, setCandlestickInfo] = useState<CandlestickData | null>(null);

  /* Chart Initialization */
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

    /* VWAP */
    if (showVWAP) {
        const vwapSeries = chart.addLineSeries({
            color: COLOR.semantic.info,
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        vwapSeries.setData(calculateVWAP(ohlcvData as any));
        vwapRef.current = vwapSeries;
    }

    /* Crosshair Move */
    chart.subscribeCrosshairMove(param => {
        if (param.time) {
            const data = param.seriesData.get(candlestickSeries) as CandlestickData;
            setCandlestickInfo(data);
        }
    });

    const handleResize = () => {
      chart.applyOptions({ 
        width: chartContainerRef.current?.clientWidth, 
        height: chartContainerRef.current?.clientHeight 
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedSymbol, ohlcvData, showVWAP]);

  /* Real-time Update */
  useEffect(() => {
    if (seriesRef.current && ohlcvData.length > 0) {
        const last = ohlcvData[ohlcvData.length - 1];
        seriesRef.current.update({
            ...last,
            close: currentPrice,
            high: Math.max(last.high, currentPrice),
            low: Math.min(last.low, currentPrice),
        } as any);
    }
  }, [currentPrice]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface, overflow: 'hidden' }}>
      {/* Bloomberg-Style Dense Header */}
      <div style={{ height: '32px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', background: COLOR.bg.elevated }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{selectedSymbol?.ticker}</span>
                <div style={{ display: 'flex', gap: '2px', marginLeft: '8px', border: BORDER.standard, padding: '1px' }}>
                    {(['1minute', '30minute', 'day'] as const).map(tf => (
                        <button 
                            key={tf} 
                            onClick={() => setTimeframe(tf)} 
                            style={{ 
                                padding: '2px 6px', fontSize: '9px', fontFamily: TYPE.family.mono, cursor: 'pointer',
                                background: timeframe === tf ? COLOR.semantic.info : 'transparent',
                                border: 'none', color: timeframe === tf ? 'black' : COLOR.text.muted,
                                fontWeight: timeframe === tf ? 'bold' : 'normal'
                            }}
                        >
                            {tf === '1minute' ? '1m' : tf === '30minute' ? '30m' : '1d'}
                        </button>
                    ))}
                </div>
            </div>
            
            {(candlestickInfo || ohlcvData[ohlcvData.length-1]) && (
                <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontFamily: TYPE.family.mono }}>
                    {(() => {
                        const d = candlestickInfo || ohlcvData[ohlcvData.length-1];
                        return (
                            <>
                                <span style={{ color: COLOR.text.muted }}>O:<span style={{ color: COLOR.text.primary }}>{d.open.toFixed(2)}</span></span>
                                <span style={{ color: COLOR.text.muted }}>H:<span style={{ color: COLOR.text.primary }}>{d.high.toFixed(2)}</span></span>
                                <span style={{ color: COLOR.text.muted }}>L:<span style={{ color: COLOR.text.primary }}>{d.low.toFixed(2)}</span></span>
                                <span style={{ color: COLOR.text.muted }}>C:<span style={{ color: COLOR.text.primary }}>{d.close.toFixed(2)}</span></span>
                            </>
                        )
                    })()}
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
         {/* Left Drawing Sidebar */}
         <div style={{ width: '32px', borderRight: BORDER.standard, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0', background: COLOR.bg.surface }}>
            <ToolbarIcon icon={MousePointer2} id="cursor" label="Crosshair" active={activeTool === 'cursor'} onClick={setActiveTool} />
            <ToolbarIcon icon={TrendingUp} id="trend" label="Trend Line" active={activeTool === 'trend'} onClick={setActiveTool} />
            <ToolbarIcon icon={Minus} id="horiz" label="Horizontal Ray" active={activeTool === 'horiz'} onClick={setActiveTool} />
            <ToolbarIcon icon={Type} id="text" label="Anchor Text" active={activeTool === 'text'} onClick={setActiveTool} />
            <ToolbarIcon icon={Scissors} id="fib" label="Fib Retracement" active={activeTool === 'fib'} onClick={setActiveTool} />
            <div style={{ flex: 1 }} />
            <ToolbarIcon icon={Camera} label="Take Snapshot" />
         </div>

         {/* Chart Container(s) */}
         <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <div style={{ flex: 1, position: 'relative', borderRight: isSplit ? BORDER.standard : 'none' }}>
                <div ref={chartContainerRef} style={{ position: 'absolute', inset: 0 }} />
                
                {/* Legend Overlay */}
                <div style={{ position: 'absolute', top: '12px', left: '16px', pointerEvents: 'none', zIndex: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{selectedSymbol?.ticker}</span>
                            <div style={{ border: `1px solid ${COLOR.semantic.info}`, padding: '1px 4px', fontSize: '9px', color: COLOR.semantic.info, fontFamily: TYPE.family.mono }}>LIVE</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.lg, color: COLOR.text.primary }}>₹{currentPrice.toFixed(2)}</span>
                            <Change value={selectedSymbol?.changePct || 0} format="percent" size="sm" />
                        </div>
                    </div>
                </div>

                {/* Trading Volume Profile (Pseudo-simulation) */}
                <div style={{ position: 'absolute', right: '40px', top: '10%', bottom: '10%', width: '80px', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '1px', opacity: 0.2 }}>
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} style={{ height: '3px', background: i % 3 === 0 ? COLOR.semantic.up : COLOR.semantic.down, alignSelf: 'flex-end', width: `${Math.random() * 80 + 20}%` }} />
                    ))}
                </div>
            </div>

            {isSplit && (
                <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                     <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <div style={{ textAlign: 'center' }}>
                             <div style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>SECONDARY_VIEW: {selectedSymbol?.ticker} [30M]</div>
                             <div style={{ fontSize: '9px', color: COLOR.semantic.info, marginTop: '4px' }}>INITIALIZING ENGINE...</div>
                         </div>
                     </div>
                </div>
            )}
         </div>
      </div>

      {/* Footer Info */}
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
