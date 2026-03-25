import React, { useMemo, useState, useEffect } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { useMockTicker } from '../../mock/hooks';
import { COLOR, TYPE, BORDER, ROW_HEIGHT } from '../../ds/tokens';
import { Price } from '../../ds/components/Price';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_DEPTH = (ltp: number) => {
    return Array.from({ length: 5 }, (_, i) => ({
        bidPrice: ltp - (i * 0.05) - 0.05,
        bidQty: Math.floor(Math.random() * 5000),
        bidOrders: Math.floor(Math.random() * 50),
        askPrice: ltp + (i * 0.05) + 0.05,
        askQty: Math.floor(Math.random() * 5000),
        askOrders: Math.floor(Math.random() * 50),
    }));
};

const TAPE_TRADES = [
    { time: '12:34:01', price: 2945.10, qty: 100, side: 'BUY' },
    { time: '12:34:02', price: 2945.05, qty: 1500, side: 'SELL' },
    { time: '12:34:05', price: 2945.00, qty: 50, side: 'SELL' },
    { time: '12:34:08', price: 2945.15, qty: 450, side: 'BUY' },
    { time: '12:34:10', price: 2945.20, qty: 3000, side: 'BUY' },
];

export const MarketDepthWidget: React.FC = () => {
    const { selectedSymbol } = useSelectionStore();
    const ltp = useMockTicker(selectedSymbol?.ticker || 'RELIANCE');
    const depth = useMemo(() => MOCK_DEPTH(ltp), [ltp, selectedSymbol]);
    const [view, setView] = useState<'DEPTH' | 'TAPE'>('DEPTH');

    const totalBidQty = depth.reduce((acc, d) => acc + d.bidQty, 0);
    const totalAskQty = depth.reduce((acc, d) => acc + d.askQty, 0);
    const bidR = (totalBidQty / (totalBidQty + totalAskQty)) * 100;

    const rowStyle: React.CSSProperties = {
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', 
        height: '24px', alignItems: 'center', padding: '0 8px', borderBottom: BORDER.standard,
        fontFamily: TYPE.family.mono, fontSize: '11px',
    };

    const headerStyle: React.CSSProperties = {
        ...rowStyle, height: '22px', background: COLOR.bg.elevated, color: COLOR.text.muted, fontSize: '9px',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ height: '32px', padding: '0 8px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: COLOR.bg.elevated }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: COLOR.text.primary, fontWeight: 'bold' }}>MARKET DEPTH</span>
                    <div style={{ border: BORDER.standard, display: 'flex', height: '20px' }}>
                        <button onClick={() => setView('DEPTH')} style={{ border: 'none', background: view === 'DEPTH' ? COLOR.interactive.hover : 'transparent', color: view === 'DEPTH' ? COLOR.text.primary : COLOR.text.muted, fontSize: '9px', padding: '0 8px', cursor: 'pointer', fontFamily: TYPE.family.mono }}>L2</button>
                        <button onClick={() => setView('TAPE')} style={{ border: 'none', background: view === 'TAPE' ? COLOR.interactive.hover : 'transparent', color: view === 'TAPE' ? COLOR.text.primary : COLOR.text.muted, fontSize: '9px', padding: '0 8px', cursor: 'pointer', fontFamily: TYPE.family.mono }}>TAPE</button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: COLOR.text.primary, fontWeight: 'bold' }}>{selectedSymbol?.ticker}</span>
                    <span style={{ fontSize: '10px', color: COLOR.text.muted }}>₹{ltp.toFixed(2)}</span>
                </div>
            </div>

            {view === 'DEPTH' ? (
                <>
                    {/* Imbalance Bar */}
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
                                <span style={{ color: d.bidQty > 4000 ? COLOR.semantic.info : COLOR.text.primary, fontWeight: d.bidQty > 4000 ? 'bold' : 'normal' }}>{d.bidQty}</span>
                                <span style={{ color: COLOR.semantic.up }}>{d.bidPrice.toFixed(2)}</span>
                                <span style={{ textAlign: 'right', color: COLOR.semantic.down }}>{d.askPrice.toFixed(2)}</span>
                                <span style={{ textAlign: 'right', color: d.askQty > 4000 ? COLOR.semantic.info : COLOR.text.primary, fontWeight: d.askQty > 4000 ? 'bold' : 'normal' }}>{d.askQty}</span>
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
                    {TAPE_TRADES.map((t, i) => (
                        <div key={i} style={{ ...rowStyle, gridTemplateColumns: 'repeat(6, 1fr)' }}>
                            <span style={{ gridColumn: 'span 2', color: COLOR.text.muted }}>{t.time}</span>
                            <span style={{ gridColumn: 'span 2', color: t.side === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down }}>{t.price.toFixed(2)}</span>
                            <span style={{ gridColumn: 'span 2', textAlign: 'right', color: t.qty > 1000 ? COLOR.semantic.info : COLOR.text.primary, fontWeight: t.qty > 1000 ? 'bold' : 'normal' }}>{t.qty}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Total Footer */}
            <div style={{ height: '24px', borderTop: BORDER.standard, display: 'flex', alignItems: 'center', padding: '0 8px', justifyContent: 'space-between', fontFamily: TYPE.family.mono, fontSize: '10px', background: COLOR.bg.elevated }}>
                <span style={{ color: COLOR.text.muted }}>SPREAD: <span style={{ color: COLOR.text.primary }}>{(depth[0].askPrice - depth[0].bidPrice).toFixed(2)}</span></span>
                <span style={{ color: COLOR.text.muted }}>RATIO: <span style={{ color: COLOR.text.primary }}>{bidR.toFixed(1)}% / {(100-bidR).toFixed(1)}%</span></span>
            </div>
        </div>
    );
};
