import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ColorType, ISeriesApi, PriceScaleMode, LineStyle } from 'lightweight-charts';
import { COLOR, TYPE } from '../../ds/tokens';
import { useContextMenuStore } from '../../store/useContextMenuStore';
import { Copy } from 'lucide-react';

const MARKET_TIMEZONE = 'Asia/Kolkata';

const formatInMarketTz = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: MARKET_TIMEZONE, ...options }).format(date);

const toUnixSeconds = (time: any): number => {
  if (typeof time === 'number') return time;
  if (time && typeof time === 'object' && 'timestamp' in time) return Number(time.timestamp);
  return 0;
};

const isIntradayInterval = (interval: string) => interval.includes('minute');

const buildTimeFormatter = (interval: string, range: string) => (time: any) => {
  const date = new Date(toUnixSeconds(time) * 1000);

  if (interval === 'month' || range === 'MAX' || range === '5Y') {
    return formatInMarketTz(date, { month: 'short', year: 'numeric' });
  }

  if (!isIntradayInterval(interval)) {
    return formatInMarketTz(date, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return formatInMarketTz(date, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const buildTickMarkFormatter = (interval: string, range: string) => (time: any) => {
  const date = new Date(toUnixSeconds(time) * 1000);

  if (interval === 'month' || range === 'MAX' || range === '5Y') {
    return formatInMarketTz(date, { month: 'short', year: '2-digit' });
  }

  if (!isIntradayInterval(interval)) {
    if (range === '1M') {
      return formatInMarketTz(date, { day: 'numeric', month: 'short' });
    }

    if (range === '6M' || range === 'YTD' || range === '1Y') {
      return formatInMarketTz(date, { month: 'short' });
    }

    return formatInMarketTz(date, { month: 'short', year: '2-digit' });
  }

  return formatInMarketTz(date, { hour: '2-digit', minute: '2-digit', hour12: false });
};

interface ComparisonSeriesData {
  id: string;
  ticker: string;
  color: string;
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
  data: any[];
  volumeData?: any[];
  comparisonData?: ComparisonSeriesData[];
  indicators?: IndicatorSeriesData[];
  isLoading?: boolean;
  chartType: 'candle' | 'line';
  interval: string;
  range: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  data,
  volumeData = [],
  comparisonData = [],
  indicators = [],
  isLoading,
  chartType,
  interval,
  range,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const compareSeriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const indicatorSeriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  const { openContextMenu } = useContextMenuStore();
  const [lastPriceUnderCursor, setLastPriceUnderCursor] = useState<number | null>(null);

  // ── Initialize chart (once) ────────────────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#000000' },
        textColor: COLOR.text.muted,
        fontFamily: TYPE.family.mono,
        fontSize: 11,
      },
      grid: {
        // Bloomberg: horizontal dashed only, no vertical grid
        vertLines: { visible: false },
        horzLines: { color: '#1a1a1a', style: LineStyle.Dashed },
      },
      width: chartContainerRef.current.clientWidth || 600,
      height: chartContainerRef.current.clientHeight || 400,
      localization: {
        timeFormatter: buildTimeFormatter(interval, range),
      },
      timeScale: {
        borderColor: '#1e1e1e',
        timeVisible: isIntradayInterval(interval),
        secondsVisible: false,
        rightOffset: 14,
        shiftVisibleRangeOnNewBar: false,
        tickMarkFormatter: buildTickMarkFormatter(interval, range),
      },
      rightPriceScale: {
        borderColor: '#1e1e1e',
        autoScale: true,
        scaleMargins: { top: 0.05, bottom: 0.08 },
      },
      leftPriceScale: {
        borderColor: '#1e1e1e',
        visible: false,
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#333333',
          style: LineStyle.Dashed,
          labelBackgroundColor: COLOR.semantic.info,
          labelVisible: true,
        },
        horzLine: {
          color: '#333333',
          style: LineStyle.Dashed,
          labelBackgroundColor: COLOR.semantic.info,
          labelVisible: true,
        },
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

    chart.subscribeCrosshairMove(param => {
      let price: number | null = null;
      if (param.point && param.seriesData) {
        const mainSeries = candlestickSeriesRef.current || areaSeriesRef.current || lineSeriesRef.current;
        if (mainSeries) {
          const d = param.seriesData.get(mainSeries) as any;
          if (d) price = d.close ?? d.value ?? null;
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

  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.applyOptions({
      localization: {
        timeFormatter: buildTimeFormatter(interval, range),
      },
      timeScale: {
        timeVisible: isIntradayInterval(interval),
        secondsVisible: false,
        tickMarkFormatter: buildTickMarkFormatter(interval, range),
      },
    });
  }, [interval, range]);

  // ── Rebuild series whenever data/type/comparisons change ───────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const hasComparisons = comparisonData && comparisonData.length > 0;
    const hasOwnPaneIndicators = indicators && indicators.some(i => i.pane === 'own');
    const isNormalizedMode = hasComparisons || hasOwnPaneIndicators;

    // Switch price scale mode
    chart.priceScale('right').applyOptions({
      mode: isNormalizedMode ? PriceScaleMode.Percentage : PriceScaleMode.Normal,
    });

    // 1. Remove previous main series
    try {
      if (candlestickSeriesRef.current) { chart.removeSeries(candlestickSeriesRef.current); candlestickSeriesRef.current = null; }
      if (areaSeriesRef.current) { chart.removeSeries(areaSeriesRef.current); areaSeriesRef.current = null; }
      if (lineSeriesRef.current) { chart.removeSeries(lineSeriesRef.current); lineSeriesRef.current = null; }
    } catch {}

    // 2. Add main series
    if (chartType === 'candle' && !hasComparisons) {
      // Candlestick — only when not comparing (Bloomberg: line when normalized)
      const series = chart.addCandlestickSeries({
        upColor: COLOR.semantic.up,
        downColor: COLOR.semantic.down,
        wickUpColor: COLOR.semantic.up,
        wickDownColor: COLOR.semantic.down,
        borderVisible: false,
      });
      candlestickSeriesRef.current = series;
      if (data?.length) series.setData(data);
    } else if (hasComparisons) {
      // Comparison mode: solid orange line for primary (Bloomberg style)
      const series = chart.addLineSeries({
        color: COLOR.semantic.info,
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      lineSeriesRef.current = series;
      if (data?.length) series.setData(data.map(d => ({ time: d.time, value: d.close })));
    } else {
      // Single line / area mode
      const series = chart.addAreaSeries({
        lineColor: COLOR.semantic.info,
        topColor: `${COLOR.semantic.info}22`,
        bottomColor: 'transparent',
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      areaSeriesRef.current = series;
      if (data?.length) series.setData(data.map(d => ({ time: d.time, value: d.close })));
    }

    // 3. Volume histogram
    if (volumeSeriesRef.current) {
      try { chart.removeSeries(volumeSeriesRef.current); } catch {}
      volumeSeriesRef.current = null;
    }
    if (volumeData?.length && !hasComparisons) {
      const vSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      vSeries.setData(volumeData);
      volumeSeriesRef.current = vSeries;
    }

    // 4. Comparison line series (Bloomberg blues)
    compareSeriesRefs.current.forEach(s => { try { chart.removeSeries(s); } catch {} });
    compareSeriesRefs.current.clear();
    (comparisonData || []).forEach(cd => {
      const series = chart.addLineSeries({
        color: cd.color,
        lineWidth: 1,
        title: cd.ticker,
        lastValueVisible: true,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
      });
      series.setData(cd.data.map(d => ({ time: d.time, value: d.close })));
      compareSeriesRefs.current.set(cd.id, series);
    });

    // 5. Technical indicators
    indicatorSeriesRefs.current.forEach(s => { try { chart.removeSeries(s); } catch {} });
    indicatorSeriesRefs.current.clear();
    (indicators || []).forEach(ind => {
      const priceScaleId = ind.pane === 'own' ? 'left' : 'right';
      if (ind.pane === 'own') {
        chart.priceScale('left').applyOptions({
          visible: true,
          scaleMargins: { top: 0.75, bottom: 0.05 },
          borderColor: '#1e1e1e',
        });
        chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.3 } });
      }
      ind.lines.forEach(line => {
        if (line.type === 'histogram') {
          const series = chart.addHistogramSeries({ priceScaleId });
          series.setData(line.data);
          indicatorSeriesRefs.current.set(`${ind.id}_${line.id}`, series as any);
        } else {
          const series = chart.addLineSeries({ color: line.color, lineWidth: 1, priceScaleId });
          series.setData(line.data);
          indicatorSeriesRefs.current.set(`${ind.id}_${line.id}`, series as any);
        }
      });
    });

    // Reset scales when no oscillators
    if (!(indicators || []).some(i => i.pane === 'own')) {
      chart.priceScale('left').applyOptions({ visible: false });
      chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.05 } });
    }
  }, [chartType, data, volumeData, comparisonData, indicators]);

  // Auto-fit on first data load
  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data.length === 0]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, [
      {
        label: `COPY PRICE ${lastPriceUnderCursor?.toFixed(2) ?? ''}`,
        icon: <Copy size={14} />,
        onClick: () => { if (lastPriceUnderCursor) navigator.clipboard.writeText(lastPriceUnderCursor.toFixed(2)); },
      },
      {
        label: 'RESET SCALE',
        onClick: () => chartRef.current?.timeScale().fitContent(),
      },
    ]);
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}
      onContextMenuCapture={handleContextMenu}
    >
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 10 }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: COLOR.semantic.info, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
};
