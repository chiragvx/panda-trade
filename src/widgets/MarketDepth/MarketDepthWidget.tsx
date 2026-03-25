import React, { useMemo, useState } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { motion } from 'framer-motion';

const EMPTY_TAPE_TRADES: Array<{ time: string; price: number; qty: number; side: 'BUY' | 'SELL' }> = [];

export const MarketDepthWidget: React.FC = () => {
  const { selectedSymbol } = useSelectionStore();
  const { prices } = useUpstoxStore();
  const [view, setView] = useState<'DEPTH' | 'TAPE'>('DEPTH');
  const selectedKey = selectedSymbol?.instrument_key || '';
  const liveFeed = selectedKey ? prices[selectedKey] : undefined;

  const ltp = selectedKey
    ? Number(liveFeed?.ltp ?? selectedSymbol?.ltp ?? 0)
    : Number(selectedSymbol?.ltp ?? 0);

  const depth = useMemo(
    () => {
      const buy = Array.isArray(liveFeed?.depth?.buy) ? liveFeed?.depth?.buy : [];
      const sell = Array.isArray(liveFeed?.depth?.sell) ? liveFeed?.depth?.sell : [];
      const rows = Math.max(5, buy.length, sell.length);

      return Array.from({ length: rows }, (_, i) => ({
        bidPrice: Number(buy[i]?.price ?? 0),
        bidQty: Number(buy[i]?.quantity ?? 0),
        bidOrders: Number(buy[i]?.orders ?? 0),
        askPrice: Number(sell[i]?.price ?? 0),
        askQty: Number(sell[i]?.quantity ?? 0),
        askOrders: Number(sell[i]?.orders ?? 0),
      }));
    },
    [liveFeed?.depth]
  );

  const totalBidQty = depth.reduce((acc, d) => acc + d.bidQty, 0);
  const totalAskQty = depth.reduce((acc, d) => acc + d.askQty, 0);
  const combined = totalBidQty + totalAskQty;
  const bidR = combined > 0 ? (totalBidQty / combined) * 100 : 0;
  const spread = useMemo(() => {
    const first = depth[0];
    if (first && first.askPrice > 0 && first.bidPrice > 0) {
      return first.askPrice - first.bidPrice;
    }
    const bid = Number(liveFeed?.bid ?? 0);
    const ask = Number(liveFeed?.ask ?? 0);
    if (bid > 0 && ask > 0) {
      return ask - bid;
    }
    return 0;
  }, [depth, liveFeed?.ask, liveFeed?.bid]);

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
    height: '24px',
    alignItems: 'center',
    padding: '0 8px',
    borderBottom: BORDER.standard,
    fontFamily: TYPE.family.mono,
    fontSize: '11px',
  };

  const headerStyle: React.CSSProperties = {
    ...rowStyle,
    height: '22px',
    background: COLOR.bg.elevated,
    color: COLOR.text.muted,
    fontSize: '9px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface, overflow: 'hidden' }}>
      <div style={{ height: '32px', padding: '0 8px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: COLOR.bg.elevated }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: COLOR.text.primary, fontWeight: 'bold' }}>MARKET DEPTH</span>
          <div style={{ border: BORDER.standard, display: 'flex', height: '20px' }}>
            <button onClick={() => setView('DEPTH')} style={{ border: 'none', background: view === 'DEPTH' ? COLOR.interactive.hover : 'transparent', color: view === 'DEPTH' ? COLOR.text.primary : COLOR.text.muted, fontSize: '9px', padding: '0 8px', cursor: 'pointer', fontFamily: TYPE.family.mono }}>L2</button>
            <button onClick={() => setView('TAPE')} style={{ border: 'none', background: view === 'TAPE' ? COLOR.interactive.hover : 'transparent', color: view === 'TAPE' ? COLOR.text.primary : COLOR.text.muted, fontSize: '9px', padding: '0 8px', cursor: 'pointer', fontFamily: TYPE.family.mono }}>TAPE</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: COLOR.text.primary, fontWeight: 'bold' }}>{selectedSymbol?.ticker || '--'}</span>
          <span style={{ fontSize: '10px', color: COLOR.text.muted }}>₹{ltp.toFixed(2)}</span>
        </div>
      </div>

      {view === 'DEPTH' ? (
        <>
          <div style={{ padding: '8px', borderBottom: BORDER.standard }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: TYPE.family.mono, marginBottom: '4px' }}>
              <span style={{ color: COLOR.semantic.up }}>BID: {totalBidQty.toLocaleString()}</span>
              <span style={{ color: COLOR.semantic.down }}>ASK: {totalAskQty.toLocaleString()}</span>
            </div>
            <div style={{ height: '4px', background: COLOR.semantic.down, display: 'flex', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${bidR}%` }} style={{ background: COLOR.semantic.up, height: '100%' }} />
            </div>
          </div>

          <div style={headerStyle}>
            <span>ORDERS</span>
            <span>QTY</span>
            <span>BID</span>
            <span style={{ textAlign: 'right' }}>ASK</span>
            <span style={{ textAlign: 'right' }}>QTY</span>
            <span style={{ textAlign: 'right' }}>ORDERS</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {depth.map((d, i) => (
              <div key={i} style={rowStyle}>
                <span style={{ color: COLOR.text.muted }}>{d.bidOrders}</span>
                <span style={{ color: COLOR.text.primary }}>{d.bidQty}</span>
                <span style={{ color: COLOR.semantic.up }}>{d.bidPrice.toFixed(2)}</span>
                <span style={{ textAlign: 'right', color: COLOR.semantic.down }}>{d.askPrice.toFixed(2)}</span>
                <span style={{ textAlign: 'right', color: COLOR.text.primary }}>{d.askQty}</span>
                <span style={{ textAlign: 'right', color: COLOR.text.muted }}>{d.askOrders}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={headerStyle}>
            <span style={{ gridColumn: 'span 2' }}>TIME</span>
            <span style={{ gridColumn: 'span 2' }}>PRICE</span>
            <span style={{ gridColumn: 'span 2', textAlign: 'right' }}>QTY</span>
          </div>
          {EMPTY_TAPE_TRADES.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: COLOR.text.muted, fontSize: '10px', fontFamily: TYPE.family.mono }}>NO TAPE DATA</div>
          ) : (
            EMPTY_TAPE_TRADES.map((t, i) => (
              <div key={i} style={{ ...rowStyle, gridTemplateColumns: 'repeat(6, 1fr)' }}>
                <span style={{ gridColumn: 'span 2', color: COLOR.text.muted }}>{t.time}</span>
                <span style={{ gridColumn: 'span 2', color: t.side === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down }}>{t.price.toFixed(2)}</span>
                <span style={{ gridColumn: 'span 2', textAlign: 'right', color: COLOR.text.primary }}>{t.qty}</span>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ height: '24px', borderTop: BORDER.standard, display: 'flex', alignItems: 'center', padding: '0 8px', justifyContent: 'space-between', fontFamily: TYPE.family.mono, fontSize: '10px', background: COLOR.bg.elevated }}>
        <span style={{ color: COLOR.text.muted }}>
          SPREAD: <span style={{ color: COLOR.text.primary }}>{spread.toFixed(2)}</span>
        </span>
        <span style={{ color: COLOR.text.muted }}>
          RATIO: <span style={{ color: COLOR.text.primary }}>{bidR.toFixed(1)}% / {(100 - bidR).toFixed(1)}%</span>
        </span>
      </div>
    </div>
  );
};
