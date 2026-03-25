import React, { useState, useEffect } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { useMarketHours } from '../../hooks/useMarketHours';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Clock, AlertTriangle } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

interface FIIDIIEntry {
  category: string;
  buyValue: number;
  sellValue: number;
  netValue: number;
  date: string;
}

const FIIDIITracker: React.FC = () => {
  const { isMarketOpen } = useMarketHours();
  const { data, isLoading, error } = useNSEData<FIIDIIEntry[]>('/api/fiidiiTradeReact', {
    pollingInterval: 5 * 60 * 1000, 
    enabled: true,
  });

  const [flashAmber, setFlashAmber] = useState(false);
  const [lastFiiNet, setLastFiiNet] = useState<number | null>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const fii = data.find(d => d.category === 'FII/FPI');
      if (fii) {
        if (lastFiiNet !== null && lastFiiNet > 0 && fii.netValue < 0) {
          setFlashAmber(true);
          const timer = setTimeout(() => setFlashAmber(false), 5000);
          return () => clearTimeout(timer);
        }
        setLastFiiNet(fii.netValue);
      }
    }
  }, [data, lastFiiNet]);

  if (isLoading && !data) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.bg.base, color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>
        <Clock className="animate-pulse" size={14} style={{ marginRight: '8px' }} />
        POLLING_FII_DII...
      </div>
    );
  }

  const fii = data?.find(d => d.category === 'FII/FPI') || { buyValue: 0, sellValue: 0, netValue: 0, date: '' };
  const dii = data?.find(d => d.category === 'DII') || { buyValue: 0, sellValue: 0, netValue: 0, date: '' };

  const formatCr = (val: number) => `₹${(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })} CR`;

  const DataRow = ({ label, buy, sell, net }: any) => {
    const isNetPositive = net >= 0;
    const netColor = isNetPositive ? COLOR.semantic.up : COLOR.semantic.down;
    
    return (
      <div style={{ marginBottom: SPACE[3], borderLeft: `2px solid ${netColor}` }} className="p-2 hover:bg-bg-elevated transition-colors">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>{label}</span>
          <span style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: netColor, fontVariantNumeric: 'tabular-nums' }}>
             {isNetPositive ? '+' : ''}{formatCr(net)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '10px' }}>
          <div style={{ borderRight: BORDER.standard, paddingRight: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: COLOR.text.muted }}>BUY</span>
            <span style={{ color: COLOR.text.primary, fontVariantNumeric: 'tabular-nums' }}>{formatCr(buy)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: COLOR.text.muted }}>SELL</span>
            <span style={{ color: COLOR.text.primary, fontVariantNumeric: 'tabular-nums' }}>{formatCr(sell)}</span>
          </div>
        </div>
        {/* Flat Meter Bar */}
        <div style={{ height: '2px', background: COLOR.bg.surface, marginTop: '8px', position: 'relative' }}>
           <div 
             style={{ 
               position: 'absolute',
               top: 0,
               height: '100%',
               background: netColor,
               width: `${Math.min(Math.abs(net) / (Math.max(buy, sell) || 1) * 100, 100)}%`,
               left: isNetPositive ? '50%' : 'auto',
               right: !isNetPositive ? '50%' : 'auto'
             }}
           />
           <div style={{ position: 'absolute', left: '50%', top: '-2px', width: '1px', height: '6px', background: COLOR.text.muted }} />
        </div>
      </div>
    );
  };

  const mockChartData = Array.from({ length: 40 }, (_, i) => ({
    time: `${9 + Math.floor(i / 6)}:${(i % 6) * 10}`,
    nifty: 24000 + (Math.sin(i / 5) * 200) + (i * 20),
    fiiNet: (Math.cos(i / 4) * 500) - 200,
  }));

  return (
    <div style={{ 
      padding: SPACE[4], 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: flashAmber ? `${COLOR.semantic.warning}10` : 'transparent',
      border: flashAmber ? `1px solid ${COLOR.semantic.warning}` : 'none',
      fontFamily: TYPE.family.mono,
      transition: 'all 0.5s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE[4] }}>
        <h4 style={{ fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isMarketOpen ? <span style={{ width: '6px', height: '6px', background: COLOR.semantic.up }}/> : <Clock size={10}/>}
          {isMarketOpen ? 'LIVE MARKET' : 'PRIOR SESSION'} | {fii.date || 'DATELINE'}
        </h4>
        {error && (
            <div style={{ fontSize: '9px', color: COLOR.semantic.down, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={8} />
                STALE | {new Date().toLocaleTimeString()}
            </div>
        )}
      </div>

      <DataRow label="FOREIGN INSTITUTIONS (FII)" buy={fii.buyValue} sell={fii.sellValue} net={fii.netValue} />
      <DataRow label="DOMESTIC INSTITUTIONS (DII)" buy={dii.buyValue} sell={dii.sellValue} net={dii.netValue} />

      <div style={{ flex: 1, marginTop: SPACE[4], minHeight: '120px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <ComposedChart data={mockChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLOR.bg.elevated} vertical={false}/>
            <XAxis dataKey="time" hide />
            <YAxis yAxisId="left" hide orientation="left" />
            <YAxis yAxisId="right" hide orientation="right" />
            <Tooltip 
              contentStyle={{ backgroundColor: COLOR.bg.surface, border: BORDER.standard, fontSize: '10px', borderRadius: 0, padding: '4px 8px' }}
              labelStyle={{ color: COLOR.text.muted, marginBottom: '2px', fontWeight: 'bold' }}
              itemStyle={{ padding: 0 }}
            />
            <Bar yAxisId="right" dataKey="fiiNet" fill={COLOR.semantic.info} opacity={0.3} isAnimationActive={false} />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="nifty" 
              stroke={COLOR.text.primary} 
              strokeWidth={1} 
              dot={false} 
              isAnimationActive={false}
            />
            <ReferenceLine yAxisId="right" y={0} stroke={COLOR.text.muted} strokeWidth={0.5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FIIDIITracker;
