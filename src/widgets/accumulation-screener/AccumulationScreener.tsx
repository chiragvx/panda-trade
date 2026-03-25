import React, { useMemo, useState } from 'react';
import { useGlobalStore } from '../../store/globalStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Plus, Search, Clock, ShieldCheck } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

interface Setup {
  symbol: string;
  score: number;
  price: number;
  change1d: number;
  history: { val: number }[];
}

const AccumulationScreener: React.FC = () => {
  const { addToWatchlist, watchlist } = useGlobalStore();
  const { prices, instrumentMeta } = useUpstoxStore();
  const [lastScanTime, setLastScanTime] = useState<string>(new Date().toLocaleTimeString('en-IN'));
  const [isScanning, setIsScanning] = useState(false);

  const setups = useMemo<Setup[]>(() => {
    return Object.keys(prices)
      .map((key) => buildSymbolFromFeed(key, prices[key], instrumentMeta[key]))
      .map((symbol) => {
        const score = Math.max(0, Math.min(100, Math.round(Math.abs(symbol.changePct) * 10)));
        return {
          symbol: symbol.ticker,
          score,
          price: symbol.ltp,
          change1d: symbol.changePct,
          history: Array.from({ length: 15 }, () => ({ val: symbol.ltp })),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }, [prices, instrumentMeta]);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScanTime(new Date().toLocaleTimeString('en-IN'));
    }, 700);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, fontFamily: TYPE.family.mono, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={12} style={{ color: COLOR.semantic.up }} /> ACCUMULATION_SCREENER
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
            letterSpacing: TYPE.letterSpacing.caps,
          }}
          className="hover:opacity-90 active:opacity-100 disabled:opacity-50"
        >
          {isScanning ? <Clock size={12} className="animate-spin" /> : <Search size={12} />}
          {isScanning ? 'RUNNING...' : 'EXECUTE'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: SPACE[4] }} className="custom-scrollbar">
        {setups.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: COLOR.text.muted, fontSize: '10px', textTransform: 'uppercase' }}>
            NO LIVE SCREENER DATA
          </div>
        ) : (
          setups.map((setup, idx) => (
            <div key={idx} style={{ marginBottom: SPACE[4], background: COLOR.bg.surface, border: BORDER.standard, padding: SPACE[3], position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: SPACE[3] }}>
                <div>
                  <span style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{setup.symbol}</span>
                  <span style={{ display: 'block', fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase', marginTop: '2px' }}>
                    {setup.change1d >= 0 ? '+' : ''}{setup.change1d.toFixed(2)}%
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>SCORE</div>
                  <div style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: setup.score > 70 ? COLOR.semantic.up : COLOR.semantic.info }}>{setup.score}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[4], alignItems: 'center', marginBottom: SPACE[3] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span style={{ color: COLOR.text.muted }}>PRICE</span>
                  <span style={{ color: COLOR.text.primary }}>₹{setup.price.toFixed(2)}</span>
                </div>
                <div style={{ height: '32px' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={setup.history}>
                      <Area type="stepAfter" dataKey="val" stroke={COLOR.semantic.info} strokeWidth={1} fill="transparent" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

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
                    gap: '6px',
                  }}
                  className="hover:text-text-primary"
                >
                  <Plus size={10} />
                  {watchlist.includes(setup.symbol) ? 'WATCHING' : 'WATCHLIST'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccumulationScreener;
