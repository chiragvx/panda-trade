import React, { useMemo, useState } from 'react';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, ROW_HEIGHT, BORDER } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { Badge } from '../../ds/components/Badge';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DenseRow: React.FC<{
  ticker: string;
  ltp: number;
  pct: number;
  onBuy: () => void;
  onSell: () => void;
}> = ({ ticker, ltp, pct, onBuy, onSell }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: ROW_HEIGHT.compact,
        borderBottom: BORDER.standard,
        position: 'relative',
        overflow: 'hidden',
        background: hovered ? COLOR.interactive.hover : 'transparent',
        borderLeft: hovered ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent',
        transition: 'background 80ms linear',
        cursor: 'default',
        paddingLeft: hovered ? '6px' : '8px',
      }}
    >
      <span style={{ flex: 1, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.medium, color: COLOR.text.primary, textTransform: 'uppercase' }}>
        {ticker || '--'}
      </span>
      <span style={{ width: '60px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>
        {ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </span>
      <Change value={pct} format="percent" size="sm" />
      <span style={{ width: '8px' }} />
      {hovered && (
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: '2px', padding: '0 4px', background: COLOR.interactive.hover }}>
          <Button variant="buy" size="xs" onClick={(e) => { e.stopPropagation(); onBuy(); }}>B</Button>
          <Button variant="sell" size="xs" onClick={(e) => { e.stopPropagation(); onSell(); }}>S</Button>
        </div>
      )}
    </div>
  );
};

const ColHdr: React.FC<{ label: string; w?: number; flex?: boolean; align?: 'left' | 'right' }> = ({ label, w, flex, align = 'left' }) => (
  <span
    style={{
      ...(flex ? { flex: 1 } : { width: w }),
      display: 'flex',
      alignItems: 'center',
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      fontFamily: TYPE.family.mono,
      fontSize: TYPE.size.xs,
      color: COLOR.text.muted,
      letterSpacing: TYPE.letterSpacing.caps,
      textTransform: 'uppercase',
      paddingLeft: align === 'left' ? '8px' : 0,
      paddingRight: align === 'right' ? '6px' : 0,
    }}
  >
    {label}
  </span>
);

export const MoversWidget: React.FC = () => {
  const { prices, instrumentMeta } = useUpstoxStore();
  const { openOrderModal } = useLayoutStore();
  const { setSelectedSymbol } = useSelectionStore();
  const [tab, setTab] = useState<'GAINERS' | 'LOSERS' | 'VOLUME'>('GAINERS');

  const symbols = useMemo(
    () => Object.keys(prices).map((key) => buildSymbolFromFeed(key, prices[key], instrumentMeta[key])),
    [prices, instrumentMeta]
  );

  const gainers = useMemo(() => symbols.filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct), [symbols]);
  const losers = useMemo(() => symbols.filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct), [symbols]);
  const byActivity = useMemo(() => [...symbols].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)), [symbols]);

  const active = tab === 'GAINERS' ? gainers : tab === 'LOSERS' ? losers : byActivity;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface }}>
      <div style={{ display: 'flex', borderBottom: BORDER.standard, flexShrink: 0, height: ROW_HEIGHT.header }}>
        {(['GAINERS', 'LOSERS', 'VOLUME'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? `1px solid ${COLOR.semantic.info}` : '1px solid transparent',
              fontFamily: TYPE.family.mono,
              fontSize: TYPE.size.xs,
              letterSpacing: TYPE.letterSpacing.caps,
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: tab === t ? COLOR.text.primary : COLOR.text.muted,
              transition: 'color 80ms linear',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
        <ColHdr label="SYMBOL" flex />
        <ColHdr label="LTP" w={60} align="right" />
        <ColHdr label="%CHG" w={56} align="right" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {active.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.sm, fontFamily: TYPE.family.mono }}>NO LIVE DATA</div>
        ) : (
          active.slice(0, 20).map((s) => (
            <DenseRow
              key={s.instrument_key || s.ticker}
              ticker={s.ticker}
              ltp={s.ltp}
              pct={s.changePct}
              onBuy={() => { setSelectedSymbol(s); openOrderModal('BUY'); }}
              onSell={() => { setSelectedSymbol(s); openOrderModal('SELL'); }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const TrendingWidget: React.FC = () => {
  const { prices, instrumentMeta } = useUpstoxStore();
  const trending = useMemo(
    () =>
      Object.keys(prices)
        .map((key) => buildSymbolFromFeed(key, prices[key], instrumentMeta[key]))
        .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
        .slice(0, 20),
    [prices, instrumentMeta]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface }}>
      <div style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
        <ColHdr label="SYMBOL" flex />
        <ColHdr label="LTP" w={72} align="right" />
        <ColHdr label="%CHG" w={56} align="right" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {trending.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.sm, fontFamily: TYPE.family.mono }}>NO LIVE DATA</div>
        ) : (
          trending.map((s) => <DenseRow key={s.instrument_key || s.ticker} ticker={s.ticker} ltp={s.ltp} pct={s.changePct} onBuy={() => {}} onSell={() => {}} />)
        )}
      </div>
    </div>
  );
};

export const PositionsWidget: React.FC = () => {
  const positions = useUpstoxStore((s) => s.positions);
  const prices = useUpstoxStore((s) => s.prices);

  const normalizedPositions = useMemo(
    () =>
      positions.map((p: any, index: number) => {
        const instrumentKey = String(p?.instrument_token || '');
        const ltp = toNumber(prices[instrumentKey]?.ltp, toNumber(p?.last_price));
        const avgPrice = toNumber(p?.buy_price, toNumber(p?.average_price));
        const quantity = toNumber(p?.quantity);
        const pnl = toNumber(p?.pnl, (ltp - avgPrice) * quantity);
        const symbol = String(p?.trading_symbol || p?.tradingsymbol || p?.symbol || '--');

        return {
          id: String(p?.instrument_token || `${symbol}-${index}`),
          symbol,
          quantity,
          avgPrice,
          ltp,
          pnl,
        };
      }),
    [positions, prices]
  );

  const totalPnl = normalizedPositions.reduce((acc, p) => acc + p.pnl, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface }}>
      <div style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
        <ColHdr label="SYMBOL" flex />
        <ColHdr label="QTY" w={40} align="right" />
        <ColHdr label="AVG" w={64} align="right" />
        <ColHdr label="LTP" w={64} align="right" />
        <ColHdr label="P&L" w={80} align="right" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {normalizedPositions.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.sm, fontFamily: TYPE.family.mono }}>NO OPEN POSITIONS</div>
        ) : (
          normalizedPositions.map((p) => {
            const pct = p.avgPrice ? ((p.ltp - p.avgPrice) / p.avgPrice) * 100 : 0;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT.relaxed, borderBottom: BORDER.standard, paddingLeft: '8px' }}>
                <span style={{ flex: 1, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.medium, color: COLOR.text.primary, textTransform: 'uppercase' }}>{p.symbol}</span>
                <span style={{ width: '40px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>{p.quantity}</span>
                <span style={{ width: '64px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>{p.avgPrice.toFixed(2)}</span>
                <span style={{ width: '64px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.primary }}>{p.ltp.toFixed(2)}</span>
                <div style={{ width: '80px', textAlign: 'right', paddingRight: '6px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Change value={p.pnl} format="absolute" size="sm" />
                  <Change value={pct} format="percent" size="xs" />
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ padding: '3px 8px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>TOTAL P&L</span>
        <Change value={totalPnl} format="absolute" size="sm" />
      </div>
    </div>
  );
};

export const OrdersWidget: React.FC = () => {
  const orders = useUpstoxStore((s) => s.orders);

  const normalizedOrders = useMemo(
    () =>
      orders.map((o: any, index: number) => {
        const rawStatus = String(o?.status || '').toUpperCase();
        const status = rawStatus || 'PENDING';
        const statusVariant: 'status-pending' | 'status-executed' | 'status-cancelled' =
          status === 'COMPLETE' || status === 'EXECUTED'
            ? 'status-executed'
            : status === 'CANCELLED' || status === 'REJECTED'
              ? 'status-cancelled'
              : 'status-pending';

        return {
          id: String(o?.order_id || o?.guid || index),
          symbol: String(o?.trading_symbol || o?.tradingsymbol || o?.symbol || '--'),
          side: String(o?.transaction_type || o?.side || '').toUpperCase() === 'SELL' ? 'SELL' : 'BUY',
          quantity: toNumber(o?.quantity),
          price: toNumber(o?.price, toNumber(o?.average_price)),
          status,
          statusVariant,
          exchange: String(o?.exchange || '--'),
          time:
            String(o?.order_timestamp || '')
              .split(' ')
              .filter(Boolean)
              .pop() || '--:--:--',
        };
      }),
    [orders]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface }}>
      <div style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
        <ColHdr label="TIME" w={52} />
        <ColHdr label="SYMBOL" flex />
        <ColHdr label="SIDE" w={28} align="right" />
        <ColHdr label="QTY" w={44} align="right" />
        <ColHdr label="PRICE" w={64} align="right" />
        <ColHdr label="STATUS" w={72} align="right" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {normalizedOrders.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.sm, fontFamily: TYPE.family.mono }}>NO ORDERS</div>
        ) : (
          normalizedOrders.map((o) => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT.default, borderBottom: BORDER.standard }}>
              <span style={{ width: '52px', paddingLeft: '8px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>
                {o.time}
              </span>
              <span style={{ flex: 1, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.medium, color: COLOR.text.primary, textTransform: 'uppercase' }}>{o.symbol}</span>
              <span style={{ width: '28px', textAlign: 'center', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: o.side === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down }}>{o.side === 'BUY' ? 'B' : 'S'}</span>
              <span style={{ width: '44px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>{o.quantity}</span>
              <span style={{ width: '64px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.primary }}>{Number(o.price || 0).toFixed(2)}</span>
              <div style={{ width: '72px', textAlign: 'right', paddingRight: '6px' }}>
                <Badge label={o.status} variant={o.statusVariant} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const PortfolioWidget: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: COLOR.bg.surface, gap: '8px' }}>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase' }}>
      PORTFOLIO ANALYTICS
    </span>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>
      No portfolio analytics data available.
    </span>
  </div>
);

export const BasketWidget: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: COLOR.bg.surface, gap: '6px' }}>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase' }}>
      BASKET ORDERS
    </span>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>Batch multiple orders for simultaneous execution.</span>
  </div>
);

export const PriceLadderWidget: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: COLOR.bg.surface, gap: '6px' }}>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.semantic.down, letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase', border: `1px solid ${COLOR.semantic.down}`, padding: '2px 6px' }}>
      MARKET CLOSED
    </span>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.muted }}>Price ladder unavailable outside session.</span>
  </div>
);
