import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useFearGreedData } from './useFearGreedData';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { Loader2, AlertCircle } from 'lucide-react';

const FearIndex: React.FC = () => {
  const { score, components, loading, error } = useFearGreedData();

  const getStatus = (s: number) => {
    if (s < 20) return { label: 'EXTREME FEAR', color: COLOR.semantic.down };
    if (s < 40) return { label: 'FEAR', color: '#ff7700' };
    if (s < 60) return { label: 'NEUTRAL', color: COLOR.semantic.warning };
    if (s < 80) return { label: 'GREED', color: '#88ff00' };
    return { label: 'EXTREME GREED', color: COLOR.semantic.up };
  };

  const status = getStatus(score);
  const history = Array.from({ length: 7 }, () => ({ val: score }));

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.bg.base }}>
        <Loader2 className="animate-spin" size={24} color={COLOR.text.muted} />
      </div>
    );
  }

  if (error) {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLOR.bg.base, padding: '20px', textAlign: 'center' }}>
          <AlertCircle size={32} color={COLOR.semantic.down} style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: COLOR.text.primary, marginBottom: '4px' }}>CALCULATION_ERROR</div>
          <div style={{ fontSize: '9px', color: COLOR.text.muted }}>{error}</div>
        </div>
    );
  }

  const componentLabels: Record<string, string> = {
    volatility: 'India VIX Relative Scale',
    marketMomentum: 'Nifty 50 SMA Momentum',
    riskAppetite: 'Midcap vs Largecap Ratio',
    optionsSentiment: 'Nifty Put-Call Ratio (PCR)',
    safeHaven: 'Gold vs Equity flows'
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: SPACE[4], background: COLOR.bg.base, overflowY: 'auto', fontFamily: TYPE.family.mono }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 100 55" style={{ width: '80%', overflow: 'visible' }}>
          <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke={COLOR.bg.elevated} strokeWidth="10" />
          <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke={status.color} strokeWidth="10" strokeDasharray={`${(score / 100) * 125.6} 125.6`} style={{ transition: 'stroke-dasharray 1s ease-out' }} />
          <g
            style={{
              transform: `rotate(${(score / 100) * 180}deg)`,
              transformOrigin: '50px 50px',
              transition: 'transform 1s ease-out',
            }}
          >
            <line x1="50" y1="50" x2="10" y2="50" stroke={COLOR.text.primary} strokeWidth="1.5" />
            <circle cx="50" cy="50" r="2" fill={COLOR.text.primary} />
          </g>
        </svg>

        <div style={{ position: 'absolute', top: '45%', textAlign: 'center', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ fontSize: '24px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary, fontVariantNumeric: 'tabular-nums', margin: 0, lineHeight: 1 }}>
            {Math.round(score)}
          </div>
          <div
            style={{
              fontSize: '9px',
              fontWeight: TYPE.weight.bold,
              color: status.color,
              border: `1px solid ${status.color}40`,
              background: COLOR.bg.surface,
              padding: '2px 8px',
              textTransform: 'uppercase',
              marginTop: '4px',
              letterSpacing: TYPE.letterSpacing.caps,
              borderRadius: '2px'
            }}
          >
            {status.label}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2], marginTop: SPACE[6] }}>
        {Object.entries(components).map(([key, val]) => (
          <div key={key} style={{ padding: '6px 8px', borderLeft: `2px solid ${getStatus(val).color}`, background: COLOR.bg.surface }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase' }}>{componentLabels[key] || key}</span>
              <span style={{ fontSize: '10px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{Math.round(val)}%</span>
            </div>
            <div style={{ height: '2px', background: COLOR.bg.elevated, width: '100%' }}>
              <div
                style={{
                  height: '100%',
                  background: getStatus(val).color,
                  width: `${val}%`,
                  transition: 'width 1s ease-out',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: SPACE[4], borderTop: BORDER.standard, height: '48px', minHeight: '48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-4px', right: 0, fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, background: COLOR.bg.base, padding: '0 4px', textTransform: 'uppercase' }}>
          LAST_7D_AVERAGE
        </div>
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={history}>
            <Area type="stepAfter" dataKey="val" stroke={status.color} strokeWidth={1} fill={status.color} fillOpacity={0.05} baseValue="dataMin" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FearIndex;
