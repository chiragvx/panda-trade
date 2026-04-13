import React, { useEffect, useMemo, useState } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { COLOR, BORDER, TYPE } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { Text } from '../../ds/components/Text';
import { useLayoutStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { isIsin } from '../../utils/liveSymbols';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { RotateCcw, LineChart, BarChart } from 'lucide-react';
import { Tooltip } from '../../ds/components/Tooltip';
import { NIFTY_50 } from '../../utils/defaultSymbol';
import { TradingViewChart } from './TradingViewChart';
import { upstoxApi } from '../../services/upstoxApi';
import { format, subDays } from 'date-fns';

export const ChartWidget: React.FC = () => {
  const { selectedSymbol: globalSymbol } = useSelectionStore();
  const [localSymbol, setLocalSymbol] = useState<any>(null);
  
  const selectedSymbol = localSymbol || globalSymbol || NIFTY_50;
  const { prices, setInstrumentMeta, accessToken } = useUpstoxStore();
  const { openOrderModal } = useLayoutStore();

  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [interval, setInterval] = useState('1minute');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  const displayTicker = useMemo(() => {
    if (!selectedSymbol) return '--';
    return isIsin(selectedSymbol.ticker) ? (selectedSymbol.name || 'INSTRUMENT') : selectedSymbol.ticker;
  }, [selectedSymbol]);

  const liveFeed = selectedSymbol?.instrument_key ? prices[selectedSymbol.instrument_key] : undefined;
  const currentPrice = selectedSymbol?.instrument_key
    ? Number(liveFeed?.ltp ?? selectedSymbol?.ltp ?? 0)
    : Number(selectedSymbol?.ltp ?? 0);
  const liveChangePct = Number(liveFeed?.pChange ?? selectedSymbol?.changePct ?? 0);

  const isIndex = selectedSymbol?.instrument_key?.startsWith('NSE_INDEX');

  useEffect(() => {
    if (!selectedSymbol?.instrument_key || !accessToken) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const toDate = format(new Date(), 'yyyy-MM-dd');
        
        let daysBack = 1;
        if (interval === '5minute') daysBack = 5;
        else if (interval === '15minute') daysBack = 10;
        else if (interval === 'day') daysBack = 200;

        const fromDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');
        
        const response = await upstoxApi.getHistoricalData(
            accessToken, 
            selectedSymbol.instrument_key, 
            interval, 
            fromDate, 
            toDate
        );

        if (response.status === 'success' && response.data?.candles) {
            const formatted = response.data.candles.map((c: any) => ({
                time: new Date(c[0]).getTime() / 1000,
                open: c[1],
                high: c[2],
                low: c[3],
                close: c[4],
            })).sort((a: any, b: any) => a.time - b.time);
            setChartData(formatted);
        } else {
            setChartData([]);
        }
      } catch (err) {
        console.error('Failed to fetch historical data:', err);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedSymbol?.instrument_key, accessToken, interval]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.base, overflow: 'hidden' }}>
      {/* Dynamic Header */}
      <div style={{ height: '36px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: COLOR.bg.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.tight }}>{displayTicker}</span>
          <span style={{ fontSize: TYPE.size.md, color: COLOR.text.primary, fontWeight: TYPE.weight.bold, fontFamily: TYPE.family.mono }}>₹{currentPrice.toFixed(2)}</span>
          <Change value={liveChangePct} format="percent" size="sm" />
          {isIndex && <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, padding: '1px 6px', border: BORDER.standard, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps, borderRadius: '2px' }}>INDEX</span>}
          <div style={{ width: '1px', height: '12px', background: COLOR.bg.border, margin: '0 4px' }} />
          {['1minute', '5minute', '15minute', 'day'].map(int => (
              <button 
                key={int}
                onClick={() => setInterval(int)}
                style={{ 
                    background: interval === int ? `${COLOR.semantic.info}22` : 'transparent',
                    border: 'none',
                    color: interval === int ? COLOR.semantic.info : COLOR.text.muted,
                    fontSize: '10px',
                    fontWeight: TYPE.weight.black,
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    fontFamily: TYPE.family.mono
                }}
              >
                  {int.replace('minute', 'M').replace('day', '1D').toUpperCase()}
              </button>
          ))}
          <div style={{ width: '1px', height: '12px', background: COLOR.bg.border, margin: '0 4px' }} />
          <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setChartType('candle')} style={{ background: 'transparent', border: 'none', color: chartType === 'candle' ? COLOR.semantic.info : COLOR.text.muted, cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}><BarChart size={14} /></button>
              <button onClick={() => setChartType('line')} style={{ background: 'transparent', border: 'none', color: chartType === 'line' ? COLOR.semantic.info : COLOR.text.muted, cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}><LineChart size={14} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WidgetSymbolSearch 
            onSelect={(res) => {
              setLocalSymbol({ instrument_key: res.instrumentKey, ticker: res.ticker, exchange: res.exchange, name: res.name });
              setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
            }} 
            placeholder="SEARCH..." 
          />
          {localSymbol && (
            <Tooltip content="CLEAR_OVERRIDE" position="bottom">
                <button 
                onClick={() => setLocalSymbol(null)}
                style={{ background: 'transparent', border: 'none', color: COLOR.semantic.down, cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center' }}
                >
                <RotateCcw size={14} />
                </button>
            </Tooltip>
          )}

          {!isIndex && selectedSymbol && (
            <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
              <Button variant="buy" size="xs" onClick={() => openOrderModal('BUY')} style={{ padding: '0 12px', height: '24px' }}>BUY</Button>
              <Button variant="sell" size="xs" onClick={() => openOrderModal('SELL')} style={{ padding: '0 12px', height: '24px' }}>SELL</Button>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
          {!accessToken ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: COLOR.bg.base }}>
                  <Text color="muted" weight="bold">API_DISCONNECTED</Text>
                  <Button size="sm" variant="primary" onClick={() => (window as any).replaceTab?.('api')}>CONNECT_API</Button>
              </div>
          ) : (
              <TradingViewChart data={chartData} isLoading={loading} chartType={chartType} />
          )}
      </div>
    </div>
  );
};
