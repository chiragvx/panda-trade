import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { useToastStore } from '../ToastContainer';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { ShieldCheck, Cpu, Zap, Target, AlertCircle, Info, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../../ds/components/Button';

export const OrderEntryModal: React.FC = () => {
  const { isOrderModalOpen, orderMode, editingOrder, viewingOrder, viewingHolding, closeOrderModal, openModifyModal, openOrderModal } = useLayoutStore();
  const { selectedSymbol, setSelectedSymbol } = useSelectionStore();
  const { accessToken, status, funds, prices, instrumentMeta } = useUpstoxStore();
  const { addToast } = useToastStore();
  const dragControls = useDragControls();

  const [mode, setMode] = useState<'BUY' | 'SELL'>(orderMode || 'BUY');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<string>('');
  const [triggerPrice, setTriggerPrice] = useState<string>('0');
  const [productType, setProductType] = useState<'I' | 'D'>('I');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SL' | 'SL-M'>('MARKET');
  const [validity, setValidity] = useState<'DAY' | 'GTC' | 'IOC'>('DAY');
  const [isGTT, setIsGTT] = useState(false);
  const [gttTriggerPrice, setGttTriggerPrice] = useState<string>('');
  const [isBracket, setIsBracket] = useState(false);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  const [isAmo, setIsAmo] = useState(false);
  
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (editingOrder) {
      const raw = editingOrder.raw;
      setMode(editingOrder.side as any);
      setQuantity(raw.quantity);
      setPrice(String(raw.price || 0));
      setTriggerPrice(String(raw.trigger_price || 0));
      setProductType(raw.product as any);
      setOrderType(raw.order_type as any);
      setValidity(raw.validity as any);
      setIsAmo(!!raw.is_amo);
      
      // If we are editing but session symbol isn't this one, sync it
      if (selectedSymbol?.ticker !== raw.trading_symbol) {
          // Attempt to find meta
          const key = raw.instrument_token || '';
          const meta = instrumentMeta[key];
          if (meta) {
              setSelectedSymbol({
                  ticker: raw.trading_symbol,
                  name: meta.name,
                  exchange: raw.exchange,
                  instrument_key: key,
                  ltp: Number(raw.average_price || 0),
                  change: 0, changePct: 0, volume: 0, open:0, high:0, low:0, close:0
              });
          }
      }
    } else {
      if (orderMode) setMode(orderMode);
      if (selectedSymbol) {
        const ltp = prices[selectedSymbol.instrument_key || '']?.ltp || selectedSymbol.ltp || 0;
        setPrice(Number(ltp).toFixed(2));
        setTriggerPrice(Number(ltp).toFixed(2));
      }
    }
    
    // Auto-detect AMO (India Time)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
    const hour = istTime.getHours();
    const min = istTime.getMinutes();
    const totalMin = hour * 60 + min;
    const isMarketOpen = (totalMin >= 9 * 60 + 15) && (totalMin <= 15 * 60 + 30) && istTime.getDay() !== 0 && istTime.getDay() !== 6;
    if (!isMarketOpen) setIsAmo(true);
  }, [selectedSymbol, orderMode, editingOrder, isOrderModalOpen]);

  const isBuy = mode === 'BUY';
  const accentColor = isBuy ? COLOR.semantic.up : COLOR.semantic.down;
  const currentLtp = selectedSymbol?.instrument_key
    ? Number(prices[selectedSymbol.instrument_key || '']?.ltp ?? selectedSymbol?.ltp ?? 0)
    : Number(selectedSymbol?.ltp ?? 0);
  
  const isLive = status === 'connected' && !!accessToken;
  const availableMargin = Number(funds?.available_margin ?? 0);

  const totalValue = useMemo(() => quantity * (parseFloat(price) || currentLtp), [quantity, price, currentLtp]);
  const marginReq = useMemo(() => {
    // Rough estimate: Intraday 5x, Delivery 1x
    return productType === 'I' ? totalValue / 5 : totalValue;
  }, [totalValue, productType]);

  const riskReward = useMemo(() => {
    if (!isBracket || !stopLoss || !target || !price) return null;
    const entry = parseFloat(price) || currentLtp;
    const sl = parseFloat(stopLoss);
    const tgt = parseFloat(target);
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tgt - entry);
    if (risk === 0) return null;
    return {
      ratio: (reward / risk).toFixed(2),
      riskValue: (risk * quantity).toFixed(2),
      rewardValue: (reward * quantity).toFixed(2)
    };
  }, [isBracket, stopLoss, target, price, currentLtp, quantity]);

  const handleExecute = async () => {
    // 1. Connection Validation
    if (!isLive || !selectedSymbol?.instrument_key) {
      addToast('REJECTED: LIVE BROKER CONNECTION REQUIRED', 'error');
      return;
    }

    // 2. Margin Validation
    if (isLive && marginReq > availableMargin) {
      addToast(`REJECTED: INSUFFICIENT MARGIN (REQ: ₹${marginReq.toLocaleString()}, AVBL: ₹${availableMargin.toLocaleString()})`, 'error');
      return;
    }

    // 3. Basic Validation
    if (quantity <= 0) {
      addToast('REJECTED: INVALID QUANTITY', 'error');
      return;
    }

    setExecuting(true);
    try {
      if (editingOrder) {
        const modifyData = {
          order_id: editingOrder.id,
          quantity,
          validity,
          price: orderType === 'MARKET' || orderType === 'SL-M' ? 0 : parseFloat(price),
          order_type: orderType,
          trigger_price: (orderType === 'SL' || orderType === 'SL-M') ? parseFloat(triggerPrice) : 0,
        };
        const res = await upstoxApi.modifyOrder(accessToken!, modifyData);
        if (res.status === 'success') {
          addToast(`ORDER MODIFIED SUCCESSFULLY`, 'success');
          closeOrderModal();
        } else {
          addToast(`MODIFICATION FAILED: ${res.errors?.[0]?.message}`, 'error');
        }
      } else if (isGTT) {
        const gttData = {
          type: 'SINGLE',
          quantity,
          product: productType,
          instrument_token: selectedSymbol.instrument_key,
          transaction_type: mode,
          rules: [
            {
              strategy: 'ENTRY_LIMIT_PRICE',
              trigger_price: parseFloat(gttTriggerPrice || triggerPrice),
              price: orderType === 'MARKET' || orderType === 'SL-M' ? 0 : parseFloat(price)
            }
          ]
        };
        const res = await upstoxApi.placeGTT(accessToken!, gttData);
        if (res.status === 'success') {
          addToast(`${mode} GTT PLACED SUCCESSFULLY`, 'success');
          closeOrderModal();
        } else {
          addToast(`GTT REJECTION: ${res.errors?.[0]?.message || 'Broker side error'}`, 'error');
        }
      } else {
        const orderData = {
          quantity,
          product: productType,
          validity,
          price: orderType === 'MARKET' || orderType === 'SL-M' ? 0 : parseFloat(price),
          tag: 'SUPER_TERMINAL',
          instrument_token: selectedSymbol.instrument_key,
          order_type: orderType,
          transaction_type: mode,
          disclosed_quantity: 0,
          trigger_price: (orderType === 'SL' || orderType === 'SL-M') ? parseFloat(triggerPrice) : 0,
          is_amo: isAmo,
        };

        const res = await upstoxApi.placeOrder(accessToken!, orderData);
        if (res.status === 'success') {
          addToast(`ORDER EXECUTED • ID: ${res.data.order_id}`, 'success');
          closeOrderModal();
        } else {
          addToast(`BROKER REJECTION: ${res.errors?.[0]?.message || 'Unknown protocol error'}`, 'error');
        }
      }
    } catch (err: any) {
      addToast(`NETWORK ERROR: ${err.response?.data?.errors?.[0]?.message || 'Broker gateway timeout'}`, 'error');
    } finally {
      setExecuting(false);
    }
  };

  const setQtyByValue = (val: number) => {
    const p = parseFloat(price) || currentLtp;
    if (p > 0) setQuantity(Math.floor(val / p) || 1);
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: TYPE.family.mono,
    fontSize: '10px',
    color: COLOR.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#000000',
    border: `1px solid #333333`,
    borderRadius: 0,
    fontFamily: TYPE.family.mono,
    fontSize: TYPE.size.md,
    color: '#FFFFFF',
    padding: '6px 10px',
    outline: 'none',
    transition: 'border-color 0.1s',
  };

  const TabButton = ({ active, label, onClick, color }: any) => (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 0',
        background: active ? (color || accentColor) : 'transparent',
        border: 'none',
        color: active ? '#000' : COLOR.text.muted,
        fontFamily: TYPE.family.mono,
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.1s linear'
      }}
    >
      {label}
    </button>
  );

  const superBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 16px',
    borderRadius: '2px',
    border: active ? `1px solid ${accentColor}` : BORDER.standard,
    background: active ? `${accentColor}22` : 'transparent',
    color: active ? accentColor : COLOR.text.muted,
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: TYPE.family.mono,
    marginRight: '4px',
    transition: 'all 0.1s ease',
    textTransform: 'uppercase'
  });

  const superInputContainer: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.03)',
    border: BORDER.standard,
    borderRadius: '0px',
    padding: '0 8px',
    height: '26px',
    marginRight: '8px',
    position: 'relative'
  };

  const superInputLabel: React.CSSProperties = {
    fontSize: '9px',
    color: COLOR.text.muted,
    marginRight: '6px',
    whiteSpace: 'nowrap',
    fontFamily: TYPE.family.mono
  };

  const superInput: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: COLOR.text.primary,
    fontSize: '11px',
    fontFamily: TYPE.family.mono,
    width: '60px',
    outline: 'none',
    textAlign: 'right'
  };

  return (
    <AnimatePresence>
      {isOrderModalOpen && (selectedSymbol || viewingOrder || viewingHolding) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            style={{
              position: 'absolute',
              left: 'calc(50% - 370px)',
              top: '20%',
              width: '740px',
              minWidth: '600px',
              minHeight: '120px',
              background: '#000000',
              border: `1px solid #333333`,
              boxShadow: `0 0 50px rgba(255,119,34,0.05), 0 20px 80px rgba(0,0,0,1)`,
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              overflow: 'hidden',
              resize: 'both'
            }}
          >
            {/* Native Resize Anchor Visual */}
            <div style={{ position: 'absolute', right: 0, bottom: 0, width: '12px', height: '12px', background: `linear-gradient(135deg, transparent 50%, #FF7722 50%)`, cursor: 'nwse-resize', pointerEvents: 'none', zIndex: 100 }} />
            {/* Header */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{
                background: '#000000',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                cursor: 'move',
                borderBottom: `1px solid #333333`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Zap size={13} color={accentColor} fill={accentColor + '22'} />
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: COLOR.text.primary, letterSpacing: '0.1em' }}>
                    {viewingHolding ? 'ASSET DETAILS' : viewingOrder ? 'TRANSACTION INFO' : editingOrder ? 'MODIFICATION COMMAND' : 'PRECISION COMMAND'}
                </span>
                <span style={{ fontSize: '10px', color: COLOR.text.muted }}>|</span>
                <span style={{ fontSize: '11px', color: accentColor, fontWeight: 'bold' }}>{viewingHolding?.trading_symbol || viewingOrder?.symbol || selectedSymbol?.ticker}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={12} color={isLive ? COLOR.semantic.up : COLOR.text.muted} />
                  <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>{isLive ? 'LIVE' : 'PAPER'}</span>
                </div>
                <button 
                  onClick={closeOrderModal}
                  style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer', fontSize: '18px' }}
                >
                  ×
                </button>
              </div>
            </div>

            {viewingHolding ? (
              <div style={{ background: '#000', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { label: 'SYMBOL', val: viewingHolding.trading_symbol },
                            { label: 'EXCHANGE', val: viewingHolding.exchange },
                            { label: 'INSTRUMENT_KEY', val: viewingHolding.instrument_token },
                            { label: 'QTY', val: viewingHolding.quantity },
                            { label: 'T1_QTY', val: viewingHolding.t1_quantity || '0' }
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #111', paddingBottom: '4px' }}>
                                <span style={{ fontSize: '10px', color: '#666', fontFamily: TYPE.family.mono }}>{item.label}</span>
                                <span style={{ fontSize: '11px', color: '#FFF', fontFamily: TYPE.family.mono, fontWeight: 'bold' }}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         {[
                            { label: 'AVG_PRC', val: `₹${Number(viewingHolding.average_price).toFixed(2)}` },
                            { label: 'LTP', val: `₹${Number(viewingHolding.last_price).toFixed(2)}` },
                            { label: 'P&L', val: `₹${Number(viewingHolding.pnl).toFixed(2)}`, color: viewingHolding.pnl >= 0 ? COLOR.semantic.up : COLOR.semantic.down },
                            { label: 'CHG%', val: `${((viewingHolding.pnl / (viewingHolding.average_price * viewingHolding.quantity)) * 100).toFixed(2)}%`, color: viewingHolding.pnl >= 0 ? COLOR.semantic.up : COLOR.semantic.down },
                            { label: 'DAY_CHG%', val: `${Number(viewingHolding.day_change_percentage || 0).toFixed(2)}%`, color: (viewingHolding.day_change_percentage || 0) >= 0 ? COLOR.semantic.up : COLOR.semantic.down }
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #111', paddingBottom: '4px' }}>
                                <span style={{ fontSize: '10px', color: '#666', fontFamily: TYPE.family.mono }}>{item.label}</span>
                                <span style={{ fontSize: '11px', color: item.color || '#CCC', fontFamily: TYPE.family.mono, fontWeight: 'bold' }}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                    <Button variant="buy" onClick={() => { setSelectedSymbol({ ticker: viewingHolding.trading_symbol, instrument_key: viewingHolding.instrument_token } as any); setTimeout(() => openOrderModal('BUY'), 0); }} style={{ flex: 1, height: '36px' }}>BUY MORE</Button>
                    <Button variant="sell" onClick={() => { setSelectedSymbol({ ticker: viewingHolding.trading_symbol, instrument_key: viewingHolding.instrument_token } as any); setTimeout(() => openOrderModal('SELL'), 0); }} style={{ flex: 1, height: '36px' }}>EXIT POSITION</Button>
                    <Button variant="ghost" onClick={closeOrderModal} style={{ flex: 1, height: '36px' }}>CLOSE</Button>
                </div>
              </div>
            ) : viewingOrder ? (
              <div style={{ background: '#000', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { label: 'ORDER_ID', val: viewingOrder.id },
                            { label: 'TIMESTAMP', val: viewingOrder.time },
                            { label: 'EXCHANGE', val: viewingOrder.raw.exchange },
                            { label: 'PRODUCT', val: viewingOrder.raw.product },
                            { label: 'STATUS', val: viewingOrder.status, color: accentColor }
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #111', paddingBottom: '4px' }}>
                                <span style={{ fontSize: '10px', color: '#666', fontFamily: TYPE.family.mono }}>{item.label}</span>
                                <span style={{ fontSize: '11px', color: item.color || '#FFF', fontFamily: TYPE.family.mono, fontWeight: 'bold' }}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         {[
                            { label: 'SIDE', val: viewingOrder.side, color: viewingOrder.side === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down },
                            { label: 'QTY', val: viewingOrder.quantity },
                            { label: 'PRICE', val: viewingOrder.price },
                            { label: 'AVG_PRC', val: viewingOrder.raw.average_price || '--' },
                            { label: 'BROKER_MSG', val: viewingOrder.raw.status_message || 'OK' }
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #111', paddingBottom: '4px' }}>
                                <span style={{ fontSize: '10px', color: '#666', fontFamily: TYPE.family.mono }}>{item.label}</span>
                                <span style={{ fontSize: '11px', color: item.color || '#CCC', fontFamily: TYPE.family.mono, fontWeight: 'bold' }}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                    {(viewingOrder.status === 'PENDING' || viewingOrder.status === 'OPEN' || viewingOrder.status === 'PUT_ORDER_REQ_RECEIVED') && (
                        <>
                            <Button variant="buy" onClick={() => openModifyModal(viewingOrder)} style={{ flex: 1, height: '36px' }}>MODIFY ORDER</Button>
                            <Button variant="danger" onClick={async () => { await upstoxApi.cancelOrder(accessToken!, viewingOrder.id); addToast('CANCEL REQ SENT', 'info'); closeOrderModal(); }} style={{ flex: 1, height: '36px' }}>CANCEL ORDER</Button>
                        </>
                    )}
                    <Button variant="ghost" onClick={closeOrderModal} style={{ flex: 1, height: '36px' }}>CLOSE</Button>
                </div>
              </div>
            ) : (
                <>
                {/* Row 1: Position & Market Context */}
                <div style={{ height: '34px', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '24px', background: `linear-gradient(to right, ${accentColor}05, transparent)` }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>POSITION:</span>
                    <span style={{ fontSize: '11px', color: COLOR.text.primary, fontWeight: 'bold', fontFamily: TYPE.family.mono }}>0</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>NBBO:</span>
                    <span style={{ fontSize: '11px', color: COLOR.text.primary, fontFamily: TYPE.family.mono }}>{(currentLtp - 0.05).toFixed(2)} / {(currentLtp + 0.05).toFixed(2)}</span>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '9px', color: COLOR.text.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Target size={11} /> GTT: {isGTT ? 'ACTIVE' : 'OFF'}
                    </span>
                    <span style={{ fontSize: '9px', color: COLOR.text.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={11} /> SL/TP: {isBracket ? 'ACTIVE' : 'OFF'}
                    </span>
                </div>
                </div>

                {/* Row 2: Operation Bar */}
                <div style={{ padding: '8px 12px 14px 12px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                {/* Mode Toggle */}
                <div style={{ display: 'flex' }}>
                    <button style={superBtnStyle(isBuy)} onClick={() => setMode('BUY')}>BUY</button>
                    <button style={superBtnStyle(!isBuy)} onClick={() => setMode('SELL')}>SELL</button>
                </div>

                {/* Product Type Toggle */}
                <div style={{ display: 'flex', border: BORDER.standard, padding: '1px' }}>
                    <button 
                    onClick={() => setProductType('I')}
                    style={{ ...superBtnStyle(productType === 'I'), border: 'none', padding: '4px 8px', marginRight: 0 }}
                    >MIS</button>
                    <button 
                    onClick={() => setProductType('D')}
                    style={{ ...superBtnStyle(productType === 'D'), border: 'none', padding: '4px 8px', marginRight: 0 }}
                    >CNC</button>
                </div>

                {/* Order Type Dropdown */}
                <div style={{ ...superInputContainer, width: '90px', padding: 0 }}>
                    <select 
                    value={orderType} 
                    onChange={e => setOrderType(e.target.value as any)}
                    style={{ ...superInput, width: '100%', height: '100%', appearance: 'none', background: 'transparent', textAlign: 'left', padding: '0 8px', cursor: 'pointer' }}
                    >
                    <option value="MARKET" style={{ background: '#000' }}>MARKET</option>
                    <option value="LIMIT" style={{ background: '#000' }}>LIMIT</option>
                    <option value="SL" style={{ background: '#000' }}>STOP LOSS</option>
                    <option value="SL-M" style={{ background: '#000' }}>SL-MKT</option>
                    </select>
                    <span style={{ fontSize: '8px', color: COLOR.text.muted, position: 'absolute', right: '8px', pointerEvents: 'none' }}>▼</span>
                </div>

                {/* QTY */}
                <div style={superInputContainer}>
                    <span style={superInputLabel}>QTY</span>
                    <input 
                    type="number" 
                    min="1"
                    value={quantity} 
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                    style={{ ...superInput, width: '45px' }} 
                    />
                </div>

                {/* LMT PRICE */}
                <div style={{ ...superInputContainer }}>
                    <span style={superInputLabel}>{orderType.includes('MARKET') ? 'EST. PRC' : 'LMT PRC'}</span>
                    <input 
                    type="text" 
                    disabled={orderType.includes('MARKET')}
                    value={orderType.includes('MARKET') ? currentLtp.toFixed(2) : price} 
                    onChange={e => setPrice(e.target.value)} 
                    style={{ ...superInput, opacity: orderType.includes('MARKET') ? 0.3 : 1, width: '65px' }} 
                    />
                </div>

                {/* Trigger Price (Visible for SL) */}
                {(orderType === 'SL' || orderType === 'SL-M') && (
                    <div style={superInputContainer}>
                    <span style={superInputLabel}>TRG</span>
                    <input 
                        type="text" 
                        value={triggerPrice} 
                        onChange={e => setTriggerPrice(e.target.value)} 
                        style={{ ...superInput, width: '65px' }} 
                    />
                    </div>
                )}

                {/* Validity Dropdown */}
                <div style={{ ...superInputContainer, width: '70px', padding: 0 }}>
                    <select 
                    value={validity} 
                    onChange={e => setValidity(e.target.value as any)}
                    style={{ ...superInput, width: '100%', height: '100%', appearance: 'none', background: 'transparent', textAlign: 'left', padding: '0 8px', cursor: 'pointer' }}
                    >
                    <option value="DAY" style={{ background: '#000' }}>DAY</option>
                    <option value="IOC" style={{ background: '#000' }}>IOC</option>
                    </select>
                    <span style={{ fontSize: '8px', color: COLOR.text.muted, position: 'absolute', right: '8px', pointerEvents: 'none' }}>▼</span>
                </div>

                {/* Summary Impact */}
                <div style={{ margin: '0 12px', display: 'flex', flexDirection: 'column', gap: '1px', minWidth: '80px' }}>
                    <span style={{ fontSize: '8px', color: COLOR.text.muted, whiteSpace: 'nowrap' }}>VAL: ₹{totalValue.toLocaleString()}</span>
                    <span style={{ fontSize: '8px', color: marginReq > availableMargin ? COLOR.semantic.down : COLOR.text.muted, whiteSpace: 'nowrap' }}>MAR: ₹{marginReq.toLocaleString()}</span>
                </div>

                {/* Main Submit Button */}
                <button
                    onClick={handleExecute}
                    disabled={executing}
                    style={{
                    height: '32px',
                    padding: '0 20px',
                    background: executing ? '#1a1a1c' : accentColor,
                    color: '#000',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginLeft: 'auto',
                    cursor: executing ? 'not-allowed' : 'pointer',
                    opacity: (isLive && marginReq > availableMargin) ? 0.6 : 1,
                    boxShadow: (isLive && marginReq > availableMargin) ? 'none' : `0 4px 12px -4px ${accentColor}88`,
                    whiteSpace: 'nowrap'
                    }}
                >
                    {executing ? 'TX...' : (
                    <>
                        {editingOrder ? 'MODIFY ORDER' : `SUBMIT ${mode}`}
                        <Zap size={12} fill="#000" />
                    </>
                    )}
                </button>
                </div>
                
                {/* Advanced Options Bar */}
                <div style={{ padding: '0 12px 10px 12px', display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '8px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isGTT ? COLOR.semantic.info : COLOR.text.muted, fontSize: '9px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isGTT} onChange={e => setIsGTT(e.target.checked)} style={{ accentColor: COLOR.semantic.info }} /> GTT
                </label>
                {isGTT && (
                    <div style={{ ...superInputContainer, height: '22px', border: `1px solid ${COLOR.semantic.info}44` }}>
                    <span style={superInputLabel}>GTT TRG</span>
                    <input type="text" value={gttTriggerPrice} onChange={e => setGttTriggerPrice(e.target.value)} style={{ ...superInput, height: '100%', width: '60px' }} />
                    </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isBracket ? COLOR.semantic.info : COLOR.text.muted, fontSize: '9px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isBracket} onChange={e => setIsBracket(e.target.checked)} style={{ accentColor: COLOR.semantic.info }} /> BO
                </label>
                {isBracket && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ ...superInputContainer, height: '22px' }}>
                        <span style={superInputLabel}>SL</span>
                        <input type="text" value={stopLoss} onChange={e => setStopLoss(e.target.value)} style={{ ...superInput, height: '100%', width: '50px' }} />
                    </div>
                    <div style={{ ...superInputContainer, height: '22px' }}>
                        <span style={superInputLabel}>TGT</span>
                        <input type="text" value={target} onChange={e => setTarget(e.target.value)} style={{ ...superInput, height: '100%', width: '50px' }} />
                    </div>
                    </div>
                )}
                <div style={{ flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isAmo ? '#f59e0b' : COLOR.text.muted, fontSize: '9px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isAmo} onChange={e => setIsAmo(e.target.checked)} style={{ accentColor: '#f59e0b' }} /> AMO ORDER
                </label>
                </div>
            </>
            )}

            {/* Status Beam */}
            <div style={{ height: '2px', background: isLive ? COLOR.semantic.up : COLOR.text.muted, opacity: 0.5 }} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
