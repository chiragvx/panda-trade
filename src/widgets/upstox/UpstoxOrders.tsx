import React, { useEffect, useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { RefreshCw, ShoppingBag, Clock, Tag, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { 
  COLOR, 
  TYPE, 
  BORDER,
  SPACE,
  Text,
  WidgetShell,
  StatusBanner,
  DataTable,
  EmptyState,
  HoverActions,
  Badge,
  Price
} from '../../ds';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';

const UpstoxOrders: React.FC = () => {
    const { accessToken, status, prices, instrumentMeta } = useUpstoxStore();
    const { setSelectedSymbol } = useSelectionStore();
    const { openOrderModal } = useLayoutStore();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (accessToken && status === 'connected') {
            fetchOrders();
        }
    }, [accessToken, status]);

    const fetchOrders = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const res = await upstoxApi.getOrders(accessToken);
            setOrders(res.data || []);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (os: string): "primary" | "secondary" | "muted" | "up" | "down" | "info" | "warning" | "danger" => {
        switch (os.toLowerCase()) {
            case 'complete': return 'up';
            case 'rejected': return 'danger';
            case 'cancelled': return 'muted';
            case 'open':
            case 'put order req received': return 'info';
            default: return 'primary';
        }
    };

    const handleSelect = (order: any) => {
        const meta = instrumentMeta[order.instrument_token] || {
            ticker: order.trading_symbol,
            name: order.trading_symbol,
            exchange: order.exchange as any
        };
        const symbol = buildSymbolFromFeed(order.instrument_token, prices[order.instrument_token], meta);
        setSelectedSymbol(symbol);
    };

    const handleAction = (order: any, type: 'BUY' | 'SELL') => {
        handleSelect(order);
        setTimeout(() => openOrderModal(type), 0);
    };

    const columns = [
        { 
            key: 'order_timestamp', 
            label: 'TIME_LOC', 
            width: 90,
            render: (val: string) => {
                const timeStr = val?.split(' ')[1] || '--:--:--';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} color={COLOR.text.muted} />
                        <Text color="muted" size="xs" weight="bold" family="mono">{timeStr}</Text>
                    </div>
                );
            }
        },
        { 
            key: 'trading_symbol', 
            label: 'SYMBOL', 
            render: (val: string, item: any) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text weight="black" size="md" color="primary">{val}</Text>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Badge label={item.exchange} variant={item.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
                        <Text size="xs" color="muted" weight="bold">{item.order_type}</Text>
                    </div>
                </div>
            )
        },
        { 
            key: 'transaction_type', 
            label: 'DIR', 
            width: 60,
            render: (val: string) => (
                <Text weight="black" color={val === 'BUY' ? 'up' : 'down'} size="sm">
                    {val}
                </Text>
            )
        },
        { key: 'quantity', label: 'QTY', align: 'right' as const, width: 80, render: (val: number) => <Text weight="bold" size="sm">{val}</Text> },
        { 
            key: 'price', 
            label: 'PX_EXEC', 
            align: 'right' as const, 
            width: 90,
            render: (val: any, item: any) => {
                const px = val || item.average_price || 0;
                return px > 0 ? <Price value={px} size="sm" weight="black" /> : <Text color="muted" size="sm">--</Text>;
            }
        },
        { 
            key: 'status', 
            label: 'STATUS_MSG', 
            align: 'right' as const, 
            width: 140,
            render: (val: string, item: any, idx: number) => (
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                     onMouseEnter={() => setHoveredIndex(idx)}
                     onMouseLeave={() => setHoveredIndex(null)}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '4px', height: '12px', background: COLOR.semantic[getStatusColor(val)] }} />
                        <Text weight="black" color={getStatusColor(val)} size="xs" style={{ letterSpacing: '0.05em' }}>
                            {val.toUpperCase()}
                        </Text>
                    </div>

                    <HoverActions 
                        isVisible={hoveredIndex === idx}
                        onBuy={() => handleAction(item, 'BUY')}
                        onSell={() => handleAction(item, 'SELL')}
                    />
                </div>
            )
        }
    ];

    return (
        <WidgetShell>
            {status !== 'connected' && (
                <StatusBanner 
                    variant="disconnected" 
                    message={`DISCONNECTED - STALE ORDER BOOK [${new Date().toLocaleTimeString()}]`} 
                />
            )}

            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingBag size={14} color={COLOR.text.primary} />
                        <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                            DLY_ORDER_BOOK
                        </Text>
                        <Badge label={orders.length.toString()} variant="muted" />
                    </div>
                </WidgetShell.Toolbar.Left>
                <WidgetShell.Toolbar.Right>
                    <button onClick={fetchOrders} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }} className={loading ? 'animate-spin' : 'hover:text-text-primary'}>
                        <RefreshCw size={14} />
                    </button>
                </WidgetShell.Toolbar.Right>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {orders.length === 0 ? (
                    <EmptyState 
                        icon={<ShoppingBag size={48} />} 
                        message="NO ORDER ENTRIES TODAY" 
                        subMessage="Recent trades and pending orders will appear here once initiated."
                    />
                ) : (
                    <DataTable 
                        data={orders}
                        columns={columns}
                        onRowClick={handleSelect}
                        stickyFirstColumn
                    />
                )}
            </div>

            <div style={{ height: '32px', padding: '0 12px', background: COLOR.bg.surface, borderTop: BORDER.strong, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR.semantic.up }} />
                    <Text size="xs" color="muted" weight="bold">FILLED</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR.semantic.info }} />
                    <Text size="xs" color="muted" weight="bold">OPEN</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR.semantic.danger }} />
                    <Text size="xs" color="muted" weight="bold">REJECTED</Text>
                </div>
                <Text size="xs" color="muted" weight="black" style={{ marginLeft: 'auto', letterSpacing: '0.05em' }}>SOURCE: UPSTOX_OMS_V3</Text>
            </div>
        </WidgetShell>
    );
};

export default UpstoxOrders;
