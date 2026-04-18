import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { COLOR, BORDER, TYPE, LAYOUT, SPACE } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { Text } from '../../ds/components/Text';
import { Divider } from '../../ds/components/Divider';
import { Toolbar } from '../../ds/components/Toolbar';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { getDisplayTicker } from '../../utils/liveSymbols';
import { upstoxSearch, UpstoxSearchResult } from '../../services/upstoxSearch';
import { BarChart2, LineChart, X, ChevronDown, Trash2, Eye, EyeOff, Search, Plus } from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { upstoxApi } from '../../services/upstoxApi';
import { format, subDays, startOfYear, differenceInDays } from 'date-fns';

import {
  calculateSMASeries, calculateEMASeries, calculateRSISeries,
  calculateBollingerBandsSeries, calculateMACDSeries,
  calculateVWAPSeries, calculateStochasticSeries, calculateATRSeries,
} from '../../utils/ta';

const COMPARE_COLORS = [
  '#4a9eff', '#2a6ab5', '#7bb8f5', '#1a4a85', '#98cbff', '#4466aa',
];

interface CompareSymbol {
  instrument_key: string;
  ticker: string;
  name?: string;
  exchange?: string;
  hidden?: boolean;
}

interface IndicatorConfig {
  id: string;
  type: 'SMA' | 'EMA' | 'RSI' | 'BB' | 'MACD' | 'VWAP' | 'STOCH' | 'ATR';
  params: { period: number };
  color: string;
  pane?: 'main' | 'own';
}

interface RangePreset { label: string; range: string; interval: string; days: number; }

const RANGE_PRESETS: RangePreset[] = [
  { label: '1D',  range: '1D',  interval: '1minute',  days: 1 },
  { label: '3D',  range: '3D',  interval: '5minute',  days: 3 },
  { label: '1M',  range: '1M',  interval: 'day',      days: 30 },
  { label: '6M',  range: '6M',  interval: 'day',      days: 180 },
  { label: 'YTD', range: 'YTD', interval: 'day',      days: 0 },
  { label: '1Y',  range: '1Y',  interval: 'day',      days: 365 },
  { label: '5Y',  range: '5Y',  interval: 'day',      days: 1825 },
  { label: 'Max', range: 'MAX', interval: 'month',    days: 4380 },
];

const INTERVAL_OPTIONS = [
  { value: '1minute',  label: '1m' },
  { value: '5minute',  label: '5m' },
  { value: '15minute', label: '15m' },
  { value: '60minute', label: '1H' },
  { value: 'day',      label: 'Daily' },
  { value: 'month',    label: 'Monthly' },
];

const INDICATOR_LIST = [
  { label: 'SMA 20', type: 'SMA', period: 20 },
  { label: 'SMA 50', type: 'SMA', period: 50 },
  { label: 'EMA 13', type: 'EMA', period: 13 },
  { label: 'EMA 21', type: 'EMA', period: 21 },
  { label: 'BB 20',  type: 'BB',  period: 20 },
  { label: 'RSI 14', type: 'RSI', period: 14 },
  { label: 'MACD',   type: 'MACD',period: 12 },
  { label: 'VWAP',   type: 'VWAP',period: 14 },
  { label: 'Stochastic', type: 'STOCH', period: 14 },
  { label: 'ATR 14', type: 'ATR', period: 14 },
];

const rangeBtn = (active: boolean): React.CSSProperties => ({
  height: '100%',
  padding: `0 ${LAYOUT.cellPadH}`,
  background: active ? COLOR.interactive.selected : 'transparent',
  color: active ? COLOR.semantic.info : COLOR.text.muted,
  border: 'none',
  cursor: 'pointer',
  fontSize: TYPE.size.xs,
  fontWeight: active ? TYPE.weight.black : TYPE.weight.bold,
  fontFamily: TYPE.family.mono,
  letterSpacing: TYPE.letterSpacing.wide,
  whiteSpace: 'nowrap' as const,
  flexShrink: 0,
});

// ── Inline symbol search input (shared for primary & compare) ─────────────────
interface SymbolSearchInputProps {
  placeholder: string;
  onSelect: (res: UpstoxSearchResult) => void;
  onClose: () => void;
  accessToken: string | null;
  inputRef?: React.RefObject<HTMLInputElement>;
  style?: React.CSSProperties;
}

const SymbolSearchInput: React.FC<SymbolSearchInputProps> = ({
  placeholder, onSelect, onClose, accessToken, inputRef, style,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UpstoxSearchResult[]>([]);
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef || localRef;

  useEffect(() => { ref.current?.focus(); }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      if (!accessToken) return;
      try { setResults(await upstoxSearch.searchSymbols(accessToken, query)); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [query, accessToken]);

  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[1], padding: `0 ${LAYOUT.cellPadH}`, height: '100%', minWidth: '160px' }}>
        <Search size={11} style={{ color: COLOR.semantic.info, flexShrink: 0 }} />
        <input
          ref={ref}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') { onClose(); } }}
          placeholder={placeholder}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: COLOR.text.primary, fontSize: TYPE.size.xs,
            fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono,
            letterSpacing: TYPE.letterSpacing.wide, width: '140px',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ border: 'none', background: 'transparent', color: COLOR.text.muted, cursor: 'pointer', padding: 0, lineHeight: 1 }}>
            <X size={10} />
          </button>
        )}
      </div>
      {results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, minWidth: '260px',
          background: COLOR.bg.overlay, border: BORDER.standard, zIndex: 300,
          maxHeight: '280px', overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
        }}>
          {results.map(res => (
            <div
              key={res.instrumentKey}
              onMouseDown={e => { e.preventDefault(); onSelect(res); onClose(); }}
              style={{ padding: '6px 10px', borderBottom: `1px solid ${COLOR.bg.elevated}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              className="hover:bg-interactive-hover"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, fontFamily: TYPE.family.mono }}>{res.ticker}</span>
                {res.name && res.name !== res.ticker && (
                  <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>{res.name}</span>
                )}
              </div>
              <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, letterSpacing: TYPE.letterSpacing.wide }}>{res.exchange}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Floating series legend (overlaid on chart top-left) ───────────────────────
interface SeriesLegendProps {
  compareSymbols: CompareSymbol[];
  legendData: Array<{ id: string; label: string; color: string; pctChange: number | null }> | null;
  currentPrice: number;
  liveChangePct: number;
  isComparing: boolean;
  accessToken: string | null;
  onChangePrimary: (res: UpstoxSearchResult) => void;
  onAddCompare: (res: UpstoxSearchResult) => void;
  onRemoveCompare: (key: string) => void;
  onToggleHidden: (key: string) => void;
}

const SeriesLegend: React.FC<SeriesLegendProps> = ({
  compareSymbols, legendData, currentPrice, liveChangePct, isComparing,
  accessToken, onChangePrimary, onAddCompare, onRemoveCompare, onToggleHidden,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [primarySearchOpen, setPrimarySearchOpen] = useState(false);
  const [addSearchOpen, setAddSearchOpen] = useState(false);

  const primary = compareSymbols[0];
  const comparisons = compareSymbols.slice(1);
  const primaryLabel = getDisplayTicker({
    ticker: primary?.ticker,
    name: primary?.name,
    instrumentKey: primary?.instrument_key,
    fallback: '--',
  });

  const getPct = (id: string) => legendData?.find(l => l.id === id || l.label === (compareSymbols.find(s => s.instrument_key === id)?.ticker))?.pctChange ?? null;
  const primaryPct = legendData?.find(l => l.id === 'main')?.pctChange ?? null;

  const ROW: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: SPACE[2],
    padding: '3px 8px', background: 'rgba(0,0,0,0.72)',
    backdropFilter: 'blur(6px)', fontSize: TYPE.size.xs,
    fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold,
    letterSpacing: TYPE.letterSpacing.wide, whiteSpace: 'nowrap',
    minHeight: '22px',
  };

  const ACTION_BTN: React.CSSProperties = {
    border: 'none', background: 'transparent', color: COLOR.text.muted,
    cursor: 'pointer', padding: '1px 3px', lineHeight: 1, display: 'inline-flex', alignItems: 'center',
  };

  return (
    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '2px', pointerEvents: 'auto' }}>
      {/* Primary symbol row */}
      <div
        onMouseEnter={() => setHoveredId('__primary')}
        onMouseLeave={() => setHoveredId(null)}
        style={{ ...ROW, cursor: 'text', minWidth: '160px' }}
      >
        {primarySearchOpen ? (
          <>
            <div onClick={() => setPrimarySearchOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 298 }} />
            <div style={{ position: 'relative', zIndex: 299, flex: 1 }}>
              <SymbolSearchInput
                placeholder="Change symbol..."
                onSelect={res => { onChangePrimary(res); setPrimarySearchOpen(false); }}
                onClose={() => setPrimarySearchOpen(false)}
                accessToken={accessToken}
                style={{ height: '22px' }}
              />
            </div>
          </>
        ) : (
          <>
            <span style={{ width: '8px', height: '8px', background: COLOR.semantic.info, flexShrink: 0, display: 'inline-block' }} />
            <span
              onClick={() => setPrimarySearchOpen(true)}
              style={{ color: COLOR.text.primary, fontWeight: TYPE.weight.black, cursor: 'pointer' }}
              title="Change symbol"
            >
              {primaryLabel}
            </span>
            {primary?.exchange && (
              <span style={{ color: COLOR.text.muted }}>· {primary.exchange.replace('NSE_INDEX|', '').replace('NSE_EQ|', '').split('|')[0]}</span>
            )}
            {hoveredId === '__primary' ? (
              <button onClick={() => setPrimarySearchOpen(true)} style={{ ...ACTION_BTN, color: COLOR.text.secondary }} title="Change symbol">
                <Search size={11} />
              </button>
            ) : (
              <>
                {!isComparing && currentPrice > 0 && (
                  <span style={{ color: COLOR.text.secondary }}>₹{currentPrice.toFixed(2)}</span>
                )}
                {!isComparing && <Change value={liveChangePct} format="percent" size="sm" />}
                {isComparing && primaryPct !== null && (
                  <span style={{ color: primaryPct >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                    {primaryPct >= 0 ? '+' : ''}{primaryPct.toFixed(2)}%
                  </span>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Comparison rows */}
      {comparisons.map((s, idx) => {
        const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
        const ld = legendData?.find(l => l.id === s.instrument_key);
        const pct = ld?.pctChange ?? null;
        const isHovered = hoveredId === s.instrument_key;
        const compareLabel = getDisplayTicker({
          ticker: s.ticker,
          name: s.name,
          instrumentKey: s.instrument_key,
        });
        return (
          <div
            key={s.instrument_key}
            onMouseEnter={() => setHoveredId(s.instrument_key)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ ...ROW, opacity: s.hidden ? 0.4 : 1 }}
          >
            <span style={{ width: '8px', height: '8px', background: color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ color: COLOR.text.primary }}>{compareLabel}</span>
            {s.exchange && (
              <span style={{ color: COLOR.text.muted }}>· {s.exchange.replace('NSE_INDEX|', '').replace('NSE_EQ|', '').split('|')[0]}</span>
            )}
            {isHovered ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: SPACE[1] }}>
                <button onClick={() => onToggleHidden(s.instrument_key)} style={ACTION_BTN} title={s.hidden ? 'Show' : 'Hide'}>
                  {s.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
                <button onClick={() => onRemoveCompare(s.instrument_key)} style={{ ...ACTION_BTN, color: COLOR.semantic.down }} title="Remove">
                  <Trash2 size={11} />
                </button>
              </div>
            ) : (
              pct !== null && (
                <span style={{ color: pct >= 0 ? COLOR.semantic.up : COLOR.semantic.down, marginLeft: SPACE[1] }}>
                  {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </span>
              )
            )}
          </div>
        );
      })}

      {/* Add comparison */}
      {addSearchOpen ? (
        <>
          <div onClick={() => setAddSearchOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 298 }} />
          <div style={{ ...ROW, position: 'relative', zIndex: 299 }}>
            <SymbolSearchInput
              placeholder="Add symbol..."
              onSelect={res => { onAddCompare(res); setAddSearchOpen(false); }}
              onClose={() => setAddSearchOpen(false)}
              accessToken={accessToken}
              style={{ height: '22px' }}
            />
          </div>
        </>
      ) : (
        <button
          onClick={() => setAddSearchOpen(true)}
          style={{
            ...ROW, cursor: 'pointer', color: COLOR.text.muted,
            background: 'rgba(0,0,0,0.55)', border: 'none',
            gap: SPACE[1], paddingLeft: '8px',
          }}
        >
          <Plus size={9} />
          <span>Add</span>
        </button>
      )}

    </div>
  );
};


// ── Main ChartWidget ──────────────────────────────────────────────────────────
export const ChartWidget: React.FC = () => {
  const { prices, setInstrumentMeta, accessToken } = useUpstoxStore();
  const { selectedSymbol } = useSelectionStore();

  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activePreset, setActivePreset] = useState<RangePreset>(RANGE_PRESETS[0]);
  const [interval, setInterval] = useState('1minute');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  const [compareSymbols, setCompareSymbols] = useState<CompareSymbol[]>([
    { instrument_key: 'NSE_INDEX|Nifty 50', ticker: 'NIFTY 50', name: 'Nifty 50', exchange: 'NSE_INDEX' },
  ]);
  const [compareDataMap, setCompareDataMap] = useState<Record<string, any[]>>({});
  const [activeIndicators, setActiveIndicators] = useState<IndicatorConfig[]>([]);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

  // Primary inline search (toolbar)
  const [primarySearchActive, setPrimarySearchActive] = useState(false);

  // ─── computed ────────────────────────────────────────────────────────────────

  const daysBack = useMemo(() => {
    if (activePreset.range === 'YTD') return differenceInDays(new Date(), startOfYear(new Date()));
    return activePreset.days;
  }, [activePreset]);

  const displayTicker = useMemo(() => {
    const main = compareSymbols[0];
    if (!main) return '--';
    return getDisplayTicker({
      ticker: main.ticker,
      name: main.name,
      instrumentKey: main.instrument_key,
      fallback: '--',
    });
  }, [compareSymbols]);

  const mainSym = compareSymbols[0];
  const liveFeed = mainSym ? prices[mainSym.instrument_key] : undefined;
  const currentPrice = Number(liveFeed?.ltp ?? 0);
  const liveChangePct = Number(liveFeed?.pChange ?? 0);
  const isComparing = compareSymbols.length > 1;

  // ─── handlers ────────────────────────────────────────────────────────────────

  const handlePresetChange = (preset: RangePreset) => {
    setActivePreset(preset);
    setInterval(preset.interval);
  };

  useEffect(() => {
    if (!selectedSymbol?.instrument_key) return;
    const current = compareSymbols[0];
    if (current?.instrument_key === selectedSymbol.instrument_key) return;
    if (!selectedSymbol.instrument_key) return;
    setCompareSymbols(prev => [
      { instrument_key: selectedSymbol.instrument_key!, ticker: selectedSymbol.ticker, name: selectedSymbol.name || selectedSymbol.ticker, exchange: selectedSymbol.exchange || '' },
      ...prev.slice(1),
    ]);
  }, [selectedSymbol]);

  const changePrimary = (res: UpstoxSearchResult) => {
    setCompareSymbols(prev => [
      { instrument_key: res.instrumentKey, ticker: res.ticker, name: res.name, exchange: res.exchange },
      ...prev.slice(1),
    ]);
    setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
    setPrimarySearchActive(false);
  };

  const addCompare = (res: UpstoxSearchResult) => {
    if (compareSymbols.some(s => s.instrument_key === res.instrumentKey)) return;
    setCompareSymbols(prev => [...prev, {
      instrument_key: res.instrumentKey, ticker: res.ticker,
      name: res.name, exchange: res.exchange,
    }]);
    setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
  };

  const removeCompare = (key: string) => {
    setCompareSymbols(prev => prev.filter(s => s.instrument_key !== key));
    setCompareDataMap(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const toggleHidden = (key: string) => {
    setCompareSymbols(prev => prev.map(s => s.instrument_key === key ? { ...s, hidden: !s.hidden } : s));
  };

  const addIndicator = (type: string, period: number = 14) => {
    const id = `${type}_${period}_${Date.now()}`;
    const COLOR_MAP: Record<string, string> = {
      SMA: '#3b82f6', EMA: '#fbbf24', RSI: '#ec4899',
      BB: '#a855f7', MACD: '#06b6d4', VWAP: '#ffffff',
      STOCH: '#10b981', ATR: '#f43f5e',
    };
    const PANE_MAP: Record<string, 'main' | 'own'> = { RSI: 'own', MACD: 'own', STOCH: 'own', ATR: 'own' };
    setActiveIndicators(prev => [...prev, { id, type: type as any, params: { period }, color: COLOR_MAP[type] || '#888', pane: PANE_MAP[type] || 'main' }]);
    setShowIndicatorMenu(false);
  };

  const removeIndicator = (id: string) => setActiveIndicators(prev => prev.filter(i => i.id !== id));

  // ─── data fetch ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!accessToken || compareSymbols.length === 0) { setChartData([]); setCompareDataMap({}); return; }
    const fetchData = async () => {
      setLoading(true);
      const toDate = format(new Date(), 'yyyy-MM-dd');
      const fromDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');
      const newMap: Record<string, any[]> = {};
      await Promise.all(compareSymbols.map(async (sym, index) => {
        try {
          const res = await upstoxApi.getHistoricalData(accessToken, sym.instrument_key, interval, fromDate, toDate);
          if (res.status === 'success' && res.data?.candles) {
            const isIntraday = interval.includes('minute');
            const toChartTime = (unix: number) => isIntraday ? unix
              : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(unix * 1000));
            const mapped = res.data.candles
              .map((c: any) => ({ time: toChartTime(c[0]), open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5] }))
              .sort((a: any, b: any) => a.time < b.time ? -1 : a.time > b.time ? 1 : 0);
            const deduped: any[] = [];
            for (let i = 0; i < mapped.length; i++) {
              if (i === 0 || mapped[i].time > mapped[i - 1].time) deduped.push(mapped[i]);
            }
            if (index === 0) setChartData(deduped);
            else newMap[sym.instrument_key] = deduped.map(d => ({ time: d.time, close: d.close }));
          }
        } catch {}
      }));
      setCompareDataMap(newMap);
      setLoading(false);
    };
    fetchData();
  }, [compareSymbols, interval, daysBack, accessToken]);

  // ─── derived series data ──────────────────────────────────────────────────────

  const volumeData = useMemo(() => chartData.map(d => ({
    time: d.time, value: d.volume || 0,
    color: d.close >= d.open ? COLOR.chart.volumeUp : COLOR.chart.volumeDown,
  })), [chartData]);

  const calculatedIndicators = useMemo(() => {
    const ohlc = chartData.map(d => ({ time: d.time, close: d.close }));
    if (ohlc.length === 0) return [];
    return activeIndicators.map(ind => {
      let lines: any[] = [];
      if (ind.type === 'SMA') lines = [{ id: 'sma', data: calculateSMASeries(ohlc, ind.params.period), color: ind.color }];
      else if (ind.type === 'EMA') lines = [{ id: 'ema', data: calculateEMASeries(ohlc, ind.params.period), color: ind.color }];
      else if (ind.type === 'RSI') lines = [{ id: 'rsi', data: calculateRSISeries(ohlc, ind.params.period), color: ind.color }];
      else if (ind.type === 'BB') {
        const { upper, middle, lower } = calculateBollingerBandsSeries(ohlc, ind.params.period);
        lines = [
          { id: 'upper', data: upper, color: ind.color, opacity: 0.5 },
          { id: 'middle', data: middle, color: ind.color, dash: [4, 4] },
          { id: 'lower', data: lower, color: ind.color, opacity: 0.5 },
        ];
      } else if (ind.type === 'MACD') {
        const { macd, signal, histogram } = calculateMACDSeries(ohlc);
        lines = [
          { id: 'macd', data: macd, color: '#2563eb' },
          { id: 'signal', data: signal, color: '#dc2626' },
          { id: 'hist', data: histogram, color: '#10b981', type: 'histogram' },
        ];
      } else if (ind.type === 'VWAP') {
        const full = chartData.map(d => ({ time: d.time, close: d.close, volume: d.volume }));
        lines = [{ id: 'vwap', data: calculateVWAPSeries(full), color: ind.color }];
      } else if (ind.type === 'STOCH') {
        const full = chartData.map(d => ({ time: d.time, high: d.high, low: d.low, close: d.close }));
        const { k, d: dLine } = calculateStochasticSeries(full);
        lines = [{ id: 'k', data: k, color: '#3b82f6' }, { id: 'd', data: dLine, color: '#f59e0b' }];
      } else if (ind.type === 'ATR') {
        const full = chartData.map(d => ({ time: d.time, high: d.high, low: d.low, close: d.close }));
        lines = [{ id: 'atr', data: calculateATRSeries(full), color: ind.color }];
      }
      return { ...ind, lines };
    });
  }, [chartData, activeIndicators]);

  const comparisonProps = useMemo(() => compareSymbols.slice(1)
    .filter(s => !s.hidden)
    .map((s, idx) => ({
      id: s.instrument_key,
      ticker: s.ticker,
      color: COMPARE_COLORS[compareSymbols.slice(1).indexOf(s) % COMPARE_COLORS.length],
      data: compareDataMap[s.instrument_key] || [],
    })), [compareSymbols, compareDataMap]);

  const legendData = useMemo(() => {
    if (!isComparing) return null;
    const allSeries = [
      { id: 'main', label: displayTicker, color: COLOR.semantic.info, vals: chartData.map(d => d.close) },
      ...compareSymbols.slice(1).map((s, idx) => ({
        id: s.instrument_key,
        label: getDisplayTicker({ ticker: s.ticker, name: s.name, instrumentKey: s.instrument_key }),
        color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
        vals: (compareDataMap[s.instrument_key] || []).map((d: any) => d.close),
      })),
    ];
    return allSeries.map(s => {
      if (s.vals.length < 2) return { ...s, pctChange: null };
      const pctChange = ((s.vals[s.vals.length - 1] - s.vals[0]) / s.vals[0]) * 100;
      return { ...s, pctChange };
    });
  }, [isComparing, displayTicker, chartData, compareSymbols, compareDataMap]);

  const startDate = chartData.length > 0
    ? format(typeof chartData[0].time === 'string' ? new Date(chartData[0].time) : new Date(chartData[0].time * 1000), 'dd/MM/yyyy')
    : '';

  // ─── render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.base, overflow: 'hidden' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <Toolbar stretch>

        {/* Symbol search — adds to compare list */}
        <div style={{ position: 'relative', height: '100%', borderRight: BORDER.standard, flexShrink: 0 }}>
          {primarySearchActive ? (
            <>
              <div onClick={() => setPrimarySearchActive(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
              <div style={{ position: 'relative', zIndex: 99, height: '100%' }}>
                <SymbolSearchInput
                  placeholder="Add symbol..."
                  onSelect={res => { addCompare(res); setPrimarySearchActive(false); }}
                  onClose={() => setPrimarySearchActive(false)}
                  accessToken={accessToken}
                  style={{ height: '100%' }}
                />
              </div>
            </>
          ) : (
            <button
              onClick={() => setPrimarySearchActive(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: SPACE[2],
                padding: `0 ${LAYOUT.cellPadH}`, height: '100%', cursor: 'text',
                background: 'transparent', border: 'none',
                fontFamily: TYPE.family.mono,
              }}
              title="Add symbol to compare"
              className="hover:bg-interactive-hover"
            >
              <Search size={11} style={{ color: COLOR.text.muted, flexShrink: 0 }} />
              <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.wide, whiteSpace: 'nowrap' }}>
                {displayTicker}
              </span>
              {currentPrice > 0 && <>
                <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.secondary, fontWeight: TYPE.weight.bold }}>
                  ₹{currentPrice.toFixed(2)}
                </span>
                <Change value={liveChangePct} format="percent" size="sm" />
              </>}
            </button>
          )}
        </div>

        {/* Range buttons */}
        <div style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
          {RANGE_PRESETS.map(preset => (
            <button key={preset.range} onClick={() => handlePresetChange(preset)} style={rangeBtn(activePreset.range === preset.range)} className="hover:bg-interactive-hover">
              {preset.label}
            </button>
          ))}
        </div>

        <Divider orientation="vertical" />

        {/* Interval dropdown */}
        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'stretch' }}>
          <select
            value={interval}
            onChange={e => setInterval(e.target.value)}
            style={{
              height: '100%', padding: `0 ${LAYOUT.cellPadH}`, paddingRight: '1.25rem',
              background: 'transparent', border: 'none', color: COLOR.semantic.info,
              fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono,
              cursor: 'pointer', outline: 'none', letterSpacing: TYPE.letterSpacing.wide,
              appearance: 'none', WebkitAppearance: 'none',
            }}
          >
            {INTERVAL_OPTIONS.map(o => (
              <option key={o.value} value={o.value} style={{ background: COLOR.bg.elevated, color: COLOR.text.primary }}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={10} style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', color: COLOR.semantic.info, pointerEvents: 'none' }} />
        </div>

        <Divider orientation="vertical" />

        {/* Chart type */}
        <button onClick={() => setChartType('candle')} style={rangeBtn(chartType === 'candle')} className="hover:bg-interactive-hover" title="Candlestick"><BarChart2 size={12} /></button>
        <button onClick={() => setChartType('line')} style={rangeBtn(chartType === 'line')} className="hover:bg-interactive-hover" title="Line"><LineChart size={12} /></button>

        <Divider orientation="vertical" />

        {/* Indicators */}
        <div style={{ position: 'relative', height: '100%' }}>
          <button
            onClick={() => setShowIndicatorMenu(v => !v)}
            style={{ ...rangeBtn(activeIndicators.length > 0), display: 'inline-flex', alignItems: 'center', gap: SPACE[1], height: '100%' }}
            className="hover:bg-interactive-hover"
          >
            <span style={{ fontStyle: 'italic', fontFamily: 'serif', fontSize: '13px', lineHeight: 1, color: COLOR.semantic.info }}>ƒx</span>
            {activeIndicators.length > 0 ? `Ind (${activeIndicators.length})` : 'Indicators'}
          </button>
          {showIndicatorMenu && (
            <>
              <div onClick={() => setShowIndicatorMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
              <div style={{ position: 'absolute', top: '100%', left: 0, background: COLOR.bg.overlay, border: BORDER.standard, zIndex: 200, minWidth: '140px' }}>
                {INDICATOR_LIST.map(item => (
                  <button key={item.label} onClick={() => addIndicator(item.type, item.period)}
                    style={{ display: 'block', width: '100%', padding: '5px 12px', textAlign: 'left', background: 'transparent', border: 'none', color: COLOR.text.secondary, fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold, cursor: 'pointer' }}
                    className="hover:bg-interactive-hover hover:text-text-primary"
                  >{item.label}</button>
                ))}
                {activeIndicators.length > 0 && (
                  <>
                    <div style={{ borderTop: BORDER.standard, margin: '2px 0' }} />
                    {activeIndicators.map(ind => (
                      <div key={ind.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 12px' }}>
                        <span style={{ color: ind.color, fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.black }}>{ind.type} {ind.params.period}</span>
                        <button onClick={() => removeIndicator(ind.id)} style={{ border: 'none', background: 'transparent', color: COLOR.text.muted, cursor: 'pointer', padding: '1px', lineHeight: 1 }} className="hover:text-red-400"><X size={10} /></button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </Toolbar>

      {/* ── Chart area ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {!accessToken ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <Text color="muted" weight="bold">Api disconnected</Text>
            <Button size="sm" variant="primary" onClick={() => (window as any).replaceTab?.('api')}>Connect api</Button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <TradingViewChart
                data={chartData}
                volumeData={volumeData}
                comparisonData={comparisonProps}
                indicators={calculatedIndicators}
                isLoading={loading}
                chartType={chartType}
                interval={interval}
                range={activePreset.range}
              />
              {/* Floating series legend */}
              <SeriesLegend
                compareSymbols={compareSymbols}
                legendData={legendData}
                currentPrice={currentPrice}
                liveChangePct={liveChangePct}
                isComparing={isComparing}
                accessToken={accessToken}
                onChangePrimary={changePrimary}
                onAddCompare={addCompare}
                onRemoveCompare={removeCompare}
                onToggleHidden={toggleHidden}
              />
            </div>

            {/* Normalized legend strip */}
            {isComparing && legendData && legendData.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', flexWrap: 'wrap',
                gap: `0 ${SPACE[4]}`, padding: `${SPACE[1]} ${LAYOUT.cellPadH}`,
                borderTop: BORDER.standard, background: COLOR.bg.base,
                flexShrink: 0, minHeight: '1.75rem',
              }}>
                {startDate && (
                  <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold, letterSpacing: TYPE.letterSpacing.wide, whiteSpace: 'nowrap', marginRight: SPACE[2] }}>
                    Normalized as of {startDate}
                  </span>
                )}
                {legendData.map(s => (
                  <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE[1], whiteSpace: 'nowrap' }}>
                    <span style={{ width: '12px', height: '2px', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.black, color: s.color }}>{s.label}</span>
                    {s.pctChange !== null && (
                      <span style={{ fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold, color: s.pctChange >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                        {s.pctChange >= 0 ? '+' : ''}{s.pctChange.toFixed(3)}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
