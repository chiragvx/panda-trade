import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData } from 'lightweight-charts';
import { useMarketStore } from '../../store/useStore';
import { Search, ChevronDown, Fullscreen, Maximize2, MousePointer2, MoreHorizontal, MousePointer } from 'lucide-react';

export const ChartPanel: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const { selectedSymbol } = useMarketStore();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d0f14' },
        textColor: '#8b90a0',
      },
      grid: {
        vertLines: { color: '#161920' },
        horzLines: { color: '#161920' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#3b82f6',
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: '#3b82f6',
          labelBackgroundColor: '#3b82f6',
        },
      },
      timeScale: {
        borderColor: '#2a2d3a',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2a2d3a',
      },
    });

    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    volumeSeriesRef.current = chartRef.current.addHistogramSeries({
      color: '#06b6d4',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // overlay
    });

    volumeSeriesRef.current.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Generate mock data for the selected symbol
    const data: CandlestickData[] = [];
    const volumeData: HistogramData[] = [];
    let price = selectedSymbol?.ltp || 1000;
    const now = new Date();
    
    for (let i = 0; i < 365; i++) {
        const time = new Date(now.getTime() - (365 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const open = price + (Math.random() - 0.5) * (price * 0.05);
        const close = open + (Math.random() - 0.5) * (price * 0.05);
        const high = Math.max(open, close) + Math.random() * (price * 0.02);
        const low = Math.min(open, close) - Math.random() * (price * 0.02);
        
        data.push({ time, open, high, low, close });
        volumeData.push({ 
            time, 
            value: Math.random() * 10000000, 
            color: close >= open ? '#22c55e33' : '#ef444433' 
        });
        price = close;
    }

    candlestickSeriesRef.current.setData(data);
    volumeSeriesRef.current.setData(volumeData);

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth, height: chartContainerRef.current?.clientHeight });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.remove();
    };
  }, [selectedSymbol]);

  return (
    <div className="flex-1 flex flex-col bg-bg-primary min-w-0 h-full relative group">
      {/* Chart Toolbar */}
      <div className="h-10 bg-bg-secondary border-b border-border px-3 flex items-center justify-between z-10">
        <div className="flex items-center space-x-1 border-r border-border pr-3 mr-3">
          <div className="flex items-center space-x-2 bg-bg-elevated/50 px-2 py-1 rounded cursor-pointer hover:bg-bg-elevated transition-colors">
            <Search size={14} className="text-text-muted" />
            <span className="text-[11px] font-bold tracking-wide uppercase">{selectedSymbol?.ticker || 'SELECT SYMBOL'}</span>
            <ChevronDown size={14} className="text-text-muted" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
             {['1m', '5m', '15m', '1h', '1D', '1W'].map(tf => (
               <button key={tf} className={`px-2 py-1 text-[10px] font-medium rounded hover:bg-bg-elevated transition-colors ${tf === '1D' ? 'text-accent-teal' : 'text-text-secondary'}`}>
                 {tf}
               </button>
             ))}
          </div>
          <div className="h-4 w-px bg-border/50 mx-1" />
          <div className="flex items-center space-x-1">
              <button className="p-1 px-2 text-[10px] font-medium rounded bg-bg-elevated border border-border/50 text-text-primary hover:bg-bg-row-hover transition-colors">Indicators</button>
              <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors"><Maximize2 size={16} /></button>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 relative">
        {/* Drawing Toolbar (Side) */}
        <div className="absolute left-2 top-4 bottom-4 w-10 bg-bg-secondary/80 border border-border/50 rounded-lg flex flex-col items-center py-4 space-y-4 z-10 backdrop-blur-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
           <MousePointer size={16} className="text-accent-teal cursor-pointer" />
           <div className="w-6 h-px bg-border" />
           {Array(6).fill(0).map((_, i) => (
             <div key={i} className="w-6 h-6 rounded hover:bg-bg-elevated flex items-center justify-center cursor-pointer text-text-secondary hover:text-text-primary">
                <div className="w-4 h-[2px] bg-current" />
             </div>
           ))}
           <div className="flex-1" />
           <MoreHorizontal size={16} className="text-text-muted" />
        </div>

        <div ref={chartContainerRef} className="w-full h-full" />
        
        {/* Bottom Toggles */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-10">
           {['Auto', 'Log', '%'].map(type => (
              <button key={type} className="px-1.5 py-0.5 rounded bg-bg-elevated/80 border border-border/50 text-[10px] font-bold text-text-secondary hover:text-text-primary backdrop-blur-sm transition-colors uppercase tracking-widest">{type}</button>
           ))}
        </div>

        {/* Floating Price Label */}
        {selectedSymbol && (
          <div className="absolute top-4 right-20 bg-accent-teal/10 border border-accent-teal/30 px-3 py-2 rounded-lg backdrop-blur-md shadow-2xl z-20 pointer-events-none transition-transform group-hover:translate-x-0 translate-x-4">
             <div className="text-[10px] text-accent-teal font-bold uppercase tracking-wider mb-1">Live Price</div>
             <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-mono text-text-primary font-bold">₹{selectedSymbol.ltp.toLocaleString('en-IN')}</div>
                <div className={`text-sm font-mono font-medium ${selectedSymbol.change >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                   {selectedSymbol.changePct >= 0 ? '+' : ''}{selectedSymbol.changePct.toFixed(2)}%
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Action Chips Bottom */}
      <div className="h-10 bg-bg-secondary border-t border-border flex items-center px-4 space-x-4 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center space-x-2 shrink-0">
             <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Select Range:</span>
             <div className="flex items-center space-x-1">
                {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'].map(range => (
                  <button key={range} className="px-2 py-1 text-[10px] font-medium rounded hover:bg-bg-elevated transition-colors text-text-secondary">{range}</button>
                ))}
             </div>
          </div>
      </div>
    </div>
  );
};
