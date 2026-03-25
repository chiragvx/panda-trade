import React, { useEffect, useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { ShoppingBag, RefreshCw, AlertCircle, ShoppingCart } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { Button } from '../../ds/components/Button';

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

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, overflow: 'hidden', fontFamily: TYPE.family.mono }}>
            
            {/* Connection Status Banner */}
            {status !== 'connected' && (
                <div style={{ 
                    padding: '2px 8px', background: '#450a0a', borderBottom: BORDER.standard,
                    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'
                }}>
                    <AlertCircle size={10} color={COLOR.semantic.down} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: COLOR.semantic.down, letterSpacing: '0.05em' }}>
                        DISCONNECTED - STALE ORDER BOOK [{new Date().toLocaleTimeString()}]
                    </span>
                </div>
            )}

            <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, color: COLOR.text.primary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ORDER_BOOK [DLY]
                 </span>
                 <button onClick={fetchOrders} style={{ 
                     background: 'none', 
                     border: 'none', 
                     color: COLOR.text.muted, 
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center'
                 }} className={loading ? 'animate-spin' : 'hover:text-text-primary'}>
                    <RefreshCw size={12} />
                 </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: COLOR.bg.base }} className="custom-scrollbar">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: TYPE.size.sm }}>
                    <thead style={{ position: 'sticky', top: 0, background: COLOR.bg.surface, borderBottom: BORDER.standard, zIndex: 1 }}>
                        <tr>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>TIME</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>SYMBOL</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>TYPE</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>QTY</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>PRICE</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody style={{ color: COLOR.text.primary }}>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', fontSize: TYPE.size.xs, color: COLOR.text.muted, textTransform: 'uppercase', fontWeight: TYPE.weight.bold }}>NO ORDER ENTRIES TODAY</td>
                            </tr>
                        ) : (
                            orders.map((order, idx) => (
                                <tr 
                                    key={idx} 
                                    onMouseEnter={() => setHoveredIndex(idx)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    onClick={() => {
                                        const meta = instrumentMeta[order.instrument_token] || {
                                            ticker: order.trading_symbol,
                                            name: order.trading_symbol,
                                            exchange: order.exchange as any
                                        };
                                        const symbol = buildSymbolFromFeed(order.instrument_token, prices[order.instrument_token], meta);
                                        setSelectedSymbol(symbol);
                                    }}
                                    style={{ borderBottom: BORDER.standard, position: 'relative', cursor: 'pointer' }} 
                                    className="hover:bg-bg-elevated transition-colors"
                                >
                                    <td style={{ padding: '8px 12px', color: COLOR.text.muted, fontSize: '10px', fontVariantNumeric: 'tabular-nums' }}>
                                        {order.order_timestamp?.split(' ')[1] || '--:--:--'}
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                        <span style={{ display: 'block', fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{order.trading_symbol}</span>
                                        <span style={{ display: 'block', fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase' }}>{order.exchange}</span>
                                    </td>
                                    <td style={{ 
                                        padding: '8px 12px', 
                                        fontSize: TYPE.size.xs, 
                                        fontWeight: TYPE.weight.bold,
                                        color: order.transaction_type === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down
                                    }}>
                                        {order.transaction_type}
                                    </td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{order.quantity}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                        {order.price || order.average_price || '--'}
                                    </td>
                                    <td style={{ 
                                        padding: '8px 12px', 
                                        textAlign: 'right', 
                                        fontSize: '10px', 
                                        fontWeight: TYPE.weight.bold, 
                                        color: getStatusColor(order.status),
                                        position: 'relative'
                                    }}>
                                        {order.status.toUpperCase()}

                                        {hoveredIndex === idx && (
                                            <div style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 0,
                                                bottom: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '0 8px',
                                                background: 'inherit',
                                                borderLeft: `1px solid ${COLOR.bg.border}`,
                                                zIndex: 10
                                            }}>
                                                <Button variant="buy" size="xs" onClick={(e) => {
                                                    e.stopPropagation();
                                                    const meta = instrumentMeta[order.instrument_token] || {
                                                        ticker: order.trading_symbol,
                                                        name: order.trading_symbol,
                                                        exchange: order.exchange as any
                                                    };
                                                    const symbol = buildSymbolFromFeed(order.instrument_token, prices[order.instrument_token], meta);
                                                    setSelectedSymbol(symbol);
                                                    openOrderModal('BUY');
                                                }}>B</Button>
                                                <Button variant="sell" size="xs" onClick={(e) => {
                                                    e.stopPropagation();
                                                    const meta = instrumentMeta[order.instrument_token] || {
                                                        ticker: order.trading_symbol,
                                                        name: order.trading_symbol,
                                                        exchange: order.exchange as any
                                                    };
                                                    const symbol = buildSymbolFromFeed(order.instrument_token, prices[order.instrument_token], meta);
                                                    setSelectedSymbol(symbol);
                                                    openOrderModal('SELL');
                                                }}>S</Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UpstoxOrders;
