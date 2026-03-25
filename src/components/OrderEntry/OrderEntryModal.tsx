import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useToastStore } from '../ToastContainer';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';

export const OrderEntryModal: React.FC = () => {
    const { isOrderModalOpen, orderMode, closeOrderModal, openOrderModal } = useLayoutStore();
    const { selectedSymbol } = useSelectionStore();
    const { addToast } = useToastStore();
    const dragControls = useDragControls();

    const [mode, setMode] = useState<'BUY' | 'SELL'>(orderMode || 'BUY');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState<string>('');
    const [productType, setProductType] = useState('MIS');
    const [exchange, setExchange] = useState('NSE');
    const [orderType, setOrderType] = useState('MKT');

    /* Pack 1 additions: Bracket Order */
    const [isBracket, setIsBracket] = useState(false);
    const [stopLoss, setStopLoss] = useState<string>('');
    const [target, setTarget] = useState<string>('');
    const [isGTT, setIsGTT] = useState(false);
    const [isOCO, setIsOCO] = useState(false);

    useEffect(() => {
        if (orderMode) setMode(orderMode);
        if (selectedSymbol && !price) setPrice(selectedSymbol.ltp.toFixed(2));
    }, [orderMode, isOrderModalOpen, selectedSymbol]);

    /* Global Keyboard Shortcuts */
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key.toUpperCase() === 'B') {
                e.preventDefault();
                openOrderModal('BUY');
            } else if (e.shiftKey && e.key.toUpperCase() === 'S') {
                e.preventDefault();
                openOrderModal('SELL');
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [openOrderModal]);



    const isBuy = mode === 'BUY';
    const accentColor = isBuy ? COLOR.semantic.up : COLOR.semantic.down;
    const currentLtp = selectedSymbol?.ltp || 0;

    /* Risk/Reward Calculation */
    const rrRatio = useMemo(() => {
        if (!isBracket || !stopLoss || !target || !price || !selectedSymbol) return null;
        const entry = parseFloat(price) || currentLtp;
        const sl = parseFloat(stopLoss);
        const tgt = parseFloat(target);
        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tgt - entry);
        return risk > 0 ? (reward / risk).toFixed(2) : '0';
    }, [isBracket, stopLoss, target, price, currentLtp, selectedSymbol]);

    const handleExecute = () => {
        const slippage = (Math.random() * 0.05).toFixed(2);
        const fillPrice = (parseFloat(price || currentLtp.toString()) + (isBuy ? 0.05 : -0.05)).toFixed(2);
        
        addToast(`${mode} EXEC @ ₹${fillPrice} (Slippage: ₹${slippage})`, 'success');
        closeOrderModal();
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: TYPE.family.mono, fontSize: '9px',
        color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', background: COLOR.bg.overlay, border: BORDER.standard,
        borderRadius: 0, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm,
        color: COLOR.text.primary, padding: '4px 8px', outline: 'none',
        caretColor: COLOR.semantic.info,
    };

    const segStyle = (active: boolean): React.CSSProperties => ({
        flex: 1, padding: '3px 0', background: active ? accentColor : 'transparent',
        border: 'none', borderRadius: 0, fontFamily: TYPE.family.mono, fontSize: '10px',
        letterSpacing: TYPE.letterSpacing.caps, textTransform: 'uppercase', cursor: 'pointer',
        color: active ? COLOR.text.inverse : COLOR.text.muted,
        transition: 'background 80ms linear, color 80ms linear',
    });

    return (
        <AnimatePresence>
            {isOrderModalOpen && selectedSymbol && (
                <div key="order-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
                    <motion.div
                        drag
                        dragControls={dragControls}
                        dragListener={false}
                        dragMomentum={false}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            left: 'calc(50% - 200px)', top: '15%',
                            width: '400px', pointerEvents: 'auto',
                            background: COLOR.bg.overlay, border: `1px solid ${accentColor}`,
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.8)',
                        }}
                    >
                    {/* Header */}
                    <div
                        onPointerDown={e => dragControls.start(e)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            height: '28px', padding: '0 8px', flexShrink: 0,
                            background: COLOR.bg.elevated, borderBottom: BORDER.standard, cursor: 'move',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', background: accentColor }} />
                            <span style={{ ...labelStyle, color: COLOR.text.primary }}>ORDER ENTRY • {mode}</span>
                        </div>
                        <button onClick={closeOrderModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: TYPE.family.mono, fontSize: '16px', color: COLOR.text.muted }}>×</button>
                    </div>

                    {/* Symbol Info */}
                    <div style={{ padding: '12px', borderBottom: BORDER.standard, display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.lg, fontWeight: 'bold' }}>{selectedSymbol.ticker}</div>
                            <div style={{ fontSize: '10px', color: COLOR.text.muted }}>{selectedSymbol.exchange} • LTP ₹{currentLtp.toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', border: BORDER.standard, height: '22px' }}>
                            <button style={segStyle(isBuy)} onClick={() => setMode('BUY')}>BUY</button>
                            <button style={segStyle(!isBuy)} onClick={() => setMode('SELL')}>SELL</button>
                        </div>
                    </div>

                    {/* Form Controls */}
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Type selectors */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {(['MIS', 'NRML', 'CNC'] as const).map(pt => (
                                <button key={pt} onClick={() => setProductType(pt)} style={{ ...segStyle(productType === pt), flex: 'none', padding: '2px 10px', border: BORDER.standard }}>{pt}</button>
                            ))}
                            <div style={{ flex: 1 }} />
                            {(['MKT', 'LMT', 'SL'] as const).map(ot => (
                                <button key={ot} onClick={() => setOrderType(ot)} style={{ ...segStyle(orderType === ot), flex: 'none', padding: '2px 10px', border: BORDER.standard }}>{ot}</button>
                            ))}
                        </div>

                        {/* Qty & Price */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>Quantity</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>Price</label>
                                <input 
                                    type="text" 
                                    value={orderType === 'MKT' ? 'MARKET' : price} 
                                    disabled={orderType === 'MKT'} 
                                    onChange={e => setPrice(e.target.value)} 
                                    style={{ ...inputStyle, opacity: orderType === 'MKT' ? 0.5 : 1 }} 
                                />
                            </div>
                        </div>

                        {/* Bracket Order Section */}
                        <div style={{ border: `1px dashed ${isBracket ? accentColor : COLOR.bg.border}`, padding: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isBracket ? '8px' : 0 }}>
                                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={isBracket} onChange={e => setIsBracket(e.target.checked)} /> BRACKET ORDER
                                </label>
                                {isBracket && rrRatio && <span style={{ fontFamily: TYPE.family.mono, fontSize: '9px', color: COLOR.semantic.info }}>R:R {rrRatio}</span>}
                            </div>
                            {isBracket && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={labelStyle}>Stop Loss</label>
                                        <input type="text" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="Price..." style={inputStyle} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={labelStyle}>Target</label>
                                        <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="Price..." style={inputStyle} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Advanced Flags */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                             <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={isGTT} onChange={e => setIsGTT(e.target.checked)} /> GTT
                            </label>
                             <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={isOCO} onChange={e => setIsOCO(e.target.checked)} /> OCO
                            </label>
                        </div>

                        {/* Margin Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.02)', border: BORDER.standard, fontSize: '10px', fontFamily: TYPE.family.mono }}>
                            <div>
                                <div style={{ color: COLOR.text.muted }}>MARGIN REQ.</div>
                                <div style={{ color: COLOR.text.primary }}>₹{((quantity * (parseFloat(price) || currentLtp)) / 5).toFixed(0)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: COLOR.text.muted }}>SURPLUS</div>
                                <div style={{ color: COLOR.semantic.up }}>₹1,24,500</div>
                            </div>
                        </div>

                        {/* Execute */}
                        <button 
                            onClick={handleExecute}
                            style={{
                                width: '100%', padding: '10px', background: accentColor,
                                border: 'none', color: COLOR.text.inverse, fontFamily: TYPE.family.mono,
                                fontWeight: 'bold', letterSpacing: '0.1em', cursor: 'pointer'
                            }}
                        >
                            {isBuy ? 'BUY' : 'SELL'} {quantity} {selectedSymbol.ticker}
                        </button>
                    </div>
                </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
