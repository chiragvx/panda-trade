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
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';

/* ─── HELPERS ───────────────────────────────────────────────── */
const calculateVWAP = (data: CandlestickData[]): LineData[] => {
  let cumulativePV = 0;
  let cumulativeV = 0;
  return data.map(d => {
    const volume = (d as any).volume || 1000;
    const price = (d.high + d.low + d.close) / 3;
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
  const currentPrice = useMockTicker(selectedSymbol?.ticker || 'RELIANCE');
  const ohlcvData = useMockOHLCV(selectedSymbol?.ticker || 'RELIANCE');
  
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{selectedSymbol?.ticker}</span>
                <span style={{ fontFamily: TYPE.family.mono, fontSize: '10px', color: COLOR.text.muted }}>1m</span>
                <ChevronDown size={12} color={COLOR.text.muted} />
            </div>
            
            {candlestickInfo && (
                <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontFamily: TYPE.family.mono }}>
                    <span style={{ color: COLOR.text.muted }}>O:<span style={{ color: COLOR.text.primary }}>{candlestickInfo.open.toFixed(2)}</span></span>
                    <span style={{ color: COLOR.text.muted }}>H:<span style={{ color: COLOR.text.primary }}>{candlestickInfo.high.toFixed(2)}</span></span>
                    <span style={{ color: COLOR.text.muted }}>L:<span style={{ color: COLOR.text.primary }}>{candlestickInfo.low.toFixed(2)}</span></span>
                    <span style={{ color: COLOR.text.muted }}>C:<span style={{ color: COLOR.text.primary }}>{candlestickInfo.close.toFixed(2)}</span></span>
                </div>
            )}
         </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

         {/* Chart Container */}
         <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
            <div style={{ position: 'absolute', right: '50px', top: '20%', bottom: '20%', width: '100px', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '2px', opacity: 0.15 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} style={{ height: '4px', background: i % 3 === 0 ? COLOR.semantic.up : COLOR.semantic.down, alignSelf: 'flex-end', width: `${Math.random() * 100}%` }} />
                ))}
            </div>
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
