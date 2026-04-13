import React, { useMemo } from 'react';
import axios from 'axios';
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
    background: COLOR.bg.elevated, 
    border: BORDER.standard, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px',
    transition: 'border-color 0.1s linear',
    cursor: 'default',
    borderRadius: '2px'
  }} className="hover:border-interactive-focus">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps }}>{label}</span>
      {icon}
    </div>
    <span style={{ fontSize: '14px', fontWeight: TYPE.weight.black, color: color || COLOR.text.primary, fontFamily: TYPE.family.mono }}>{value}</span>
    {subValue && <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>{subValue}</span>}
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

  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!activeSymbol?.ticker) return;
    
    const fetchTradient = async () => {
      setIsLoading(true);
      try {
        // Tradient direct API (guessing symbol param or check documentation)
        // Most Indian market APIs at Tradient take the ticker without prefix
        const cleanTicker = activeSymbol.ticker.split('|').pop() || activeSymbol.ticker;
        const resp = await axios.get(`https://api.tradient.org/v1/api/market/fundamentals`, {
            params: { symbol: cleanTicker }
        });
        if (resp.data?.data) setData(resp.data.data);
      } catch (err) {
        console.error('Tradient fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTradient();
  }, [activeSymbol]);

  const fundamentals = useMemo(() => {
    if (!data) return null;
    return {
        marketCap: data.market_cap || '---',
        pe: data.pe_ratio || '---',
        pb: data.pb_ratio || '---',
        divYield: data.dividend_yield ? `${data.dividend_yield}%` : '---',
        beta: data.beta || '---',
        eps: data.eps || '---',
        high52: data.high_52week || '---',
        low52: data.low_52week || '---',
    };
  }, [data]);


  return (
    <WidgetShell>
        <WidgetShell.Toolbar style={{ height: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.tight }}>{displayTicker}</span>
                        <span style={{ fontSize: TYPE.size.xs, padding: '1px 6px', background: COLOR.bg.surface, border: BORDER.standard, color: COLOR.text.muted, fontWeight: TYPE.weight.black, borderRadius: '2px', letterSpacing: TYPE.letterSpacing.caps }}>{activeSymbol.exchange}</span>
                    </div>
                    <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>{displayName}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Price value={ltp} size="lg" weight="black" />
                    <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>LAST_SIGNAL (UPSTOX)</div>
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
                        style={{ background: 'transparent', border: 'none', color: COLOR.semantic.down, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, cursor: 'pointer', letterSpacing: TYPE.letterSpacing.caps }}
                    >
                        RESET_GLOBAL
                    </button>
                )}
            </div>
        </WidgetShell.Toolbar>

        <div style={{ flex: 1, overflowY: 'auto', padding: SPACE[4] }} className="custom-scrollbar">
            {isLoading ? (
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.black }}>FETCHING_TRADIENT_DATA...</span>
                </div>
            ) : !data ? (
                <div style={{ padding: '24px', textAlign: 'center', background: COLOR.bg.elevated, border: BORDER.standard, borderRadius: '2px' }}>
                    <AlertCircle size={24} color={COLOR.text.muted} style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.primary, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>FUNDAMENTALS_NOT_FOUND</div>
                    <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, marginTop: '4px', fontWeight: TYPE.weight.bold }}>Symbol "{activeSymbol.ticker}" not indexed in Tradient API.</div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: SPACE[4] }}>
                        <MetricCard label="MARKET CAP" value={fundamentals?.marketCap || ''} icon={<PieChart size={12} style={{ color: COLOR.text.muted }} />} />
                        <MetricCard label="P/E RATIO" value={fundamentals?.pe || ''} icon={<Activity size={12} style={{ color: COLOR.text.muted }} />} />
                        <MetricCard label="P/B RATIO" value={fundamentals?.pb || ''} icon={<BarChart3 size={12} style={{ color: COLOR.text.muted }} />} />
                        <MetricCard label="DIV YIELD" value={fundamentals?.divYield || ''} icon={<DollarSign size={12} style={{ color: COLOR.text.muted }} />} />
                    </div>

                    <div style={{ marginBottom: SPACE[4] }}>
                        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps, display: 'block', marginBottom: '8px' }}>52_WEEK_RANGE</span>
                        <div style={{ background: COLOR.bg.elevated, padding: '16px', border: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '2px' }}>
                            <div>
                                <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>LOW</div>
                                <div style={{ fontSize: '12px', fontWeight: TYPE.weight.black, color: COLOR.semantic.down, fontFamily: TYPE.family.mono }}>{fundamentals?.low52}</div>
                            </div>
                            <div style={{ flex: 1, height: '4px', background: COLOR.bg.surface, margin: '0 16px', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                                 <div style={{ position: 'absolute', inset: 0, background: COLOR.bg.border }} />
                            </div>
                            <div>
                                <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>HIGH</div>
                                <div style={{ fontSize: '12px', fontWeight: TYPE.weight.black, color: COLOR.semantic.up, fontFamily: TYPE.family.mono }}>{fundamentals?.high52}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: SPACE[4] }}>
                        <MetricCard label="BETA (1Y)" value={fundamentals?.beta || ''} icon={<Shield size={12} style={{ color: COLOR.text.muted }} />} />
                        <MetricCard label="EPS (TTM)" value={fundamentals?.eps || ''} icon={<TrendingUp size={12} style={{ color: COLOR.text.muted }} />} />
                    </div>
                </>
            )}
        </div>

        <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.elevated }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={12} color={COLOR.text.muted} />
                <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>DATA_REALTIME</span>
            </div>
            <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.semantic.info, letterSpacing: TYPE.letterSpacing.caps }}>ANALYTICS: V2.1</span>
        </div>
    </WidgetShell>
  );
};

