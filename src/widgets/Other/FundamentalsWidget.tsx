import React, { useMemo } from 'react';
import axios from 'axios';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER, SPACE, Text } from '../../ds';
import { BarChart3, TrendingUp, Info, DollarSign, Activity, PieChart, Shield, AlertCircle, Search, Percent, TrendingDown, Target } from 'lucide-react';
import { isIsin } from '../../utils/liveSymbols';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { Price } from '../../ds/components/Price';
import { NIFTY_50 } from '../../utils/defaultSymbol';

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
      <div style={{ color: color || COLOR.text.muted }}>{icon}</div>
    </div>
    <span style={{ fontSize: '14px', fontWeight: TYPE.weight.black, color: color || COLOR.text.primary, fontFamily: TYPE.family.mono }}>{value}</span>
    {subValue && <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>{subValue}</span>}
  </div>
);

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
    if (isIsin(activeSymbol.ticker)) return 'EQUITY_INTELLIGENCE';
    return activeSymbol.name || 'INSTRUMENT OVERVIEW';
  }, [activeSymbol]);

  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
    if (!activeSymbol?.ticker) return;
    
    const fetchTradient = async () => {
      setIsLoading(true);
      setData(null); 
      try {
        let ticker = activeSymbol.ticker.split('|').pop() || activeSymbol.ticker;
        ticker = ticker.toUpperCase().replace(/\s+/g, '');
        if (ticker === 'NIFTY50') ticker = 'NIFTY';
        if (ticker === 'NIFTYBANK') ticker = 'BANKNIFTY';
        if (ticker === 'NIFTYFINSERVICE') ticker = 'FINNIFTY';
        
        const resp = await axios.get(`https://api.tradient.org/v1/api/market/fundamentals`, {
            params: { symbol: ticker }
        });
        if (resp.data?.data) setData(resp.data.data);
      } catch (err: any) {
        console.error('Tradient fetch failed:', err.message);
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
        roe: data.roe || '---',
        sector: data.sector || 'GENERAL'
    };
  }, [data]);

  return (
    <WidgetShell>
        <WidgetShell.Toolbar style={{ height: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.tight }}>{displayTicker}</span>
                        <span style={{ fontSize: '10px', padding: '1px 6px', background: COLOR.bg.surface, border: BORDER.standard, color: COLOR.text.muted, fontWeight: TYPE.weight.black, borderRadius: '2px', letterSpacing: TYPE.letterSpacing.caps }}>{activeSymbol.exchange}</span>
                    </div>
                    <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>{displayName}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Price value={ltp} size="lg" weight="black" />
                    <div style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>LIVE_EQUITY_FEED</div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: BORDER.standard, paddingTop: '8px', width: '100%' }}>
                <WidgetSymbolSearch 
                    onSelect={(res) => {
                        setLocalSymbol({ instrument_key: res.instrumentKey, ticker: res.ticker, name: res.name, exchange: res.exchange });
                        setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
                    }} 
                    placeholder="SEARCH_EQUITY..." 
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

        <div style={{ flex: 1, padding: SPACE[4], overflowY: 'auto', background: COLOR.bg.base }} className="custom-scrollbar">
            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', opacity: 0.5 }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: COLOR.semantic.info, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <Text size="xs" weight="black">QUERYING_INSTITUTIONAL_DATA...</Text>
                </div>
            ) : fundamentals ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[3] }}>
                    <MetricCard label="Mkt Cap" value={fundamentals.marketCap} icon={<DollarSign size={13} />} />
                    <MetricCard label="P/E Ratio" value={fundamentals.pe} icon={<TrendingUp size={13} />} color={COLOR.semantic.info} />
                    <MetricCard label="P/B Ratio" value={fundamentals.pb} icon={<BarChart3 size={13} />} />
                    <MetricCard label="Div Yield" value={fundamentals.divYield} icon={<Percent size={13} />} />
                    <MetricCard label="EPS" value={fundamentals.eps} icon={<Target size={13} />} color={COLOR.semantic.up} />
                    <MetricCard label="Beta (5Y)" value={fundamentals.beta} icon={<Activity size={13} />} />
                    <MetricCard label="52W High" value={fundamentals.high52} icon={<TrendingUp size={13} />} color={COLOR.semantic.up} />
                    <MetricCard label="52W Low" value={fundamentals.low52} icon={<TrendingDown size={13} />} color={COLOR.semantic.down} />
                    <MetricCard label="ROE%" value={fundamentals.roe} icon={<PieChart size={13} />} />
                    <MetricCard label="Sector" value={fundamentals.sector} icon={<Shield size={13} />} />
                    
                    <div style={{ gridColumn: 'span 2', padding: SPACE[4], background: `${COLOR.semantic.info}11`, border: BORDER.standard, borderRadius: '2px', borderLeft: `2px solid ${COLOR.semantic.info}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Info size={14} color={COLOR.semantic.info} />
                            <Text size="xs" weight="black" color="info">MARKET_INTELLIGENCE</Text>
                        </div>
                        <Text size="xs" color="secondary" weight="bold">The above data is sourced from global institutional providers. Coverage is focused on major indices and primary equity tickers.</Text>
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center' }}>
                    <div style={{ 
                        width: '48px', height: '48px', borderRadius: '50%', background: COLOR.bg.elevated, 
                        border: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '16px', color: COLOR.text.muted
                    }}>
                        <Search size={24} />
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps, marginBottom: '8px' }}>DATA_UNAVAILABLE</div>
                    <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold, textAlign: 'center', maxWidth: '240px' }}>
                        NO FUNDAMENTAL DATA FOR {displayTicker}. ASSET MAY BE A NON-EQUITY INSTRUMENT OR OUTSIDE ANALYTICS COVERAGE.
                    </div>
                </div>
            )}
        </div>

        <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.elevated }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={12} color={fundamentals ? COLOR.semantic.up : COLOR.text.muted} />
                <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>{fundamentals ? 'DATA_SYNC_ACTIVE' : 'SYSTEM_IDLE'}</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.muted, opacity: 0.5, letterSpacing: TYPE.letterSpacing.caps }}>MOD_FUND: V3.2_PRODUCTION</span>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </WidgetShell>
  );
};
