import React from 'react';
import { useSelectionStore } from '../../store/useStore';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';

export const GenericStub: React.FC<{ name: string; category: string }> = ({ name, category }) => {
  const { selectedSymbol } = useSelectionStore();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', background: COLOR.bg.surface, gap: '12px', padding: '24px',
    }}>
      <div style={{
        padding: '2px 8px', border: `1px solid ${COLOR.bg.border}`,
        fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted,
        letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase',
      }}>
        {category}
      </div>
      <span style={{
        fontFamily: TYPE.family.mono, fontSize: TYPE.size.xl, fontWeight: TYPE.weight.bold,
        color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: '-0.02em',
      }}>
        {name}
      </span>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 12px',
        border: BORDER.standard, width: '200px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>SYMBOL</span>
          <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.semantic.info }}>{selectedSymbol?.ticker || '---'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>STATUS</span>
          <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.semantic.up }}>MOCK</span>
        </div>
        <div style={{ height: '1px', background: COLOR.bg.border }} />
        <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted, textAlign: 'center' }}>
          WIDGET COMING SOON
        </span>
      </div>
    </div>
  );
};

// Market Data Stubs
export const IndicesStub = () => <GenericStub name="Indices" category="Market Data" />;
export const DepthStub = () => <GenericStub name="Market Depth" category="Market Data" />;
export const ETFStub = () => <GenericStub name="ETF Scanner" category="Market Data" />;
export const HeatmapStub = () => <GenericStub name="Heatmap" category="Market Data" />;
export const TickerTapeStub = () => <GenericStub name="Ticker Tape" category="Market Data" />;

// Analytics Stubs
export const OIGraphStub = () => <GenericStub name="OI Graph" category="Charts & Analytics" />;
export const IVChartStub = () => <GenericStub name="IV Chart" category="Charts & Analytics" />;
export const VolatilitySkewStub = () => <GenericStub name="Volatility Skew" category="Charts & Analytics" />;
export const TechnicalsStub = () => <GenericStub name="Technicals" category="Charts & Analytics" />;
export const CandlePatternsStub = () => <GenericStub name="Candlestick Patterns" category="Charts & Analytics" />;
export const VWapStub = () => <GenericStub name="VWAP" category="Charts & Analytics" />;

// Options Stubs
export const OptionsChainStub = () => <GenericStub name="Options Chain" category="Options" />;
export const StraddleChainStub = () => <GenericStub name="Straddle Chain" category="Options" />;
export const FuturesChainStub = () => <GenericStub name="Futures Chain" category="Options" />;
export const OptionScalperStub = () => <GenericStub name="Option Scalper" category="Options" />;

// Account Stubs
export const SuperOrdersStub = () => <GenericStub name="Super Orders" category="Account" />;
export const NotificationsStub = () => <GenericStub name="Notifications" category="Account" />;

// Scalping Stubs
export const ScalperStub = () => <GenericStub name="Scalper" category="Scalping" />;
export const TimeSalesStub = () => <GenericStub name="Time & Sales" category="Scalping" />;

// Tools Stubs
export const LiveScannerStub = () => <GenericStub name="Live Scanner" category="Tools" />;
export const CorpActionsStub = () => <GenericStub name="Corporate Actions" category="Tools" />;
export const FundamentalsStub = () => <GenericStub name="Fundamentals" category="Tools" />;
