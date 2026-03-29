import React from 'react';
import { Database } from 'lucide-react';
import { useSelectionStore } from '../../store/useStore';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';

export const GenericStub: React.FC<{ name: string; category: string }> = ({ name, category }) => {
  const { selectedSymbol } = useSelectionStore();
  
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', background: COLOR.bg.surface, gap: '16px', padding: '24px',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLOR.text.muted
      }}>
        <Database size={20} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: TYPE.family.mono, fontSize: '10px', color: COLOR.text.muted,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px'
        }}>
          {category} / {name}
        </div>
        <div style={{
          fontFamily: TYPE.family.mono, fontSize: '12px', fontWeight: 'bold',
          color: '#fff', textTransform: 'uppercase'
        }}>
          NO_API_DATA_STREAM
        </div>
        {selectedSymbol && (
          <div style={{ fontSize: '10px', color: COLOR.semantic.info, marginTop: '4px', fontFamily: TYPE.family.mono }}>
            LISTENING FOR: {selectedSymbol.ticker}
          </div>
        )}
      </div>
    </div>
  );
};

// Market Data Stubs
export const IndicesStub = () => <GenericStub name="Indices" category="Market Data" />;
export const DepthStub = () => <GenericStub name="Market Depth" category="Market Data" />;
export const ETFStub = () => <GenericStub name="ETF Scanner" category="Market Data" />;
export const HeatmapStub = () => <GenericStub name="Heatmap" category="Market Data" />;

// Analytics Stubs
export const OIGraphStub = () => <GenericStub name="OI Graph" category="Charts & Analytics" />;
export const IVChartStub = () => <GenericStub name="IV Chart" category="Charts & Analytics" />;
export const VolatilitySkewStub = () => <GenericStub name="Volatility Skew" category="Charts & Analytics" />;
export const TechnicalsStub = () => <GenericStub name="Technicals" category="Charts & Analytics" />;
export const VWapStub = () => <GenericStub name="VWAP" category="Charts & Analytics" />;

// Options Stubs
export const StraddleChainStub = () => <GenericStub name="Straddle Chain" category="Options" />;
export const FuturesChainStub = () => <GenericStub name="Futures Chain" category="Options" />;

// Account Stubs
export const NotificationsStub = () => <GenericStub name="Notifications" category="Account" />;

// Scalping Stubs
export const ScalperStub = () => <GenericStub name="Scalper" category="Scalping" />;
export const TimeSalesStub = () => <GenericStub name="Time & Sales" category="Scalping" />;

// Tools Stubs
export const CorpActionsStub = () => <GenericStub name="Corporate Actions" category="Tools" />;
export const FundamentalsStub = () => <GenericStub name="Fundamentals" category="Tools" />;
