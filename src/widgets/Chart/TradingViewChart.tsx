import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ColorType, ISeriesApi, PriceScaleMode } from 'lightweight-charts';
import { COLOR, TYPE } from '../../ds/tokens';
import { useContextMenuStore } from '../../store/useContextMenuStore';
import { Copy, Pencil, Minus, Square, Type, Circle } from 'lucide-react';

interface ComparisonSeriesData {
  id: string;
  ticker: string;
  data: any[];
}

interface IndicatorSeriesData {
  id: string;
  type: string;
  lines: { 
    id: string; 
    data: any[]; 
    color: string; 
    type?: 'line' | 'histogram';
    lineStyle?: number;
  }[];
  pane?: 'main' | 'own';
}

interface TradingViewChartProps {
  data: any[]; // OHLCV
  volumeData?: any[]; // { time, value, color }
  comparisonData?: ComparisonSeriesData[];
  indicators?: IndicatorSeriesData[];
  isLoading?: boolean;
  chartType: 'candle' | 'line';
}

/**
 * TradingViewChart — native high-performance canvas chart.
 * - Supports OVERLAID comparison mode.
 * - Supports Volume Histograms (separate scale).
 * - Supports Dynamic Indicators (SMA, EMA, RSI).
 */
export const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  data, 
  volumeData = [],
  comparisonData = [], 
  indicators = [],
  isLoading, 
  chartType 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const compareSeriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const indicatorSeriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  
  const { openContextMenu } = useContextMenuStore();
  const [lastPriceUnderCursor, setLastPriceUnderCursor] = useState<number | null>(null);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: COLOR.bg.base },
        textColor: COLOR.text.muted,
        fontFamily: 'JetBrains Mono, Inter, system-ui',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.07)', style: 1 }, // Dashed
        horzLines: { color: 'rgba(255, 255, 255, 0.07)', style: 1 }, // Dashed
      },
      width: chartContainerRef.current.clientWidth || 600,
      height: chartContainerRef.current.clientHeight || 400,
      localization: {
          timeFormatter: (time: any) => {
              const ts = typeof time === 'number' ? time : (time as any).timestamp;
              const date = new Date(ts * 1000);
              return date.toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  hour: '2-digit', minute: '2-digit', hour12: false,
                  day: '2-digit', month: 'short'
              });
          },
      },
      timeScale: {
        borderColor: COLOR.bg.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        shiftVisibleRangeOnNewBar: false,
        tickMarkFormatter: (time: any) => {
            const date = new Date(time * 1000);
            return date.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit', minute: '2-digit', hour12: false
            });
        },
      },
      rightPriceScale: {
        borderColor: COLOR.bg.border,
        autoScale: true,
      },
      leftPriceScale: {
        borderColor: COLOR.bg.border,
        visible: false, // For oscillators or secondary data
      },
      crosshair: {
        mode: 0,
        vertLine: { labelBackgroundColor: COLOR.semantic.info, labelVisible: true },
        horzLine: { labelBackgroundColor: COLOR.semantic.info, labelVisible: true },
      },
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(entries => {
        if (entries[0] && chartRef.current) {
            const { width, height } = entries[0].contentRect;
            chartRef.current.applyOptions({ width, height });
        }
    });
    resizeObserver.observe(chartContainerRef.current);

    chart.subscribeCrosshairMove((param) => {
        let price = null;
        if (param.point && param.seriesData) {
            if (candlestickSeriesRef.current) {
                const d = param.seriesData.get(candlestickSeriesRef.current) as any;
                if (d) price = d.close;
            }
        }
        setLastPriceUnderCursor(price);
    });

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Handle All Data Series (Main, Volume, Compare, Indicators)
  useEffect(() => {
     if (!chartRef.current) return;
     const chart = chartRef.current;
     const isComparing = (comparisonData && comparisonData.length > 0) || (indicators && indicators.some(i => i.pane === 'own'));

     // Switch to Percentage Scaling when comparing or multiple panes
     chart.priceScale('right').applyOptions({
         mode: isComparing ? PriceScaleMode.Percentage : PriceScaleMode.Normal
     });

     // 1. Candlestick / Area
     try {
       if (candlestickSeriesRef.current) { chart.removeSeries(candlestickSeriesRef.current); candlestickSeriesRef.current = null; }
       if (areaSeriesRef.current) { chart.removeSeries(areaSeriesRef.current); areaSeriesRef.current = null; }
     } catch (e) {}

     if (chartType === 'candle') {
        const series = chart.addCandlestickSeries({
            upColor: COLOR.semantic.up,
            downColor: COLOR.semantic.down,
            wickUpColor: COLOR.semantic.up,
            wickDownColor: COLOR.semantic.down,
            borderVisible: false,
        });
        candlestickSeriesRef.current = series;
        if (data && data.length > 0) series.setData(data);
     } else {
        const series = chart.addAreaSeries({
            lineColor: COLOR.semantic.info,
            topColor: `${COLOR.semantic.info}33`,
            bottomColor: 'transparent',
            lineWidth: 2,
        });
        areaSeriesRef.current = series;
        if (data && data.length > 0) series.setData(data.map(d => ({ time: d.time, value: d.close })));
     }

     // 2. Volume
     if (volumeSeriesRef.current) {
         try { chart.removeSeries(volumeSeriesRef.current); } catch (e) {}
         volumeSeriesRef.current = null;
     }
     if (volumeData && volumeData.length > 0) {
         const vSeries = chart.addHistogramSeries({
             color: '#26a69a',
             priceFormat: { type: 'volume' },
             priceScaleId: 'volume', // Hidden overlay scale
         });
         chart.priceScale('volume').applyOptions({
             scaleMargins: { top: 0.8, bottom: 0 },
         });
         vSeries.setData(volumeData);
         volumeSeriesRef.current = vSeries;
     }

     // 3. Comparisons
     compareSeriesRefs.current.forEach(s => { try { chart.removeSeries(s); } catch (e) {} });
     compareSeriesRefs.current.clear();
     comparisonData.forEach((cd, idx) => {
         const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981'];
         const series = chart.addLineSeries({ color: colors[idx % colors.length], lineWidth: 2, title: cd.ticker });
         series.setData(cd.data.map(d => ({ time: d.time, value: d.close })));
         compareSeriesRefs.current.set(cd.id, series);
     });

     // 4. Indicators
     indicatorSeriesRefs.current.forEach(s => { try { chart.removeSeries(s); } catch (e) {} });
     indicatorSeriesRefs.current.clear();

     indicators.forEach(ind => {
         const priceScaleId = ind.pane === 'own' ? 'left' : 'right';
         
         if (ind.pane === 'own') {
             chart.priceScale('left').applyOptions({ 
                 visible: true, 
                 scaleMargins: { top: 0.75, bottom: 0.05 },
                 borderColor: COLOR.bg.border,
             });
             // Push the main series up slightly when an oscillator is visible
             chart.priceScale('right').applyOptions({
                 scaleMargins: { top: 0.05, bottom: 0.3 }
             });
         }

         ind.lines.forEach(line => {
             if (line.type === 'histogram') {
                 const series = chart.addHistogramSeries({
                     priceScaleId: priceScaleId,
                 });
                 series.setData(line.data);
                 indicatorSeriesRefs.current.set(`${ind.id}_${line.id}`, series as any);
             } else {
                 const series = chart.addLineSeries({
                     color: line.color,
                     lineWidth: 1.5,
                     priceScaleId: priceScaleId,
                 });
                 series.setData(line.data);
                 indicatorSeriesRefs.current.set(`${ind.id}_${line.id}`, series as any);
             }
         });
     });

     // Reset right scale if no oscillators
     if (!indicators.some(i => i.pane === 'own')) {
         chart.priceScale('left').applyOptions({ visible: false });
         chart.priceScale('right').applyOptions({
             scaleMargins: { top: 0.05, bottom: 0.05 }
         });
     }

     // Only auto-fit once if requested or on major data change
     // Moving fitContent out of the data dependency to prevent "locking" on updates
  }, [chartType, data, volumeData, comparisonData, indicators]);

  // Initial Auto-Fit only when container or major scale changes
  useEffect(() => {
    if (chartRef.current && data.length > 0) {
        chartRef.current.timeScale().fitContent();
    }
  }, [data.length === 0]); 

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, [
      {
          label: `COPY PRICE ${lastPriceUnderCursor?.toFixed(2) || ''}`,
          icon: <Copy size={14} />,
          onClick: () => {
              if (lastPriceUnderCursor) {
                  navigator.clipboard.writeText(lastPriceUnderCursor.toFixed(2));
              }
          }
      },
      {
          label: 'RESET SCALE',
          onClick: () => chartRef.current?.timeScale().fitContent()
      }
    ]);
  };

  return (
    <div 
        style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}
        onContextMenuCapture={handleContextMenu}
    >
      {/* Toolbar */}
      <div style={{ width: '36px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: '8px', background: COLOR.bg.surface }}>
          {[
              { icon: <Pencil size={14} /> },
              { icon: <Minus size={14} /> },
              { icon: <Square size={14} /> },
              { icon: <Circle size={14} /> },
              { icon: <Type size={14} /> }
          ].map((tool, i) => (
              <div key={i} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLOR.text.muted, cursor: 'pointer', borderRadius: '4px' }} className="hover:bg-zinc-800 hover:text-white transition-colors duration-100">
                  {tool.icon}
              </div>
          ))}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
          <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
          {isLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', zIndex: 10, backdropFilter: 'blur(1px)' }}>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: COLOR.semantic.info, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
          )}
      </div>
    </div>
  );
};
