import React, { useMemo, useState } from 'react';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, ROW_HEIGHT, BORDER } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { Badge } from '../../ds/components/Badge';
import { Select } from '../../ds';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { useToastStore } from '../../components/ToastContainer';
import { useContextMenuStore, ContextMenuOption } from '../../store/useContextMenuStore';
import { upstoxApi } from '../../services/upstoxApi';
import { Info, X, Edit2, Play, Pause, ChevronUp, ChevronDown, RefreshCcw, Trash2, BarChart3, Trash, ShoppingBag, Wallet } from 'lucide-react';
import { HoverActions } from '../../ds/components/HoverActions';
import { Tooltip } from '../../ds/components/Tooltip';
import { EmptyState } from '../../ds/components/EmptyState';
import { Text } from '../../ds/components/Text';

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DenseRow: React.FC<{
  symbol: any;
  onBuy: () => void;
  onSell: () => void;
}> = ({ symbol, onBuy, onSell }) => {
  const [hovered, setHovered] = useState(false);
  const { setSelectedSymbol } = useSelectionStore();
  
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
        background: hovered ? COLOR.interactive.hover : 'transparent',
        borderLeft: hovered ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent',
        transition: 'background 80ms linear',
        cursor: 'default',
        paddingLeft: hovered ? '6px' : '8px',
      }}
    >
      <span style={{ flex: 1, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.medium, color: COLOR.text.primary,  }}>
        {symbol.ticker || '--'}
      </span>
      <span style={{ width: '60px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>
        {symbol.ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </span>
      <Change value={symbol.changePct} format="percent" size="sm" />
      <span style={{ width: '8px' }} />
      
      <HoverActions 
        isVisible={hovered}
        onBuy={onBuy}
        onSell={onSell}
        onInfo={() => { 
            setSelectedSymbol(symbol); 
            if ((window as any).replaceTab) (window as any).replaceTab('fundamentals'); 
        }}
        onChart={() => {
            setSelectedSymbol(symbol);
            if ((window as any).targetWidget) (window as any).targetWidget('chart');
        }}
      />
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
      letterSpacing: '0.05em',
      paddingLeft: align === 'left' ? '8px' : 0,
      paddingRight: align === 'right' ? '6px' : 0,
    }}
  >
    {label}
  </span>
);

export const TrendingWidget: React.FC = () => {
  const { prices, instrumentMeta } = useUpstoxStore();
  const { setSelectedSymbol } = useSelectionStore();
  
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
        <ColHdr label="Symbol" flex />
        <ColHdr label="LTP" w={72} align="right" />
        <ColHdr label="% Chg" w={56} align="right" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {trending.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.sm, fontFamily: TYPE.family.mono }}>NO LIVE DATA</div>
        ) : (
          trending.map((s) => (
            <DenseRow 
              key={s.instrument_key || s.ticker} 
              symbol={s}
              onBuy={() => {
                setSelectedSymbol(s);
                setTimeout(() => useLayoutStore.getState().openOrderModal('BUY'), 0);
              }} 
              onSell={() => {
                setSelectedSymbol(s);
                setTimeout(() => useLayoutStore.getState().openOrderModal('SELL'), 0);
              }} 
            />
          ))
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
      {normalizedPositions.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState 
                icon={<Wallet size={48} color={COLOR.text.muted} strokeWidth={1} />} 
                message="No active positions" 
                subMessage="Your open trades and P&L will appear here after execution."
            />
        </div>
      ) : (
        <>
            <div style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0 }}>
                <ColHdr label="Symbol" flex />
                <ColHdr label="Qty" w={40} align="right" />
                <ColHdr label="Avg" w={64} align="right" />
                <ColHdr label="LTP" w={64} align="right" />
                <ColHdr label="PnL" w={80} align="right" />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {normalizedPositions.map((p) => {
                    const pct = p.avgPrice ? ((p.ltp - p.avgPrice) / p.avgPrice) * 100 : 0;
                    return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT.relaxed, borderBottom: BORDER.standard, paddingLeft: '8px' }}>
                        <span style={{ flex: 1, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.medium, color: COLOR.text.primary,  }}>{p.symbol}</span>
                        <span style={{ width: '40px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>{p.quantity}</span>
                        <span style={{ width: '64px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted }}>{p.avgPrice.toFixed(2)}</span>
                        <span style={{ width: '64px', textAlign: 'right', paddingRight: '6px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.primary }}>{p.ltp.toFixed(2)}</span>
                        <div style={{ width: '80px', textAlign: 'right', paddingRight: '6px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Change value={p.pnl} format="absolute" size="sm" />
                        <Change value={pct} format="percent" size="xs" />
                        </div>
                    </div>
                    );
                })}
            </div>
            <div style={{ height: '32px', padding: '0 12px', background: COLOR.bg.surface, borderTop: BORDER.strong, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size="xs" color="muted" weight="bold" style={{ letterSpacing: '0.05em' }}>Total PnL</Text>
                <Change value={totalPnl} format="absolute" size="sm" weight="bold" />
            </div>
        </>
      )}
    </div>
  );
};

const ORDERS_COL_WIDTHS: Record<string, number> = {
  'Time': 60,
  'Symbol': 130,
  'Side': 40,
  'Qty': 60,
  'Avg Px': 80,
  'Status': 150
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
      <div style={{ width: 60, minWidth: 60, paddingLeft: '12px', fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>
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
        background: hovered ? COLOR.interactive.hover : COLOR.bg.base,
        borderRight: BORDER.standard
      }}>
        {order.symbol}
      </div>
      <div style={{ width: 40, minWidth: 40, textAlign: 'center', fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: order.side === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down }}>
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

      <HoverActions 
        isVisible={hovered}
        onInfo={() => openOrderDetails(order)}
        onChart={() => {
            setSelectedSymbol({ ticker: order.symbol, instrument_key: order.instrument_key } as any);
            if ((window as any).targetWidget) (window as any).targetWidget('chart');
        }}
        onBuy={() => {
            setSelectedSymbol({ ticker: order.symbol, instrument_key: order.instrument_key } as any);
            setTimeout(() => openOrderModal('BUY'), 0);
        }}
        onSell={() => {
            setSelectedSymbol({ ticker: order.symbol, instrument_key: order.instrument_key } as any);
            setTimeout(() => openOrderModal('SELL'), 0);
        }}
        extraActions={isPending && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openModifyModal(order); }} style={{ padding: '0 4px', color: COLOR.text.primary }} title="Modify">
                <Edit2 size={14} />
            </Button>
        )}
        onDelete={isPending ? handleCancel : undefined}
      />
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

  const cols = ['Time', 'Symbol', 'Side', 'Qty', 'Avg Px', 'Status'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.base }}>
      {normalizedOrders.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState 
                icon={<ShoppingBag size={48} color={COLOR.text.muted} strokeWidth={1} />} 
                message="No active orders" 
                subMessage="Your trading activity for the day will appear here once initiated."
            />
        </div>
      ) : (
        <>
            <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0', borderBottom: BORDER.standard, flexShrink: 0, background: COLOR.bg.base }}>
                <Tooltip content="Cancel all orders" position="left">
                    <button 
                        onClick={handleCancelAll}
                        className="hover:bg-zinc-800"
                        style={{ 
                            background: 'none', 
                            border: 'none',
                            color: COLOR.semantic.down, 
                            height: '32px',
                            width: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.1s linear',
                            padding: 0
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </Tooltip>
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
                            justifyContent: c === 'Symbol' ? 'flex-start' : 'flex-end',
                            fontFamily: TYPE.family.mono,
                            fontSize: TYPE.size.xs,
                            fontWeight: TYPE.weight.bold,
                            color: COLOR.text.muted,
                            letterSpacing: '0.05em',
                            padding: '0 12px',
                            position: c === 'Symbol' ? 'sticky' : 'static',
                            left: c === 'Symbol' ? 0 : 'auto',
                            zIndex: c === 'Symbol' ? 20 : 1,
                            background: COLOR.bg.surface,
                            borderRight: BORDER.standard
                        }}
                    >
                        {c}
                    </div>
                ))}
                <div style={{ width: 100, minWidth: 100, flexShrink: 0, background: COLOR.bg.surface }} />
            </div>
            <div 
                ref={contentRef}
                onScroll={syncScroll}
                style={{ flex: 1, overflow: 'auto' }}
                className="custom-scrollbar"
            >
                <div style={{ minWidth: 'fit-content' }}>
                    {normalizedOrders.map((o) => (
                        <OrdersRow key={o.id} order={o} />
                    ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export const PortfolioWidget: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: COLOR.bg.surface, gap: '8px' }}>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps,  }}>
      PORTFOLIO ANALYTICS
    </span>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>
      No portfolio analytics data available.
    </span>
  </div>
);

export const BasketWidget: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: COLOR.bg.surface, gap: '6px' }}>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps,  }}>
      BASKET ORDERS
    </span>
    <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.secondary }}>Batch multiple orders for simultaneous execution.</span>
  </div>
);
