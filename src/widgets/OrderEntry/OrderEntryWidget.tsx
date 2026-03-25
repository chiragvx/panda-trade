import React, { useState, useEffect } from 'react';
import { TabNode } from 'flexlayout-react';
import { useSelectionStore } from '../../store/useStore';
import { ShieldCheck, Zap } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

interface OrderEntryWidgetProps {
    node?: TabNode;
}

export const OrderEntryWidget: React.FC<OrderEntryWidgetProps> = ({ node }) => {
    const { selectedSymbol: globalSymbol } = useSelectionStore();
    const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
    const [symbol, setSymbol] = useState(globalSymbol?.ticker || '');
    const [price, setPrice] = useState('0.00');
    const [qty, setQty] = useState('1');

    useEffect(() => {
        if (node) {
            const name = node.getName();
            const parts = name.split(' ');
            if (parts.length >= 2) {
                setSymbol(parts[0]);
                setMode(parts[1] === 'SELL' ? 'SELL' : 'BUY');
            }
        }
    }, [node]);

    useEffect(() => {
        if (!node && globalSymbol) {
            setSymbol(globalSymbol.ticker);
            setPrice(globalSymbol.ltp.toString());
        }
    }, [globalSymbol, node]);

    const activeColor = mode === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down;

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            background: COLOR.bg.base, 
            fontFamily: TYPE.family.mono,
            color: COLOR.text.primary,
            userSelect: 'none'
        }}>
            {/* Header */}
            <div style={{ 
                padding: '12px 16px', 
                borderBottom: `2px solid ${activeColor}`, 
                background: COLOR.bg.surface,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        background: activeColor, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '14px', 
                        fontWeight: TYPE.weight.bold, 
                        color: COLOR.text.inverse 
                    }}>
                        {mode === 'BUY' ? 'B' : 'S'}
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: TYPE.weight.bold, textTransform: 'uppercase' }}>{symbol || 'WAITING_FOR_CTX'}</div>
                        <div style={{ fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase' }}>LIMIT_ORDER_ENTRY</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${activeColor}40`, padding: '2px 8px', background: `${activeColor}10` }}>
                    <Zap size={10} style={{ color: activeColor }} />
                    <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: activeColor }}>LIVE_FEED_ACTIVE</span>
                </div>
            </div>

            {/* Form Area */}
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '9px', color: COLOR.text.muted }}>QUANTITY</label>
                        <input 
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            style={{ 
                                background: COLOR.bg.elevated, 
                                border: BORDER.standard, 
                                color: COLOR.text.primary, 
                                padding: '8px 12px', 
                                fontSize: '12px', 
                                outline: 'none', 
                                fontFamily: TYPE.family.mono,
                                width: '100%'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '9px', color: COLOR.text.muted }}>PRICE</label>
                        <input 
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            style={{ 
                                background: COLOR.bg.elevated, 
                                border: BORDER.standard, 
                                color: COLOR.text.primary, 
                                padding: '8px 12px', 
                                fontSize: '12px', 
                                outline: 'none', 
                                fontFamily: TYPE.family.mono,
                                width: '100%'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {['MARKET', 'LIMIT', 'SL'].map(type => (
                        <button key={type} style={{ 
                            padding: '6px', 
                            fontSize: '9px', 
                            fontWeight: TYPE.weight.bold, 
                            background: type === 'LIMIT' ? COLOR.interactive.selected : COLOR.bg.surface, 
                            border: type === 'LIMIT' ? `1px solid ${COLOR.semantic.info}` : BORDER.standard,
                            color: type === 'LIMIT' ? COLOR.semantic.info : COLOR.text.muted,
                            cursor: 'pointer'
                        }}>
                            {type}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '12px', background: COLOR.bg.surface, border: BORDER.standard, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: COLOR.text.muted }}>MARGIN_REQD</span>
                        <span style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, fontVariantNumeric: 'tabular-nums' }}>₹{(parseFloat(qty || '0') * parseFloat(price || '0')).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: COLOR.text.muted }}>AVAIL_CASH</span>
                        <span style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.up, fontVariantNumeric: 'tabular-nums' }}>₹1,42,500.20</span>
                    </div>
                    <div style={{ height: '1px', background: COLOR.bg.border }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLOR.semantic.up }}>
                        <ShieldCheck size={12} />
                        <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold }}>POST_TRADE_PRE_VALID_OFFLINE</span>
                    </div>
                </div>
            </div>

            {/* Main Action */}
            <div style={{ padding: '20px', borderTop: BORDER.standard }}>
                <button style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: activeColor, 
                    border: 'none', 
                    color: COLOR.text.inverse, 
                    fontSize: '11px', 
                    fontWeight: TYPE.weight.bold, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.2em',
                    cursor: 'pointer'
                }}>
                    TRANSMIT_{mode}_ORDER
                </button>
            </div>
        </div>
    );
};
