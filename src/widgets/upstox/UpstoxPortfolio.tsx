import React, { useEffect, useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { upstoxWebSocket } from '../../services/upstoxWebSocket';
import { Wallet, RefreshCw, AlertCircle, XCircle, ShoppingCart } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { Button } from '../../ds/components/Button';

const UpstoxPortfolio: React.FC = () => {
    const { accessToken, status, prices, instrumentMeta } = useUpstoxStore();
    const { setSelectedSymbol } = useSelectionStore();
    const { openOrderModal } = useLayoutStore();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [funds, setFunds] = useState<any>(null);
    const [positions, setPositions] = useState<any[]>([]);
    const [holdings, setHoldings] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'positions' | 'holdings'>('positions');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === 'connected' && accessToken) {
            refreshData();
            upstoxWebSocket.connect();
        }
    }, [status, accessToken]);

    const refreshData = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const [fundsRes, posRes, holdRes] = await Promise.all([
                upstoxApi.getFunds(accessToken),
                upstoxApi.getPositions(accessToken),
                upstoxApi.getHoldings(accessToken)
            ]);
            
            setFunds(fundsRes.data?.equity || null);
            setPositions(posRes.data || []);
            setHoldings(holdRes.data || []);

            const keys = [...new Set([
                ...(posRes.data?.map((p: any) => p.instrument_token) || []),
                ...(holdRes.data?.map((h: any) => h.instrument_token) || [])
            ])];
            if (keys.length > 0) {
                upstoxWebSocket.subscribe(keys);
            }
        } catch (err) {
            console.error("Failed to fetch portfolio data:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculatePnL = () => {
        let totalUnrealized = 0;
        const currentPositions = positions.length > 0 ? positions : [];
        currentPositions.forEach(pos => {
            const currentPrice = prices[pos.instrument_token]?.ltp || pos.last_price;
            const diff = currentPrice - pos.buy_price;
            totalUnrealized += diff * pos.quantity;
        });
        return totalUnrealized;
    };

    const totalPnL = calculatePnL();

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
                        DISCONNECTED - SHOWING STALE DATA [{new Date().toLocaleTimeString()}]
                    </span>
                </div>
            )}

            {/* Summary Banner */}
            <div style={{ padding: SPACE[2], display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[1], background: COLOR.bg.elevated, borderBottom: BORDER.standard }}>
                 <div style={{ background: COLOR.bg.surface, padding: '8px 12px', border: BORDER.standard, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Wallet size={14} style={{ color: COLOR.semantic.up }} />
                    <div>
                        <span style={{ display: 'block', fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AVBL MARGIN</span>
                        <span style={{ display: 'block', fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary, fontVariantNumeric: 'tabular-nums' }}>
                            ₹{funds ? (funds.available_margin).toLocaleString('en-IN') : '--'}
                        </span>
                    </div>
                 </div>

                 <div style={{ background: COLOR.bg.surface, padding: '8px 12px', border: BORDER.standard, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                        color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down,
                        fontSize: '9px',
                        fontWeight: TYPE.weight.bold
                    }}>
                        {totalPnL >= 0 ? '+' : ''}
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>DAY UNRLZD</span>
                        <span style={{ 
                            display: 'block', 
                            fontSize: TYPE.size.md, 
                            fontWeight: TYPE.weight.bold, 
                            fontVariantNumeric: 'tabular-nums', 
                            color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down 
                        }}>
                            ₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                 </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: COLOR.bg.surface, padding: '0 8px', gap: '16px', borderBottom: BORDER.standard }}>
                 <button 
                    onClick={() => setActiveTab('positions')}
                    style={{ 
                        padding: '10px 4px', 
                        fontSize: TYPE.size.xs, 
                        fontWeight: TYPE.weight.bold, 
                        textTransform: 'uppercase', 
                        letterSpacing: TYPE.letterSpacing.caps, 
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'positions' ? COLOR.text.primary : COLOR.text.muted,
                        borderBottom: activeTab === 'positions' ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                 >
                    POSITIONS [{positions.length}]
                 </button>
                 <button 
                    onClick={() => setActiveTab('holdings')}
                    style={{ 
                        padding: '10px 4px', 
                        fontSize: TYPE.size.xs, 
                        fontWeight: TYPE.weight.bold, 
                        textTransform: 'uppercase', 
                        letterSpacing: TYPE.letterSpacing.caps, 
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'holdings' ? COLOR.text.primary : COLOR.text.muted,
                        borderBottom: activeTab === 'holdings' ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                 >
                    HOLDINGS [{holdings.length}]
                 </button>
                 <div style={{ flex: 1 }} />
                 <button 
                    onClick={refreshData}
                    style={{ 
                        background: 'none',
                        border: 'none',
                        color: COLOR.text.muted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    className={loading ? 'animate-spin' : 'hover:text-text-primary'}
                 >
                    <RefreshCw size={12} />
                 </button>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto', background: COLOR.bg.base }} className="custom-scrollbar">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: TYPE.size.sm }}>
                    <thead style={{ position: 'sticky', top: 0, background: COLOR.bg.surface, borderBottom: BORDER.standard, zIndex: 1 }}>
                        <tr>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>SYMBOL</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>QTY</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>LTP</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, fontSize: '9px' }}>UNRLZD P&L</th>
                        </tr>
                    </thead>
                    <tbody style={{ color: COLOR.text.primary }}>
                        {(activeTab === 'positions' ? positions : holdings).length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', fontSize: TYPE.size.xs, color: COLOR.text.muted, textTransform: 'uppercase', fontWeight: TYPE.weight.bold }}>NO DATA AVAILABLE IN {activeTab}</td>
                            </tr>
                        ) : (
                            (activeTab === 'positions' ? positions : holdings).map((item, idx) => {
                                const ltp = prices[item.instrument_token]?.ltp || item.last_price;
                                const pnlOrValue = activeTab === 'positions' 
                                    ? (ltp - item.buy_price) * item.quantity 
                                    : item.quantity * ltp;
                                
                                return (
                                    <tr 
                                        key={idx} 
                                        onMouseEnter={() => setHoveredIndex(idx)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                        onClick={() => {
                                            const meta = instrumentMeta[item.instrument_token] || {
                                                ticker: item.trading_symbol,
                                                name: item.trading_symbol,
                                                exchange: item.exchange as any
                                            };
                                            const symbol = buildSymbolFromFeed(item.instrument_token, prices[item.instrument_token], meta);
                                            setSelectedSymbol(symbol);
                                        }}
                                        style={{ borderBottom: BORDER.standard, position: 'relative', cursor: 'pointer' }} 
                                        className="hover:bg-bg-elevated transition-colors"
                                    >
                                        <td style={{ padding: '8px 12px' }}>
                                            <span style={{ display: 'block', fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{item.trading_symbol}</span>
                                            <span style={{ display: 'block', fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase' }}>{item.product || item.exchange}</span>
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: TYPE.size.md }}>{item.quantity}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: TYPE.size.md }}>{ltp.toFixed(2)}</td>
                                        <td style={{ 
                                            padding: '8px 12px', 
                                            textAlign: 'right', 
                                            fontVariantNumeric: 'tabular-nums', 
                                            fontSize: TYPE.size.md, 
                                            fontWeight: TYPE.weight.bold,
                                            color: activeTab === 'positions' ? (pnlOrValue >= 0 ? COLOR.semantic.up : COLOR.semantic.down) : COLOR.text.primary,
                                            position: 'relative'
                                        }}>
                                            {activeTab === 'positions' && pnlOrValue >= 0 ? '+' : ''}{pnlOrValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            
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
                                                        const meta = instrumentMeta[item.instrument_token] || {
                                                            ticker: item.trading_symbol,
                                                            name: item.trading_symbol,
                                                            exchange: item.exchange as any
                                                        };
                                                        const symbol = buildSymbolFromFeed(item.instrument_token, prices[item.instrument_token], meta);
                                                        setSelectedSymbol(symbol);
                                                        openOrderModal('BUY');
                                                    }}>B</Button>
                                                    <Button variant="sell" size="xs" onClick={(e) => {
                                                        e.stopPropagation();
                                                        const meta = instrumentMeta[item.instrument_token] || {
                                                            ticker: item.trading_symbol,
                                                            name: item.trading_symbol,
                                                            exchange: item.exchange as any
                                                        };
                                                        const symbol = buildSymbolFromFeed(item.instrument_token, prices[item.instrument_token], meta);
                                                        setSelectedSymbol(symbol);
                                                        openOrderModal('SELL');
                                                    }}>S</Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {activeTab === 'positions' && positions.length > 0 && (
                <div style={{ padding: SPACE[2], borderTop: BORDER.standard, background: COLOR.bg.surface }}>
                     <button style={{ 
                         width: '100%',
                         height: '32px',
                         background: COLOR.semantic.down,
                         border: 'none',
                         color: COLOR.text.inverse,
                         fontSize: TYPE.size.xs,
                         fontWeight: TYPE.weight.bold,
                         textTransform: 'uppercase',
                         letterSpacing: TYPE.letterSpacing.caps,
                         cursor: 'pointer'
                     }} className="hover:opacity-90">
                        <XCircle size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        TERMINATE ALL POSITIONS
                     </button>
                </div>
            )}
        </div>
    );
};

export default UpstoxPortfolio;
