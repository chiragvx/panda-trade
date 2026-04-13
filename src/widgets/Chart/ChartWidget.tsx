import React, { useEffect, useMemo, useState } from 'react';
import { useSelectionStore, useWatchlistStore, useLayoutStore } from '../../store/useStore';
import { COLOR, BORDER, TYPE } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { Text } from '../../ds/components/Text';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { isIsin } from '../../utils/liveSymbols';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { Select } from '../../ds';
import { RotateCcw, LineChart, BarChart, GitCompare, X } from 'lucide-react';
import { Tooltip } from '../../ds/components/Tooltip';
import { NIFTY_50 } from '../../utils/defaultSymbol';
import { TradingViewChart } from './TradingViewChart';
import { upstoxApi } from '../../services/upstoxApi';
import { format, subDays } from 'date-fns';

import { 
    calculateSMASeries, calculateEMASeries, calculateRSISeries, 
    calculateBollingerBandsSeries, calculateMACDSeries, 
    calculateVWAPSeries, calculateStochasticSeries, calculateATRSeries 
} from '../../utils/ta';

interface CompareSymbol {
  instrument_key: string;
  ticker: string;
  name?: string;
  exchange?: string;
}

interface IndicatorConfig {
  id: string;
  type: 'SMA' | 'EMA' | 'RSI';
  params: { period: number };
  color: string;
  pane?: 'main' | 'own';
}

export const ChartWidget: React.FC = () => {
  const { watchlists, activeWatchlistId } = useWatchlistStore();
  const { prices, setInstrumentMeta, accessToken } = useUpstoxStore();
  const { openOrderModal } = useLayoutStore();
  const { selectedSymbol } = useSelectionStore();

  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [interval, setInterval] = useState('1minute');
  const [range, setRange] = useState('1D');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  // Comparison / Multi-Symbol State
  const [compareSymbols, setCompareSymbols] = useState<CompareSymbol[]>([
    { instrument_key: 'NSE_INDEX|Nifty 50', ticker: 'NIFTY 50', name: 'Nifty 50', exchange: 'NSE_INDEX' }
  ]);
  const [compareDataMap, setCompareDataMap] = useState<Record<string, any[]>>({});

  // Indicator State
  const [activeIndicators, setActiveIndicators] = useState<IndicatorConfig[]>([]);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

  const daysBack = useMemo(() => {
     if (range === 'MAX') return 365 * 12;
     if (range === '5Y') return 365 * 5;
     if (range === '1Y') return 365;
     if (range === '3M') return 90;
     if (range === '1M') return 30;
     if (range === '1W') return 7;
     if (range === '1D') return 1;
     return 7;
  }, [range]);

  const handleIntervalChange = (newInterval: string) => {
      setInterval(newInterval);
      if (newInterval === '1minute') setRange('1D');
      else if (newInterval.includes('minute')) setRange('1W');
      else if (newInterval === 'day') setRange('1M');
      else if (newInterval === 'month') setRange('MAX');
  };

  // React to selectedSymbol changes from any widget (watchlist chart icon, trending, etc.)
  useEffect(() => {
    if (!selectedSymbol?.instrument_key) return;
    const current = compareSymbols[0];
    if (current?.instrument_key === selectedSymbol.instrument_key) return;

    const newSym = {
      instrument_key: selectedSymbol.instrument_key,
      ticker: selectedSymbol.ticker,
      name: selectedSymbol.name || selectedSymbol.ticker,
      exchange: selectedSymbol.exchange || '',
    };
    setCompareSymbols(prev => [newSym, ...prev.slice(1)]);
  }, [selectedSymbol]);

  const addCompare = (res: any) => {
    if (compareSymbols.some(s => s.instrument_key === res.instrumentKey)) return;
    setCompareSymbols(prev => [...prev, {
      instrument_key: res.instrumentKey,
      ticker: res.ticker,
      name: res.name,
      exchange: res.exchange,
    }]);
    setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
  };

  const removeCompare = (instrumentKey: string) => {
    setCompareSymbols(prev => prev.filter(s => s.instrument_key !== instrumentKey));
    setCompareDataMap(prev => {
        const next = { ...prev };
        delete next[instrumentKey];
        return next;
    });
  };

  const addIndicator = (type: string, period: number = 14) => {
    const id = `${type}_${period}_${Date.now()}`;
    let color = '#3b82f6';
    let pane: 'main' | 'own' = 'main';
    
    if (type === 'SMA') color = '#3b82f6';
    else if (type === 'EMA') color = '#fbbf24';
    else if (type === 'RSI') { color = '#ec4899'; pane = 'own'; }
    else if (type === 'BB') { color = '#a855f7'; pane = 'main'; }
    else if (type === 'MACD') { color = '#06b6d4'; pane = 'own'; }
    else if (type === 'VWAP') { color = '#ffffff'; pane = 'main'; }
    else if (type === 'STOCH') { color = '#10b981'; pane = 'own'; }
    else if (type === 'ATR') { color = '#f43f5e'; pane = 'own'; }

    setActiveIndicators(prev => [...prev, { id, type: type as any, params: { period }, color, pane }]);
    setShowIndicatorMenu(false);
  };

  const removeIndicator = (id: string) => {
    setActiveIndicators(prev => prev.filter(i => i.id !== id));
  };

  // 1. Unified Multi-Data Fetch
  useEffect(() => {
      if (!accessToken || compareSymbols.length === 0) {
          setChartData([]);
          setCompareDataMap({});
          return;
      }

      const fetchData = async () => {
          setLoading(true);
          const toDate = format(new Date(), 'yyyy-MM-dd');
          const fromDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');
          
          const newMap: Record<string, any[]> = {};
          
          await Promise.all(compareSymbols.map(async (sym, index) => {
              try {
                const response = await upstoxApi.getHistoricalData(accessToken, sym.instrument_key, interval, fromDate, toDate);
                if (response.status === 'success' && response.data?.candles) {
                    const mapped = response.data.candles.map((c: any) => ({
                        time: c[0],
                        open: c[1], high: c[2], low: c[3], close: c[4],
                        volume: c[5]
                    })).sort((a: any, b: any) => a.time - b.time);

                    // Deduplicate by time to prevent lightweight-charts assertion failure
                    const formatted: any[] = [];
                    for (let i = 0; i < mapped.length; i++) {
                        if (i === 0 || mapped[i].time > mapped[i - 1].time) {
                            formatted.push(mapped[i]);
                        }
                    }

                    if (index === 0) {
                        setChartData(formatted);
                    } else {
                        newMap[sym.instrument_key] = formatted.map(f => ({ time: f.time, close: f.close }));
                    }
                }
              } catch (e) {}
          }));

          setCompareDataMap(newMap);
          setLoading(false);
      };

      fetchData();
  }, [compareSymbols, interval, daysBack, accessToken]);

  const volumeData = useMemo(() => {
      return chartData.map(d => ({
          time: d.time,
          value: d.volume || 0,
          color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      }));
  }, [chartData]);

  const calculatedIndicators = useMemo(() => {
      const ohlc = chartData.map(d => ({ time: d.time, close: d.close }));
      if (ohlc.length === 0) return [];

      return activeIndicators.map(ind => {
          let lines: any[] = [];
          
          if (ind.type === 'SMA') {
              lines = [{ id: 'sma', data: calculateSMASeries(ohlc, ind.params.period), color: ind.color }];
          } else if (ind.type === 'EMA') {
              lines = [{ id: 'ema', data: calculateEMASeries(ohlc, ind.params.period), color: ind.color }];
          } else if (ind.type === 'RSI') {
              lines = [{ id: 'rsi', data: calculateRSISeries(ohlc, ind.params.period), color: ind.color }];
          } else if (ind.type === 'BB') {
              // Special case for Bollinger Bands
              const { upper, middle, lower } = calculateBollingerBandsSeries(ohlc, ind.params.period);
              lines = [
                  { id: 'upper', data: upper, color: ind.color, opacity: 0.5 },
                  { id: 'middle', data: middle, color: ind.color, dash: [4, 4] },
                  { id: 'lower', data: lower, color: ind.color, opacity: 0.5 }
              ];
          } else if (ind.type === 'MACD') {
              const { macd, signal, histogram } = calculateMACDSeries(ohlc);
              lines = [
                  { id: 'macd', data: macd, color: '#2563eb' },
                  { id: 'signal', data: signal, color: '#dc2626' },
                  { id: 'hist', data: histogram, color: '#10b981', type: 'histogram' }
              ];
          } else if (ind.type === 'VWAP') {
              const fullData = chartData.map(d => ({ time: d.time, close: d.close, volume: d.volume }));
              lines = [{ id: 'vwap', data: calculateVWAPSeries(fullData), color: ind.color }];
          } else if (ind.type === 'STOCH') {
              const fullData = chartData.map(d => ({ time: d.time, high: d.high, low: d.low, close: d.close }));
              const { k, d } = calculateStochasticSeries(fullData);
              lines = [
                  { id: 'k', data: k, color: '#3b82f6' },
                  { id: 'd', data: d, color: '#f59e0b' }
              ];
          } else if (ind.type === 'ATR') {
              const fullData = chartData.map(d => ({ time: d.time, high: d.high, low: d.low, close: d.close }));
              lines = [{ id: 'atr', data: calculateATRSeries(fullData), color: ind.color }];
          }
          
          return { ...ind, lines };
      });
  }, [chartData, activeIndicators]);

  const comparisonProps = useMemo(() => {
      return compareSymbols.slice(1).map(s => ({
          id: s.instrument_key,
          ticker: s.ticker,
          data: compareDataMap[s.instrument_key] || []
      }));
  }, [compareSymbols, compareDataMap]);

  const displayTicker = useMemo(() => {
    const main = compareSymbols[0];
    if (!main) return '--';
    return isIsin(main.ticker) ? (main.name || 'INSTRUMENT') : main.ticker;
  }, [compareSymbols]);

  const mainSym = compareSymbols[0];
  const liveFeed = mainSym ? prices[mainSym.instrument_key] : undefined;
  const currentPrice = Number(liveFeed?.ltp ?? 0);
  const liveChangePct = Number(liveFeed?.pChange ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.base, overflow: 'hidden' }}>
      {/* Fixed Header - Matches 32px height across terminal */}
      <div style={{ 
          height: '32px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0, background: '#000', flexShrink: 0
      }}>
        {/* Left Side: Market Info & Timeframe */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '12px', height: '32px', flexShrink: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: COLOR.text.primary, letterSpacing: '-0.01em', lineHeight: '1.1', maxWidth: '100px', display: 'flex', flexDirection: 'column' }}>
              {displayTicker}
          </div>
          <span style={{ fontSize: '12px', color: COLOR.text.primary, fontWeight: 600, fontFamily: TYPE.family.mono }}>₹{currentPrice.toFixed(2)}</span>
          <Change value={liveChangePct} format="percent" size="sm" style={{ fontSize: '11px', fontWeight: 500 }} />
          <div style={{ width: '1px', height: '12px', background: COLOR.bg.border }} />
          
          <Select 
            value={range === 'MAX' ? 'MAX' : range === '5Y' ? '5Y' : range === '1Y' ? '1Y' : interval} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const val = e.target.value;
              if (val === 'MAX') { setInterval('month'); setRange('MAX'); }
              else if (val === '5Y') { setInterval('day'); setRange('5Y'); }
              else if (val === '1Y') { setInterval('day'); setRange('1Y'); }
              else handleIntervalChange(val);
            }} 
            selectSize="sm" 
            style={{ color: COLOR.semantic.info, width: '60px', height: '28px' }}
          >
              <option value="1minute">1M</option>
              <option value="5minute">5M</option>
              <option value="15minute">15M</option>
              <option value="60minute">1H</option>
              <option value="day">1D</option>
              <option value="1Y">1Y</option>
              <option value="5Y">5Y</option>
              <option value="MAX">MAX</option>
          </Select>

          <div style={{ display: 'flex', gap: '1px', alignItems: 'center' }}>
              <button onClick={() => setChartType('candle')} style={{ background: 'transparent', border: 'none', color: chartType === 'candle' ? COLOR.semantic.info : COLOR.text.muted, cursor: 'pointer', padding: '4px', height: '32px', width: '28px' }} className="hover:bg-zinc-800"><BarChart size={14} /></button>
              <button onClick={() => setChartType('line')} style={{ background: 'transparent', border: 'none', color: chartType === 'line' ? COLOR.semantic.info : COLOR.text.muted, cursor: 'pointer', padding: '4px', height: '32px', width: '28px' }} className="hover:bg-zinc-800"><LineChart size={14} /></button>
          </div>

          <div style={{ width: '1px', height: '12px', background: COLOR.bg.border }} />

          {/* Indicators Button (fx) */}
          <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
                style={{ background: 'transparent', border: 'none', color: COLOR.text.primary, cursor: 'pointer', padding: '0 8px', fontSize: '11px', fontWeight: 'bold', height: '32px', display: 'flex', alignItems: 'center', gap: '4px' }}
                className="hover:bg-zinc-800"
            >
                <div style={{ color: COLOR.semantic.info, fontSize: '14px', fontStyle: 'italic', fontFamily: 'serif' }}>ƒx</div>
                INDICATORS
            </button>
            {showIndicatorMenu && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: COLOR.bg.elevated, border: BORDER.standard, borderRadius: '4px', padding: '4px', zIndex: 100, minWidth: '120px' }}>
                    {[
                        { label: 'SMA 20', onClick: () => addIndicator('SMA', 20) },
                        { label: 'SMA 50', onClick: () => addIndicator('SMA', 50) },
                        { label: 'EMA 13', onClick: () => addIndicator('EMA', 13) },
                        { label: 'EMA 21', onClick: () => addIndicator('EMA', 21) },
                        { label: 'BB 20, 2', onClick: () => addIndicator('BB', 20) },
                        { label: 'RSI 14', onClick: () => addIndicator('RSI', 14) },
                        { label: 'MACD', onClick: () => addIndicator('MACD') },
                        { label: 'VWAP', onClick: () => addIndicator('VWAP') },
                        { label: 'Stochastic', onClick: () => addIndicator('STOCH') },
                        { label: 'ATR 14', onClick: () => addIndicator('ATR', 14) }
                    ].map(item => (
                        <div key={item.label} onClick={item.onClick} style={{ padding: '6px 12px', fontSize: '11px', color: COLOR.text.primary, cursor: 'pointer', borderRadius: '2px' }} className="hover:bg-zinc-800">
                            {item.label}
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        {/* Right Side: Primary Search - Always Adds */}
        <div style={{ display: 'flex', alignItems: 'stretch', minWidth: '180px', maxWidth: '260px', height: '32px', flex: 1, justifyContent: 'flex-end' }}>
          <WidgetSymbolSearch onSelect={(res) => addCompare(res)} placeholder="Add symbol..." />
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          {/* Floating Instrument & Indicator Stack (Top Right Over Chart) */}
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
            {compareSymbols.map(s => (
                <div key={s.instrument_key} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '4px', border: `1px solid ${COLOR.bg.border}` }}>
                    <span style={{ color: COLOR.text.primary, fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em', fontFamily: TYPE.family.mono }}>{s.ticker}</span>
                    <button onClick={() => removeCompare(s.instrument_key)} style={{ border: 'none', background: 'transparent', color: COLOR.text.muted, cursor: 'pointer', padding: '2px' }} className="hover:text-red-400"><X size={12} /></button>
                </div>
            ))}
            {activeIndicators.map(ind => (
                <div key={ind.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '4px', border: `1px solid ${ind.color}40` }}>
                    <span style={{ color: ind.color, fontWeight: 700, fontSize: '10px', letterSpacing: '0.05em' }}>{ind.type} {ind.params.period}</span>
                    <button onClick={() => removeIndicator(ind.id)} style={{ border: 'none', background: 'transparent', color: COLOR.text.muted, cursor: 'pointer', padding: '2px' }} className="hover:text-red-400"><X size={12} /></button>
                </div>
            ))}
          </div>

          {!accessToken ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: COLOR.bg.base }}>
                  <Text color="muted" weight="bold">Api disconnected</Text>
                  <Button size="sm" variant="primary" onClick={() => (window as any).replaceTab?.('api')}>Connect api</Button>
              </div>
          ) : (
              <TradingViewChart 
                data={chartData} 
                volumeData={volumeData}
                comparisonData={comparisonProps} 
                indicators={calculatedIndicators}
                isLoading={loading} 
                chartType={chartType} 
              />
          )}
      </div>
    </div>
  );
};
