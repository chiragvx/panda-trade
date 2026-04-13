import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ColorType } from 'lightweight-charts';
import { COLOR } from '../../ds/tokens';

interface TradingViewChartProps {
  data: any[];
  isLoading?: boolean;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ data, isLoading }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const candlestickSeriesRef = useRef<any>(null);

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
      },
      crosshair: {
        mode: 0,
        vertLine: { labelBackgroundColor: COLOR.semantic.info },
        horzLine: { labelBackgroundColor: COLOR.semantic.info },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: COLOR.semantic.up,
      downColor: COLOR.semantic.down,
      borderVisible: false,
      wickUpColor: COLOR.semantic.up,
      wickDownColor: COLOR.semantic.down,
    });

    candlestickSeriesRef.current = candlestickSeries;
    chartRef.current = chart;

    if (data && data.length > 0) {
        candlestickSeries.setData(data);
        chart.timeScale().fitContent();
    }

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
    if (candlestickSeriesRef.current && data) {
        candlestickSeriesRef.current.setData(data);
        if (data.length > 0) {
            chartRef.current?.timeScale().fitContent();
        }
    }
  }, [data]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', zIndex: 10 }}>
              <span style={{ fontSize: '10px', color: COLOR.text.muted }}>LOADING_VAPOR_DATA...</span>
          </div>
      )}
    </div>
  );
};
