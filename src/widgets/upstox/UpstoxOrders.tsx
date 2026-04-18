import React, { useEffect, useMemo, useState } from 'react';
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
import { buildSymbolFromFeed, getDisplayTicker } from '../../utils/liveSymbols';

const UpstoxOrders: React.FC = () => {
    const { accessToken, status, prices, instrumentMeta } = useUpstoxStore();
    const { setSelectedSymbol } = useSelectionStore();
    const { openOrderModal } = useLayoutStore();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('desc'); }
    };

    const sortedOrders = useMemo(() => {
        if (!sortCol) return orders;
        return [...orders].sort((a, b) => {
            let av: any = sortCol === 'price' ? (a.price || a.average_price || 0) : a[sortCol];
            let bv: any = sortCol === 'price' ? (b.price || b.average_price || 0) : b[sortCol];
            if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === 'asc' ? (av ?? 0) - (bv ?? 0) : (bv ?? 0) - (av ?? 0);
        });
    }, [orders, sortCol, sortDir]);

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
            label: 'Time',
            width: 90,
            sortable: true,
            render: (val: string) => {
                const timeStr = val?.split(' ')[1] || '--:--:--';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} color={COLOR.text.muted} />
                        <Text color="muted" size="xs" weight="medium" family="mono">{timeStr}</Text>
                    </div>
                );
            }
        },
        {
            key: 'trading_symbol',
            label: 'Symbol',
            sortable: true,
            render: (val: string, item: any) => {
                const meta = instrumentMeta[item.instrument_token];
                const displaySymbol = getDisplayTicker({
                    ticker: meta?.ticker || val,
                    name: meta?.name || item.name,
                    instrumentKey: item.instrument_token,
                    fallback: val,
                });

                return (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text weight="bold" size="md" color="primary">{displaySymbol}</Text>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Badge label={item.exchange} variant={item.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
                        <Text size="xs" color="muted" weight="medium">{item.order_type}</Text>
                    </div>
                </div>
            )}
        },
        {
            key: 'transaction_type',
            label: 'Side',
            width: 60,
            sortable: true,
            render: (val: string) => (
                <Text weight="bold" color={val === 'BUY' ? 'up' : 'down'} size="sm">
                    {val}
                </Text>
            )
        },
        { key: 'quantity', label: 'Qty', align: 'right' as const, width: 80, sortable: true, render: (val: number) => <Text weight="medium" size="sm">{val}</Text> },
        {
            key: 'price',
            label: 'Avg Px',
            align: 'right' as const,
            width: 90,
            sortable: true,
            render: (val: any, item: any) => {
                const px = val || item.average_price || 0;
                return px > 0 ? <Price value={px} size="sm" weight="bold" /> : <Text color="muted" size="sm">--</Text>;
            }
        },
        {
            key: 'status',
            label: 'Status',
            align: 'right' as const,
            width: 140,
            sortable: true,
            render: (val: string, item: any, idx: number) => (
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                     onMouseEnter={() => setHoveredIndex(idx)}
                     onMouseLeave={() => setHoveredIndex(null)}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '4px', height: '12px', background: COLOR.semantic[getStatusColor(val) as keyof typeof COLOR.semantic] }} />
                        <Text weight="bold" color={getStatusColor(val) as any} size="xs" style={{ letterSpacing: '0.05em' }}>
                            {val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()}
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
                    message={`Disconnected - Stale order book [${new Date().toLocaleTimeString()}]`} 
                />
            )}

            {orders.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmptyState 
                        icon={<ShoppingBag size={48} color={COLOR.text.muted} strokeWidth={1} />} 
                        message="No active orders" 
                        subMessage="Your trading activity for the day will appear here once initiated."
                    />
                </div>
            ) : (
                <>
                    <WidgetShell.Toolbar>
                        <WidgetShell.Toolbar.Left>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShoppingBag size={14} color={COLOR.text.primary} />
                                <Text size="xs" weight="bold" style={{ letterSpacing: '0.05em' }}>
                                    Daily Order Book
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
                        <DataTable
                            data={sortedOrders}
                            columns={columns}
                            sortCol={sortCol}
                            sortDir={sortDir}
                            onSort={handleSort}
                            onRowClick={handleSelect}
                            stickyFirstColumn
                        />
                    </div>
                </>
            )}

            <div style={{ height: '32px', padding: '0 12px', background: COLOR.bg.surface, borderTop: BORDER.strong, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR.semantic.up }} />
                    <Text size="xs" color="muted" weight="medium">Filled</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR.semantic.info }} />
                    <Text size="xs" color="muted" weight="medium">Open</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR.semantic.danger }} />
                    <Text size="xs" color="muted" weight="medium">Rejected</Text>
                </div>
                <Text size="xs" color="muted" weight="bold" style={{ marginLeft: 'auto', letterSpacing: '0.05em' }}>Source: Upstox_OMS_v3</Text>
            </div>
        </WidgetShell>
    );
};

export default UpstoxOrders;
