import React, { useMemo } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { BarChart3, TrendingUp, Info, DollarSign, Activity, PieChart, Shield, AlertCircle } from 'lucide-react';
import { isIsin } from '../../utils/liveSymbols';

const MetricCard: React.FC<{ label: string; value: string; subValue?: string; icon?: React.ReactNode; color?: string }> = ({ label, value, subValue, icon, color }) => (
  <div style={{ 
    padding: '12px', 
    background: '#09090b', 
    border: BORDER.standard, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px',
    transition: 'border-color 0.2s',
    cursor: 'default'
  }} className="hover:border-interactive-focus">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '9px', fontWeight: '900', color: COLOR.text.muted, letterSpacing: '0.1em' }}>{label}</span>
      {icon}
    </div>
    <span style={{ fontSize: '14px', fontWeight: 'bold', color: color || '#FFF', fontFamily: TYPE.family.mono }}>{value}</span>
    {subValue && <span style={{ fontSize: '9px', color: COLOR.text.muted }}>{subValue}</span>}
  </div>
);

export const FundamentalsWidget: React.FC = () => {
  const { selectedSymbol } = useSelectionStore();
  const { prices } = useUpstoxStore();

  const ltp = useMemo(() => {
    if (!selectedSymbol) return 0;
    return prices[selectedSymbol.instrument_key || '']?.ltp || selectedSymbol.ltp || 0;
  }, [selectedSymbol, prices]);

  // Handle ISIN vs Proper Name
  const displayTicker = useMemo(() => {
    if (!selectedSymbol) return '';
    return isIsin(selectedSymbol.ticker) ? (selectedSymbol.name || 'INSTRUMENT') : selectedSymbol.ticker;
  }, [selectedSymbol]);

  const displayName = useMemo(() => {
    if (!selectedSymbol) return '';
    if (isIsin(selectedSymbol.ticker)) return 'UPSTOX_EQUITY_DATA';
    return selectedSymbol.name || 'INSTRUMENT OVERVIEW';
  }, [selectedSymbol]);

  // Purged mock data - awaiting API integration for fundamentals
  const fundamentals = useMemo(() => {
    if (!selectedSymbol) return null;
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
  }, [selectedSymbol]);

  if (!selectedSymbol) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLOR.text.muted, fontSize: '11px', fontFamily: TYPE.family.mono }}>
        SELECT A SYMBOL TO VIEW FUNDAMENTALS
      </div>
    );
  }

  return (
    <div style={{ height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header Summary */}
      <div style={{ padding: '12px 16px', borderBottom: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050505' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#FFF' }}>{displayTicker}</span>
                <span style={{ fontSize: '9px', padding: '1px 4px', background: COLOR.interactive.hover, borderRadius: '2px', color: COLOR.text.muted }}>{selectedSymbol.exchange}</span>
            </div>
            <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: 'medium' }}>{displayName}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: COLOR.semantic.info, fontFamily: TYPE.family.mono }}>₹{ltp.toFixed(2)}</span>
            <div style={{ fontSize: '10px', color: COLOR.text.muted }}>LAST PRICE (UPSTOX)</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scrollbar">
        {/* Core Multipliers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <MetricCard label="MARKET CAP" value={fundamentals?.marketCap || ''} icon={<PieChart size={12} color={COLOR.text.muted} />} />
            <MetricCard label="P/E RATIO" value={fundamentals?.pe || ''} icon={<Activity size={12} color={COLOR.text.muted} />} />
            <MetricCard label="P/B RATIO" value={fundamentals?.pb || ''} icon={<BarChart3 size={12} color={COLOR.text.muted} />} />
            <MetricCard label="DIV YIELD" value={fundamentals?.divYield || ''} icon={<DollarSign size={12} color={COLOR.text.muted} />} />
        </div>

        {/* Technical Context Status */}
        <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '9px', fontWeight: '900', color: COLOR.text.muted, letterSpacing: '0.15em', display: 'block', marginBottom: '8px' }}>52 WEEK RANGE</span>
            <div style={{ background: '#09090b', padding: '16px', border: BORDER.standard }}>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>UPSTOX_FUNDAMENTALS_API: DISCONNECTED</span>
                </div>
            </div>
        </div>

        {/* Risk & Performance */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <MetricCard label="BETA (1Y)" value={fundamentals?.beta || ''} icon={<Shield size={12} color={COLOR.text.muted} />} />
            <MetricCard label="EPS (TTM)" value={fundamentals?.eps || ''} icon={<TrendingUp size={12} color={COLOR.text.muted} />} />
        </div>

        {/* Info Banner */}
        <div style={{ padding: '16px', background: `${COLOR.semantic.info}05`, border: `1px dashed ${COLOR.semantic.info}33`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={14} color={COLOR.semantic.info} />
                <span style={{ fontSize: '10px', fontWeight: '900', color: COLOR.semantic.info, letterSpacing: '0.1em' }}>AWAITING DATA SOURCE</span>
            </div>
            <p style={{ fontSize: '11px', color: COLOR.text.muted, lineHeight: '1.4', margin: 0 }}>
                Fundamental data (Balance Sheet and Income Metrics) are not available via the basic Upstox V2 Quote stream. 
                Full integration requires a TickerTape or AlphaVantage API key.
            </p>
        </div>
      </div>

      <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={11} color={COLOR.text.muted} />
            <span style={{ fontSize: '8px', color: COLOR.text.muted }}>DATA REFRESHED: REAL-TIME</span>
        </div>
        <span style={{ fontSize: '8px', fontWeight: 'bold', color: COLOR.semantic.info }}>ANALYTICS ENGINE V2</span>
      </div>
    </div>
  );
};
