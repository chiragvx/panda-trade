import React, { useState, useEffect } from 'react';
import { TabNode } from 'flexlayout-react';
import { useSelectionStore } from '../../store/useStore';
import { ShieldCheck, Zap } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { isIsin } from '../../utils/liveSymbols';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { NIFTY_50 } from '../../utils/defaultSymbol';

interface OrderEntryWidgetProps {
    node?: TabNode;
}

export const OrderEntryWidget: React.FC<OrderEntryWidgetProps> = ({ node }) => {
    const { selectedSymbol: globalSymbol } = useSelectionStore();
    const { setInstrumentMeta } = useUpstoxStore();
    const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
    const [symbol, setSymbol] = useState(globalSymbol?.ticker || NIFTY_50.ticker);
    const [name, setName] = useState(globalSymbol?.name || NIFTY_50.name);
    const [price, setPrice] = useState('0.00');
    const [qty, setQty] = useState('1');
    const [localOverride, setLocalOverride] = useState(false);

    const displaySymbol = isIsin(symbol) ? (name || 'INSTRUMENT') : symbol;

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
            setName(globalSymbol.name);
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
                        <div style={{ fontSize: '14px', fontWeight: TYPE.weight.black,  letterSpacing: TYPE.letterSpacing.tight, color: COLOR.text.primary }}>{displaySymbol || 'WAITING_FOR_CTX'}</div>
                        <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted,  fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>LIMIT_ORDER_ENTRY</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <WidgetSymbolSearch 
                        onSelect={(res) => {
                            setSymbol(res.ticker);
                            setName(res.name);
                            setLocalOverride(true);
                            setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
                        }}
                        placeholder="SEARCH..." 
                    />
                    {localOverride && (
                        <button 
                            onClick={() => {
                                setLocalOverride(false);
                                if (globalSymbol) {
                                    setSymbol(globalSymbol.ticker);
                                    setName(globalSymbol.name);
                                    setPrice(globalSymbol.ltp.toString());
                                }
                            }}
                            style={{ background: 'transparent', border: 'none', color: activeColor, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, cursor: 'pointer', letterSpacing: TYPE.letterSpacing.caps }}
                        >
                            RESET
                        </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${activeColor}40`, padding: '2px 8px', background: `${activeColor}10`, borderRadius: '2px' }}>
                        <Zap size={10} style={{ color: activeColor }} />
                        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: activeColor, letterSpacing: TYPE.letterSpacing.caps }}>LIVE_ACTIVE</span>
                    </div>
                </div>
            </div>

            {/* Form Area */}
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>QUANTITY</label>
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
                        <label style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>PRICE</label>
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
                            padding: '8px', 
                            fontSize: TYPE.size.xs, 
                            fontWeight: TYPE.weight.black, 
                            background: type === 'LIMIT' ? `${COLOR.semantic.info}20` : COLOR.bg.surface, 
                            border: type === 'LIMIT' ? BORDER.info : BORDER.standard,
                            color: type === 'LIMIT' ? COLOR.semantic.info : COLOR.text.muted,
                            cursor: 'pointer',
                            letterSpacing: TYPE.letterSpacing.caps,
                            borderRadius: '2px'
                        }}>
                            {type}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '12px', background: COLOR.bg.elevated, border: BORDER.standard, display: 'flex', flexDirection: 'column', gap: '10px', borderRadius: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>MARGIN_REQD</span>
                        <span style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.black, fontVariantNumeric: 'tabular-nums', color: COLOR.text.primary }}>₹{(parseFloat(qty || '0') * parseFloat(price || '0')).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>AVAIL_CASH</span>
                        <span style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.black, color: COLOR.semantic.up, fontVariantNumeric: 'tabular-nums' }}>₹1,42,500.20</span>
                    </div>
                    <div style={{ height: '1px', background: COLOR.bg.border }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLOR.semantic.up }}>
                        <ShieldCheck size={14} />
                        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>SECURE_PRECISION_EXECUTION</span>
                    </div>
                </div>
            </div>

            {/* Main Action */}
            <div style={{ padding: '20px', borderTop: BORDER.standard, background: COLOR.bg.elevated }}>
                <button style={{ 
                    width: '100%', 
                    padding: '14px', 
                    background: activeColor, 
                    border: 'none', 
                    color: COLOR.text.inverse, 
                    fontSize: TYPE.size.sm, 
                    fontWeight: TYPE.weight.black, 
                     
                    letterSpacing: TYPE.letterSpacing.caps,
                    cursor: 'pointer',
                    borderRadius: '2px',
                    boxShadow: `0 4px 12px ${activeColor}40`
                }}>
                    TRANSMIT_{mode}_ORDER
                </button>
            </div>
        </div>
    );
};
