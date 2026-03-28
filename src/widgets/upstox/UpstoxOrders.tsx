import React, { useEffect, useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import { COLOR, TYPE } from '../../ds/tokens';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { StatusBanner } from '../../ds/components/StatusBanner';
import { DataTable } from '../../ds/components/DataTable';
import { EmptyState } from '../../ds/components/EmptyState';
import { HoverActions } from '../../ds/components/HoverActions';

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

    const getStatusColor = (os: string) => {
        switch (os.toLowerCase()) {
            case 'complete': return COLOR.semantic.up;
            case 'rejected': return COLOR.semantic.down;
            case 'cancelled': return COLOR.text.muted;
            case 'open':
            case 'put order req received': return COLOR.semantic.info;
            default: return COLOR.text.primary;
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
            label: 'TIME', 
            width: 80,
            render: (val: string) => <span style={{ color: COLOR.text.muted, fontSize: '10px' }}>{val?.split(' ')[1] || '--:--:--'}</span>
        },
        { 
            key: 'trading_symbol', 
            label: 'SYMBOL', 
            render: (val: string, item: any) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{val}</div>
                    <div style={{ fontSize: '9px', color: COLOR.text.muted }}>{item.exchange}</div>
                </div>
            )
        },
        { 
            key: 'transaction_type', 
            label: 'TYPE', 
            width: 60,
            render: (val: string) => (
                <span style={{ fontWeight: 'bold', color: val === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down }}>
                    {val}
                </span>
            )
        },
        { key: 'quantity', label: 'QTY', align: 'right' as const, width: 60 },
        { 
            key: 'price', 
            label: 'PRICE', 
            align: 'right' as const, 
            width: 80,
            render: (val: any, item: any) => val || item.average_price || '--'
        },
        { 
            key: 'status', 
            label: 'STATUS', 
            align: 'right' as const, 
            width: 100,
            render: (val: string, item: any, idx: number) => (
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                     onMouseEnter={() => setHoveredIndex(idx)}
                     onMouseLeave={() => setHoveredIndex(null)}>
                    <span style={{ fontWeight: 'bold', color: getStatusColor(val), fontSize: '10px' }}>
                        {val.toUpperCase()}
                    </span>
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
                 <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ORDER_BOOK [DLY]
                 </span>
                 <button onClick={fetchOrders} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }} className={loading ? 'animate-spin' : 'hover:text-text-primary'}>
                    <RefreshCw size={12} />
                 </button>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {orders.length === 0 ? (
                    <EmptyState 
                        icon={<ShoppingBag size={32} />} 
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
        </WidgetShell>
    );
};

export default UpstoxOrders;

