import React, { useMemo } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { BarChart3, TrendingUp, Info, DollarSign, Activity, PieChart, Shield, AlertCircle, Search } from 'lucide-react';
import { isIsin } from '../../utils/liveSymbols';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { EmptyState } from '../../ds/components/EmptyState';
import { Price } from '../../ds/components/Price';

const MetricCard: React.FC<{ label: string; value: string; subValue?: string; icon?: React.ReactNode; color?: string }> = ({ label, value, subValue, icon, color }) => (
  <div style={{ 
    padding: SPACE[3], 
    background: COLOR.bg.surface, 
    border: BORDER.standard, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px',
    transition: 'border-color 0.2s',
    cursor: 'default'
  }} className="hover:border-interactive-focus">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted, letterSpacing: '0.1em' }}>{label}</span>
      {icon}
    </div>
    <span style={{ fontSize: '14px', fontWeight: TYPE.weight.bold, color: color || COLOR.text.primary, fontFamily: TYPE.family.mono }}>{value}</span>
    {subValue && <span style={{ fontSize: '9px', color: COLOR.text.muted }}>{subValue}</span>}
  </div>
);
import { NIFTY_50 } from '../../utils/defaultSymbol';

export const FundamentalsWidget: React.FC = () => {
  const { selectedSymbol: globalSymbol } = useSelectionStore();
  const [localSymbol, setLocalSymbol] = React.useState<any>(null);
  
  const activeSymbol = localSymbol || globalSymbol || NIFTY_50;
  const { prices, setInstrumentMeta } = useUpstoxStore();

  const ltp = useMemo(() => {
    if (!activeSymbol) return 0;
    return prices[activeSymbol.instrument_key || '']?.ltp || activeSymbol.ltp || 0;
  }, [activeSymbol, prices]);

  const displayTicker = useMemo(() => {
    if (!activeSymbol) return '';
    return isIsin(activeSymbol.ticker) ? (activeSymbol.name || 'INSTRUMENT') : activeSymbol.ticker;
  }, [activeSymbol]);

  const displayName = useMemo(() => {
    if (!activeSymbol) return '';
    if (isIsin(activeSymbol.ticker)) return 'UPSTOX_EQUITY_DATA';
    return activeSymbol.name || 'INSTRUMENT OVERVIEW';
  }, [activeSymbol]);

  const fundamentals = useMemo(() => {
    if (!activeSymbol) return null;
    return {
        marketCap: '---',
        pe: '---',
        pb: '---',
        divYield: '---',
        beta: '---',
        eps: '---',
        sector: 'NOT_AVAILABLE',
        industry: 'NOT_AVAILABLE',
        high52: '---',
        low52: '---',
    };
  }, [activeSymbol]);


  return (
    <WidgetShell>
        <WidgetShell.Toolbar style={{ height: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: TYPE.weight.black, color: COLOR.text.primary }}>{displayTicker}</span>
                        <span style={{ fontSize: '9px', padding: '1px 4px', background: COLOR.bg.elevated, border: BORDER.standard, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>{activeSymbol.exchange}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: TYPE.weight.medium }}>{displayName}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Price value={ltp} size="lg" weight="bold" />
                    <div style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>LAST_SIGNAL (UPSTOX)</div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: BORDER.standard, paddingTop: '8px', width: '100%' }}>
                <WidgetSymbolSearch 
                    onSelect={(res) => {
                        setLocalSymbol({ instrument_key: res.instrumentKey, ticker: res.ticker, name: res.name, exchange: res.exchange });
                        setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
                    }} 
                    placeholder="SEARCH..." 
                />
                {localSymbol && (
                    <button 
                        onClick={() => setLocalSymbol(null)}
                        style={{ background: 'transparent', border: 'none', color: COLOR.semantic.down, fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        RESET_TO_GLOBAL
                    </button>
                )}
            </div>
        </WidgetShell.Toolbar>

        <div style={{ flex: 1, overflowY: 'auto', padding: SPACE[4] }} className="custom-scrollbar">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: SPACE[4] }}>
                <MetricCard label="MARKET CAP" value={fundamentals?.marketCap || ''} icon={<PieChart size={12} style={{ color: COLOR.text.muted }} />} />
                <MetricCard label="P/E RATIO" value={fundamentals?.pe || ''} icon={<Activity size={12} style={{ color: COLOR.text.muted }} />} />
                <MetricCard label="P/B RATIO" value={fundamentals?.pb || ''} icon={<BarChart3 size={12} style={{ color: COLOR.text.muted }} />} />
                <MetricCard label="DIV YIELD" value={fundamentals?.divYield || ''} icon={<DollarSign size={12} style={{ color: COLOR.text.muted }} />} />
            </div>

            <div style={{ marginBottom: SPACE[4] }}>
                <span style={{ fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted, letterSpacing: '0.15em', display: 'block', marginBottom: '8px' }}>52 WEEK RANGE</span>
                <div style={{ background: COLOR.bg.surface, padding: '16px', border: BORDER.standard }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>UPSTOX_FUNDAMENTALS_API: DISCONNECTED</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: SPACE[4] }}>
                <MetricCard label="BETA (1Y)" value={fundamentals?.beta || ''} icon={<Shield size={12} style={{ color: COLOR.text.muted }} />} />
                <MetricCard label="EPS (TTM)" value={fundamentals?.eps || ''} icon={<TrendingUp size={12} style={{ color: COLOR.text.muted }} />} />
            </div>

            <div style={{ padding: '16px', background: `${COLOR.semantic.info}05`, border: `1px dashed ${COLOR.semantic.info}40`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={14} style={{ color: COLOR.semantic.info }} />
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.semantic.info, letterSpacing: '0.1em' }}>AWAITING DATA SOURCE</span>
                </div>
                <p style={{ fontSize: '11px', color: COLOR.text.muted, lineHeight: '1.4', margin: 0 }}>
                    Fundamental data (Balance Sheet and Income Metrics) are not available via the basic Upstox V2 Quote stream. 
                    Full integration requires a TickerTape or AlphaVantage API key.
                </p>
            </div>
        </div>

        <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={11} style={{ color: COLOR.text.muted }} />
                <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>DATA_REFRESHED: REAL-TIME</span>
            </div>
            <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.info }}>ANALYTICS ENGINE V2</span>
        </div>
    </WidgetShell>
  );
};

