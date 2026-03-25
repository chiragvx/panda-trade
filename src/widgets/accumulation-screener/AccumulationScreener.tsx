import React, { useState } from 'react';
import { useGlobalStore } from '../../store/globalStore';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Zap, Plus, Search, Clock, ShieldCheck } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

interface Setup {
  symbol: string;
  sector: string;
  score: number;
  reasons: string[];
  price: number;
  change1d: number;
  delivery: number;
  history: { val: number }[];
}

const AccumulationScreener: React.FC = () => {
  const { addToWatchlist, watchlist } = useGlobalStore();
  const [lastScanTime, setLastScanTime] = useState<string>('09:25:14 IST');
  const [isScanning, setIsScanning] = useState(false);

  const [setups] = useState<Setup[]>([
    {
      symbol: 'TATASTEEL',
      sector: 'STEEL',
      score: 92,
      reasons: ['DELIVERY 71% VS 42% AVG', 'VOLUME 2.1× NORM', 'NO FILINGS IN 8 DAYS'],
      price: 148.5,
      change1d: 0.2,
      delivery: 71.4,
      history: Array.from({ length: 15 }, () => ({ val: 145 + Math.random() * 5 }))
    },
    {
      symbol: 'SBIN',
      sector: 'BANKS',
      score: 88,
      reasons: ['PRICE CONSOLIDATED 1.2% RANGE', 'DELIVERY 64%', 'LARGE BLOCKS DETECTED'],
      price: 752.4,
      change1d: -0.1,
      delivery: 64.8,
      history: Array.from({ length: 15 }, () => ({ val: 740 + Math.random() * 20 }))
    },
    {
      symbol: 'WIPRO',
      sector: 'IT_SERVICES',
      score: 85,
      reasons: ['MULTIPLE GREEN VOLUME BARS', 'RETAIL EXIT SIGNAL', 'NO FILINGS (5D)'],
      price: 482.1,
      change1d: 0.5,
      delivery: 62.5,
      history: Array.from({ length: 15 }, () => ({ val: 470 + Math.random() * 15 }))
    }
  ]);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScanTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
    }, 1500);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, fontFamily: TYPE.family.mono, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={12} style={{ color: COLOR.semantic.up }} /> QUANT_SCREENER_V4
           </div>
           <div style={{ fontSize: '9px', color: COLOR.text.muted, marginTop: '2px' }}>LAST_RUN: {lastScanTime}</div>
        </div>
        <button 
          onClick={runScan}
          disabled={isScanning}
          style={{ 
            background: COLOR.semantic.info,
            border: 'none',
            color: COLOR.text.inverse,
            fontSize: '9px',
            fontWeight: TYPE.weight.bold,
            padding: '4px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: TYPE.letterSpacing.caps
          }}
          className="hover:opacity-90 active:opacity-100 disabled:opacity-50"
        >
          {isScanning ? <Clock size={12} className="animate-spin" /> : <Search size={12} />}
          {isScanning ? 'RUNNING...' : 'EXECUTE'}
        </button>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: SPACE[4] }} className="custom-scrollbar">
        {setups.map((setup, idx) => (
          <div 
            key={idx} 
            style={{ 
              marginBottom: SPACE[4], 
              background: COLOR.bg.surface, 
              border: BORDER.standard, 
              padding: SPACE[3],
              position: 'relative'
            }}
          >
            {/* Symbol Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: SPACE[3] }}>
               <div>
                  <span style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{setup.symbol}</span>
                  <span style={{ display: 'block', fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase', marginTop: '2px' }}>{setup.sector}</span>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>SCORE</div>
                  <div style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: setup.score > 90 ? COLOR.semantic.up : COLOR.semantic.info }}>{setup.score}</div>
               </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[4], alignItems: 'center', marginBottom: SPACE[3] }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderBottom: BORDER.standard, paddingBottom: '2px' }}>
                     <span style={{ color: COLOR.text.muted }}>DELIVERY</span>
                     <span style={{ color: COLOR.semantic.up, fontWeight: TYPE.weight.bold }}>{setup.delivery}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                     <span style={{ color: COLOR.text.muted }}>PRICE</span>
                     <span style={{ color: COLOR.text.primary }}>₹{setup.price}</span>
                  </div>
               </div>
               <div style={{ height: '32px' }}>
                 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                   <AreaChart data={setup.history}>
                     <Area type="stepAfter" dataKey="val" stroke={COLOR.semantic.info} strokeWidth={1} fill="transparent" isAnimationActive={false} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Reasons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: SPACE[3] }}>
               {setup.reasons.map((reason, i) => (
                  <div key={i} style={{ fontSize: '8px', color: COLOR.text.secondary, background: COLOR.bg.elevated, padding: '2px 6px', border: BORDER.standard, display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <Zap size={8} style={{ color: COLOR.semantic.warning }} /> {reason}
                  </div>
               ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1px', background: COLOR.bg.border }}>
               <button 
                onClick={() => addToWatchlist(setup.symbol)}
                style={{ 
                  flex: 1, 
                  background: COLOR.bg.elevated, 
                  border: 'none', 
                  color: watchlist.includes(setup.symbol) ? COLOR.semantic.up : COLOR.text.muted,
                  fontSize: '9px',
                  fontWeight: TYPE.weight.bold,
                  padding: '6px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                className="hover:text-text-primary"
               >
                  {watchlist.includes(setup.symbol) ? <ShieldCheck size={10} /> : <Plus size={10} />}
                  {watchlist.includes(setup.symbol) ? 'WATCHING' : 'WATCHLIST'}
               </button>
               <button style={{ 
                 flex: 0.4, 
                 background: COLOR.bg.elevated, 
                 border: 'none', 
                 color: COLOR.text.muted,
                 fontSize: '9px',
                 fontWeight: TYPE.weight.bold,
                 padding: '6px 0',
                 cursor: 'pointer'
               }} className="hover:text-text-primary">
                  CHART
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccumulationScreener;
