import React, { useMemo, useState } from 'react';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, ROW_HEIGHT, BORDER } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { Badge } from '../../ds/components/Badge';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { useToastStore } from '../../components/ToastContainer';
import { useContextMenuStore, ContextMenuOption } from '../../store/useContextMenuStore';
import { upstoxApi } from '../../services/upstoxApi';
import { Info, X, Edit2, Play, Pause, ChevronUp, ChevronDown, RefreshCcw, Trash2 } from 'lucide-react';

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

const ORDERS_COL_WIDTHS: Record<string, number> = {
  'TIME': 60,
  'SYMBOL': 130,
  'SIDE': 40,
  'QTY': 60,
  'PRICE': 80,
  'STATUS': 150
};

const OrdersRow: React.FC<{ order: any }> = ({ order }) => {
  const [hovered, setHovered] = useState(false);
  const { openModifyModal, openOrderDetails, openOrderModal } = useLayoutStore();
  const { setSelectedSymbol } = useSelectionStore();
  const { openContextMenu } = useContextMenuStore();
  const { accessToken } = useUpstoxStore();
  const { addToast } = useToastStore();

  const handleCancel = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!accessToken) return;
    try {
      const res = await upstoxApi.cancelOrder(accessToken, order.id);
      if (res.status === 'success') {
        addToast(`CANCELLED ORDER: ${order.id}`, 'info');
      } else {
        addToast(`CANCEL FAILED: ${res.errors?.[0]?.message}`, 'error');
      }
    } catch (err: any) {
        addToast(`ERROR: ${err.response?.data?.errors?.[0]?.message || 'Service unavailable'}`, 'error');
    }
  };

  const isPending = order.status === 'PENDING' || order.status === 'OPEN' || order.status === 'PUT_ORDER_REQ_RECEIVED';

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const options: ContextMenuOption[] = [
        { 
            label: 'VIEW DETAILS', 
            icon: <Info size={14} />, 
            variant: 'muted' as const,
            onClick: () => { openOrderDetails(order); } 
        },
        { 
            label: 'ORDER AGAIN', 
            icon: <RefreshCcw size={14} />, 
            variant: 'primary' as const,
            onClick: () => { 
                setSelectedSymbol({ ticker: order.symbol, instrument_key: order.instrument_key } as any);
                setTimeout(() => openOrderModal(order.side as any), 0);
            } 
        }
    ];

    if (isPending) {
        options.unshift({ 
            label: 'CANCEL ORDER', 
            icon: <X size={14} />, 
            variant: 'danger' as const,
            onClick: () => { handleCancel(); } 
        });
    }

    openContextMenu(e.clientX, e.clientY, options);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={handleRightClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: ROW_HEIGHT.default,
        borderBottom: BORDER.standard,
        position: 'relative',
        background: hovered ? COLOR.interactive.hover : 'transparent',
        transition: 'background 80ms linear',
        minWidth: 'fit-content'
      }}
    >
      <div style={{ width: 60, minWidth: 60, paddingLeft: '12px', fontFamily: TYPE.family.mono, fontSize: '10px', color: COLOR.text.muted }}>
        {order.time}
      </div>
      <div style={{ 
        width: 130, 
        minWidth: 130, 
        padding: '0 12px', 
        fontFamily: TYPE.family.mono, 
        fontSize: TYPE.size.sm, 
        fontWeight: 'bold', 
        color: COLOR.text.primary, 
        position: 'sticky', 
        left: 0, 
        zIndex: 10,
        background: hovered ? COLOR.interactive.hover : '#000000',
        borderRight: '1px solid #111111'
      }}>
        {order.symbol}
      </div>
      <div style={{ width: 40, minWidth: 40, textAlign: 'center', fontFamily: TYPE.family.mono, fontSize: '11px', fontWeight: 'bold', color: order.side === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down }}>
        {order.side === 'BUY' ? 'B' : 'S'}
      </div>
      <div style={{ width: 60, minWidth: 60, textAlign: 'right', paddingRight: '12px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>
        {order.quantity}
      </div>
      <div style={{ width: 80, minWidth: 80, textAlign: 'right', paddingRight: '12px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.primary }}>
        {Number(order.price || 0).toFixed(2)}
      </div>
      <div style={{ width: 150, minWidth: 150, textAlign: 'right', paddingRight: '12px' }}>
        <Badge label={order.status} variant={order.statusVariant} />
      </div>
      
      {/* Spacer to prevent content being buried under sticky right buttons */}
      <div style={{ width: 100, minWidth: 100 }} />

      {hovered && (
        <div style={{ 
            position: 'sticky', 
            right: 0, 
            height: '100%',
            width: 100,
            zIndex: 30, 
            background: COLOR.interactive.hover, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '4px', 
            borderLeft: `1px solid #333333`
        }}>
          {isPending && (
            <>
              <Button size="sm" variant="filled" onClick={(e) => { e.stopPropagation(); openModifyModal(order); }} style={{ height: '22px', border: 'none', background: 'transparent' }} title="Modify"><Edit2 size={14} color="#FFF" /></Button>
              <Button size="sm" variant="danger" onClick={handleCancel} style={{ height: '22px', border: 'none', background: 'transparent' }} title="Cancel"><X size={14} color={COLOR.semantic.down} /></Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openOrderDetails(order); }} style={{ height: '22px', color: '#888' }}><Info size={14} /></Button>
        </div>
      )}
    </div>
  );
};
export const OrdersWidget: React.FC = () => {
  const orders = useUpstoxStore((s) => s.orders);
  const { accessToken } = useUpstoxStore();
  const { addToast } = useToastStore();
  const headerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleCancelAll = async () => {
      const pendingIds = orders
        .filter((o: any) => ['OPEN', 'PENDING', 'PUT_ORDER_REQ_RECEIVED'].includes(o.status?.toUpperCase()))
        .map((o: any) => o.order_id);

      if (pendingIds.length === 0) {
          addToast('NO PENDING ORDERS TO CANCEL', 'info');
          return;
      }

      if (window.confirm(`Are you sure you want to CANCEL ALL ${pendingIds.length} pending orders?`)) {
          addToast(`CANCELING ALL ${pendingIds.length} ORDERS...`, 'info');
          for (const id of pendingIds) {
              try {
                await upstoxApi.cancelOrder(accessToken!, id);
              } catch (e) {
                console.error('Bulk cancel error:', e);
              }
          }
          addToast('BULK CANCEL COMMAND SENT', 'success');
      }
  };

  const syncScroll = () => {
    if (contentRef.current && headerRef.current) {
        headerRef.current.scrollLeft = contentRef.current.scrollLeft;
    }
  };

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
          raw: o
        };
      }),
    [orders]
  );

  const cols = ['TIME', 'SYMBOL', 'SIDE', 'QTY', 'PRICE', 'STATUS'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface }}>
      {/* Action Toolbar */}
      <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px', borderBottom: BORDER.standard, flexShrink: 0 }}>
        <button 
            onClick={handleCancelAll}
            style={{ 
                background: 'none', 
                border: '1px solid #f43f5e', 
                color: '#f43f5e', 
                fontSize: '9px', 
                fontWeight: 'bold', 
                padding: '4px 10px', 
                cursor: 'pointer',
                borderRadius: '2px',
                textTransform: 'uppercase',
                transition: 'all 0.1s linear'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e22'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'none'; }}
        >
            CANCEL ALL PENDING
        </button>
      </div>

      <div 
        ref={headerRef}
        style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0, overflow: 'hidden' }}
      >
        {cols.map(c => (
            <div 
                key={c} 
                style={{ 
                    width: ORDERS_COL_WIDTHS[c], 
                    minWidth: ORDERS_COL_WIDTHS[c], 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: c === 'SYMBOL' ? 'flex-start' : 'flex-end',
                    fontFamily: TYPE.family.mono,
                    fontSize: '9px',
                    fontWeight: '900',
                    color: COLOR.text.muted,
                    letterSpacing: '0.1em',
                    padding: '0 12px',
                    position: c === 'SYMBOL' ? 'sticky' : 'static',
                    left: c === 'SYMBOL' ? 0 : 'auto',
                    zIndex: c === 'SYMBOL' ? 20 : 1,
                    background: '#000000',
                    borderRight: '1px solid #111111'
                }}
            >
                {c}
            </div>
        ))}
        {/* Spacer for Actions column */}
        <div style={{ width: 100, minWidth: 100, flexShrink: 0, background: '#000000' }} />
      </div>
      <div 
        ref={contentRef}
        onScroll={syncScroll}
        style={{ flex: 1, overflow: 'auto' }}
        className="custom-scrollbar"
      >
        <div style={{ minWidth: 'fit-content' }}>
            {normalizedOrders.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.sm, fontFamily: TYPE.family.mono }}>NO ORDERS</div>
            ) : (
                normalizedOrders.map((o) => (
                    <OrdersRow key={o.id} order={o} />
                ))
            )}
        </div>
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
