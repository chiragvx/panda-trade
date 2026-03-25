import React, { useState } from 'react';
import { useMockMovers, useMockTrending } from '../../mock/hooks';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { COLOR, TYPE, ROW_HEIGHT, BORDER } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Price } from '../../ds/components/Price';
import { Button } from '../../ds/components/Button';
import { Badge } from '../../ds/components/Badge';

/* ─── SHARED ROW ─────────────────────────────────────────────── */
const DenseRow: React.FC<{
  ticker: string; ltp: number; pct: number; vol?: string;
  onBuy: () => void; onSell: () => void;
}> = ({ ticker, ltp, pct, vol, onBuy, onSell }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', height: ROW_HEIGHT.compact,
        borderBottom: BORDER.standard, position: 'relative', overflow: 'hidden',
        background: hovered ? COLOR.interactive.hover : 'transparent',
        borderLeft: hovered ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent',
        transition: 'background 80ms linear', cursor: 'default',
        paddingLeft: hovered ? '6px' : '8px',
      }}
    >
      <span style={{ flex: 1, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.medium, color: COLOR.text.primary, textTransform: 'uppercase' }}>
        {ticker}
      </span>
      <span style={{ width: '60px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>
        {ltp.toLocaleString('en-IN')}
      </span>
      <Change value={pct} format="percent" size="sm" />
      <span style={{ width: '8px' }} />
      {/* Row actions */}
      {hovered && (
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: '2px', padding: '0 4px', background: COLOR.interactive.hover }}>
          <Button variant="buy" size="xs" onClick={e => { e.stopPropagation(); onBuy(); }}>B</Button>
          <Button variant="sell" size="xs" onClick={e => { e.stopPropagation(); onSell(); }}>S</Button>
        </div>
      )}
    </div>
  );
};

const ColHdr: React.FC<{ label: string; w?: number; flex?: boolean; align?: 'left'|'right' }> = ({ label, w, flex, align = 'left' }) => (
  <span style={{
    ...(flex ? { flex: 1 } : { width: w }),
    display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
    fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted,
    letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase',
    paddingLeft: align === 'left' ? '8px' : 0, paddingRight: align === 'right' ? '6px' : 0,
  }}>{label}</span>
);

/* ─── MOVERS ─────────────────────────────────────────────────── */
export const MoversWidget: React.FC = () => {
  const { gainers, losers } = useMockMovers();
  const { openOrderModal } = useLayoutStore();
  const { setSelectedSymbol } = useSelectionStore();
  const [tab, setTab] = useState<'GAINERS' | 'LOSERS' | 'VOLUME'>('GAINERS');
  const active = tab === 'GAINERS' ? gainers : tab === 'LOSERS' ? losers : [...gainers, ...losers].sort((a, b) => b.changePct - a.changePct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: BORDER.standard, flexShrink: 0, height: ROW_HEIGHT.header }}>
        {(['GAINERS', 'LOSERS', 'VOLUME'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, background: 'transparent', border: 'none',
            borderBottom: tab === t ? `1px solid ${COLOR.semantic.info}` : '1px solid transparent',
            fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, letterSpacing: TYPE.letterSpacing.caps,
            textTransform: 'uppercase', cursor: 'pointer',
            color: tab === t ? COLOR.text.primary : COLOR.text.muted,
            transition: 'color 80ms linear',
          }}>{t}</button>
        ))}
      </div>
      {/* Column headers */}
      <div style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
        <ColHdr label="SYMBOL" flex />
        <ColHdr label="LTP" w={60} align="right" />
        <ColHdr label="%CHG" w={56} align="right" />
      </div>
      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {active.slice(0, 20).map(s => (
          <DenseRow key={s.ticker} ticker={s.ticker} ltp={s.ltp} pct={s.changePct}
            onBuy={() => { setSelectedSymbol(s); openOrderModal('BUY'); }}
            onSell={() => { setSelectedSymbol(s); openOrderModal('SELL'); }}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── TRENDING ───────────────────────────────────────────────── */
export const TrendingWidget: React.FC = () => {
  const trending = useMockTrending();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface }}>
      <div style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
        <ColHdr label="SYMBOL" flex />
        <ColHdr label="LTP" w={72} align="right" />
        <ColHdr label="%CHG" w={56} align="right" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {trending.map(s => (
          <DenseRow key={s.ticker} ticker={s.ticker} ltp={s.ltp} pct={s.changePct}
            onBuy={() => {}} onSell={() => {}}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── POSITIONS ──────────────────────────────────────────────── */
export const PositionsWidget: React.FC = () => {
  const { openOrderModal } = useLayoutStore();
  const positions = [
    { ticker: 'RELIANCE', qty: 50,  avg: 2450.40, ltp: 2510.30, pnl: 2995.00  },
    { ticker: 'HDFCBANK', qty: 120, avg: 1510.20, ltp: 1490.10, pnl: -2412.00 },
    { ticker: 'INFY',     qty: 75,  avg: 1420.00, ltp: 1445.50, pnl: 1912.50  },
    { ticker: 'TCS',      qty: 30,  avg: 3480.00, ltp: 3521.80, pnl: 1254.00  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface }}>
      <div style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
        <ColHdr label="SYMBOL" flex />
        <ColHdr label="QTY"  w={40} align="right" />
        <ColHdr label="AVG"  w={64} align="right" />
        <ColHdr label="LTP"  w={64} align="right" />
        <ColHdr label="P&L"  w={80} align="right" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {positions.map((p, i) => {
          const pct = ((p.ltp - p.avg) / p.avg) * 100;
          const [hov, setHov] = useState(false);
          return (
            <div key={i}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{
                display: 'flex', alignItems: 'center', height: ROW_HEIGHT.relaxed,
                borderBottom: BORDER.standard, position: 'relative', overflow: 'hidden',
                background: hov ? COLOR.interactive.hover : 'transparent',
                borderLeft: hov ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent',
                transition: 'background 80ms linear', cursor: 'default',
                paddingLeft: hov ? '6px' : '8px',
              }}
            >
              <span style={{ flex: 1, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.medium, color: COLOR.text.primary, textTransform: 'uppercase' }}>
                {p.ticker}
              </span>
              <span style={{ width: '40px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>
                {p.qty}
              </span>
              <span style={{ width: '64px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>
                {p.avg.toFixed(2)}
              </span>
              <span style={{ width: '64px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.primary }}>
                {p.ltp.toFixed(2)}
              </span>
              <div style={{ width: '80px', textAlign: 'right', paddingRight: '6px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Change value={p.pnl} format="absolute" size="sm" />
                <Change value={pct} format="percent" size="xs" />
              </div>
              {hov && (
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: '2px', padding: '0 4px', background: COLOR.interactive.hover }}>
                  <Button variant="buy" size="xs" onClick={e => { e.stopPropagation(); openOrderModal('BUY'); }}>ADD</Button>
                  <Button variant="sell" size="xs" onClick={e => { e.stopPropagation(); openOrderModal('SELL'); }}>EXIT</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Footer summary */}
      <div style={{ padding: '3px 8px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>TOTAL P&L</span>
        <Change value={positions.reduce((acc, p) => acc + p.pnl, 0)} format="absolute" size="sm" />
      </div>
    </div>
  );
};

/* ─── ORDERS ─────────────────────────────────────────────────── */
export const OrdersWidget: React.FC = () => {
  const orders = [
    { ticker: 'TCS',     type: 'BUY',  qty: 10,  price: 3450.00, status: 'PENDING',   time: '10:42:15' },
    { ticker: 'INFY',    type: 'SELL', qty: 100, price: 1520.50, status: 'EXECUTED',  time: '09:15:02' },
    { ticker: 'HDFC',    type: 'BUY',  qty: 25,  price: 1490.00, status: 'CANCELLED', time: '09:02:44' },
    { ticker: 'NIFTY50', type: 'SELL', qty: 50,  price:  240.00, status: 'EXECUTED',  time: '08:58:30' },
  ];

  const statusVariant: Record<string, 'status-pending' | 'status-executed' | 'status-cancelled'> = {
    PENDING: 'status-pending', EXECUTED: 'status-executed', CANCELLED: 'status-cancelled',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface }}>
      <div style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
        <ColHdr label="TIME"   w={52} />
        <ColHdr label="SYMBOL" flex />
        <ColHdr label="SIDE"   w={28} align="right" />
        <ColHdr label="QTY"    w={44} align="right" />
        <ColHdr label="PRICE"  w={64} align="right" />
        <ColHdr label="STATUS" w={72} align="right" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {orders.map((o, i) => {
          const [hov, setHov] = useState(false);
          return (
            <div key={i}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{
                display: 'flex', alignItems: 'center', height: ROW_HEIGHT.default,
                borderBottom: BORDER.standard, position: 'relative', overflow: 'hidden',
                background: hov ? COLOR.interactive.hover : 'transparent',
                transition: 'background 80ms linear',
              }}
            >
              <span style={{ width: '52px', paddingLeft: '8px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>{o.time}</span>
              <span style={{ flex: 1, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.medium, color: COLOR.text.primary, textTransform: 'uppercase' }}>{o.ticker}</span>
              <span style={{ width: '28px', textAlign: 'center', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: o.type === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down }}>{o.type === 'BUY' ? 'B' : 'S'}</span>
              <span style={{ width: '44px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>{o.qty}</span>
              <span style={{ width: '64px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.primary }}>{o.price.toFixed(2)}</span>
              <div style={{ width: '72px', textAlign: 'right', paddingRight: '6px' }}>
                <Badge label={o.status} variant={statusVariant[o.status]} />
              </div>
              {hov && (
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: '2px', padding: '0 4px', background: COLOR.interactive.hover }}>
                  <Button variant="ghost" size="xs">MODIFY</Button>
                  <Button variant="danger" size="xs">CANCEL</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── PORTFOLIO ──────────────────────────────────────────────── */
export const PortfolioWidget: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: COLOR.bg.surface, gap: '8px' }}>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase' }}>
      PORTFOLIO ANALYTICS
    </span>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>
      Monte Carlo projections loading...
    </span>
  </div>
);

/* ─── BASKET ─────────────────────────────────────────────────── */
export const BasketWidget: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: COLOR.bg.surface, gap: '6px' }}>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase' }}>BASKET ORDERS</span>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>Batch multiple orders for simultaneous execution.</span>
  </div>
);

/* ─── PRICE LADDER ───────────────────────────────────────────── */
export const PriceLadderWidget: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: COLOR.bg.surface, gap: '6px' }}>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.semantic.down, letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase', border: `1px solid ${COLOR.semantic.down}`, padding: '2px 6px' }}>
      MARKET CLOSED
    </span>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.muted }}>Price ladder unavailable outside session.</span>
  </div>
);
