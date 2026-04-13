import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ColorType, ISeriesApi } from 'lightweight-charts';
import { COLOR, TYPE } from '../../ds/tokens';
import { useContextMenuStore } from '../../store/useContextMenuStore';
import { CornerDownRight, Maximize2, Copy } from 'lucide-react';

interface TradingViewChartProps {
  data: any[];
  isLoading?: boolean;
  chartType: 'candle' | 'line';
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ data, isLoading, chartType }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const { openContextMenu } = useContextMenuStore();
  
  const [lastPriceUnderCursor, setLastPriceUnderCursor] = useState<number | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: COLOR.bg.base },
        textColor: COLOR.text.muted,
        fontFamily: 'JetBrains Mono, Inter, system-ui',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      width: chartContainerRef.current.clientWidth || 600,
      height: chartContainerRef.current.clientHeight || 400,
      timeScale: {
        borderColor: COLOR.bg.border,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: COLOR.bg.border,
        autoScale: true,
      },
      crosshair: {
        mode: 0,
        vertLine: { labelBackgroundColor: COLOR.semantic.info },
        horzLine: { labelBackgroundColor: COLOR.semantic.info },
      },
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
     if (!chartRef.current) return;
     const chart = chartRef.current;

     // Remove existing series
     if (candlestickSeriesRef.current) chart.removeSeries(candlestickSeriesRef.current);
     if (lineSeriesRef.current) chart.removeSeries(lineSeriesRef.current);
     candlestickSeriesRef.current = null;
     lineSeriesRef.current = null;

     if (chartType === 'candle') {
        const series = chart.addCandlestickSeries({
            upColor: COLOR.semantic.up,
            downColor: COLOR.semantic.down,
            borderVisible: false,
            wickUpColor: COLOR.semantic.up,
            wickDownColor: COLOR.semantic.down,
        });
        candlestickSeriesRef.current = series;
        if (data && data.length > 0) series.setData(data);
     } else {
        const series = chart.addLineSeries({
            color: COLOR.semantic.info,
            lineWidth: 2,
        });
        lineSeriesRef.current = series;
        if (data && data.length > 0) {
            const lineData = data.map(d => ({ time: d.time, value: d.close }));
            series.setData(lineData);
        }
     }

     chart.timeScale().fitContent();

     chart.subscribeCrosshairMove((param) => {
        let price = null;
        if (param.point) {
            if (candlestickSeriesRef.current && param.seriesData.get(candlestickSeriesRef.current)) {
                const d = param.seriesData.get(candlestickSeriesRef.current) as any;
                price = d.close || d.value;
            } else if (lineSeriesRef.current && param.seriesData.get(lineSeriesRef.current)) {
                const d = param.seriesData.get(lineSeriesRef.current) as any;
                price = d.value;
            }
        }
        setLastPriceUnderCursor(price);
    });

  }, [chartType, data]);

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
          label: 'RESET CHART VIEW',
          icon: <Maximize2 size={14} />,
          onClick: () => {
              chartRef.current?.timeScale().fitContent();
          }
      }
    ]);
  };

  return (
    <div 
        style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}
        onContextMenu={handleContextMenu}
    >
      {/* Left Toolbar - Drawing Placeholders */}
      <div style={{ width: '36px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: '12px', background: COLOR.bg.surface }}>
          {['/', '-', '+', 'T', 'O'].map((tool, i) => (
              <div key={i} style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLOR.text.muted, fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid transparent' }} className="hover:text-primary">
                  {tool}
              </div>
          ))}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
          <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
          {isLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', zIndex: 10 }}>
                  <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>FETCHING_HISTORICAL_FEED...</span>
              </div>
          )}
      </div>
    </div>
  );
};
