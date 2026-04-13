import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { useToastStore } from '../ToastContainer';
import { ShieldCheck, Cpu, Zap, Target, AlertCircle, Info, Calculator, TrendingUp, TrendingDown, X } from 'lucide-react';
import { 
  COLOR, 
  TYPE, 
  BORDER, 
  Z, 
  ROW_HEIGHT, 
  LAYOUT,
  Button, 
  Text, 
  KeyValue, 
  Row, 
  Input, 
  Select, 
  Tag, 
  Dot 
} from '../../ds';

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
      
      if (selectedSymbol?.ticker !== raw.trading_symbol) {
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
    return productType === 'I' ? totalValue / 5 : totalValue;
  }, [totalValue, productType]);

  const handleExecute = async () => {
    if (!isLive || !selectedSymbol?.instrument_key) {
      addToast('REJECTED: LIVE BROKER CONNECTION REQUIRED', 'error');
      return;
    }
    if (isLive && marginReq > availableMargin) {
      addToast(`REJECTED: INSUFFICIENT MARGIN (REQ: ₹${marginReq.toLocaleString()}, AVBL: ₹${availableMargin.toLocaleString()})`, 'error');
      return;
    }
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

  const superBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: '0',
    border: active ? `1px solid ${accentColor}` : BORDER.standard,
    background: active ? `${accentColor}22` : 'transparent',
    color: active ? accentColor : COLOR.text.muted,
    fontSize: TYPE.size.xs,
    fontWeight: TYPE.weight.bold,
    cursor: 'pointer',
    fontFamily: TYPE.family.mono,
    marginRight: '0',
    transition: 'all 0.1s ease',
    textTransform: 'uppercase',
    letterSpacing: TYPE.letterSpacing.caps,
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '48px'
  });

  return (
    <AnimatePresence>
      {isOrderModalOpen && (selectedSymbol || viewingOrder || viewingHolding) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: Z.modal, pointerEvents: 'none' }}>
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: 'absolute',
              left: 'calc(50% - 370px)',
              top: '20%',
              width: '740px',
              minWidth: '600px',
              background: COLOR.bg.base,
              border: BORDER.strong,
              boxShadow: `0 0 50px rgba(255,119,34,0.05), 0 20px 80px rgba(0,0,0,1)`,
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              overflow: 'hidden',
              borderRadius: 0,
            }}
          >
            {/* Header */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{
                background: COLOR.bg.elevated,
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                cursor: 'move',
                borderBottom: BORDER.standard,
                gap: '12px'
              }}
            >
              <Zap size={14} color={accentColor} fill={accentColor + '22'} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Text variant="heading" size="xs" color="primary">
                  {viewingHolding ? 'ASSET_DETAILS' : viewingOrder ? 'TRANSACTION_INFO' : editingOrder ? 'MODIFICATION_COMMAND' : 'PRECISION_COMMAND'}
                </Text>
                <div style={{ width: '1px', height: '12px', background: COLOR.bg.border }} />
                <Text weight="black" color="info" size="sm">
                  {viewingHolding?.trading_symbol || viewingOrder?.symbol || selectedSymbol?.ticker}
                </Text>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Dot color={isLive ? 'up' : 'muted'} size={6} pulse={isLive} />
                  <Text variant="label" color="muted">{isLive ? 'LIVE' : 'PAPER'}</Text>
                </div>
                <button 
                  onClick={closeOrderModal}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: COLOR.text.muted, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = COLOR.text.primary}
                  onMouseLeave={e => e.currentTarget.style.color = COLOR.text.muted}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {viewingHolding ? (
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <KeyValue label="SYMBOL" value={viewingHolding.trading_symbol} />
                      <KeyValue label="EXCHANGE" value={viewingHolding.exchange} />
                      <KeyValue label="INST_KEY" value={viewingHolding.instrument_token} />
                      <KeyValue label="QUANTITY" value={viewingHolding.quantity} />
                      <KeyValue label="T1_QTY" value={viewingHolding.t1_quantity || '0'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <KeyValue label="AVG_PRC" value={`₹${Number(viewingHolding.average_price).toFixed(2)}`} />
                      <KeyValue label="LTP" value={`₹${Number(viewingHolding.last_price).toFixed(2)}`} />
                      <KeyValue label="PNL" value={`₹${Number(viewingHolding.pnl).toFixed(2)}`} valueColor={viewingHolding.pnl >= 0 ? 'up' : 'down'} />
                      <KeyValue label="CHG%" value={`${((viewingHolding.pnl / (viewingHolding.average_price * viewingHolding.quantity)) * 100).toFixed(2)}%`} valueColor={viewingHolding.pnl >= 0 ? 'up' : 'down'} />
                      <KeyValue label="DAY_CHG" value={`${Number(viewingHolding.day_change_percentage || 0).toFixed(2)}%`} valueColor={(viewingHolding.day_change_percentage || 0) >= 0 ? 'up' : 'down'} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '30px' }}>
                    <Button variant="buy" style={{ flex: 1 }} onClick={() => { setSelectedSymbol({ ticker: viewingHolding.trading_symbol, instrument_key: viewingHolding.instrument_token } as any); setTimeout(() => openOrderModal('BUY'), 0); }}>BUY MORE</Button>
                    <Button variant="sell" style={{ flex: 1 }} onClick={() => { setSelectedSymbol({ ticker: viewingHolding.trading_symbol, instrument_key: viewingHolding.instrument_token } as any); setTimeout(() => openOrderModal('SELL'), 0); }}>EXIT POSITION</Button>
                    <Button variant="ghost" style={{ flex: 1 }} onClick={closeOrderModal}>CLOSE</Button>
                </div>
              </div>
            ) : viewingOrder ? (
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <KeyValue label="ORDER_ID" value={viewingOrder.id} />
                      <KeyValue label="TIME" value={viewingOrder.time} />
                      <KeyValue label="EXCHANGE" value={viewingOrder.raw.exchange} />
                      <KeyValue label="PRODUCT" value={viewingOrder.raw.product} />
                      <KeyValue label="STATUS" value={viewingOrder.status} valueColor="info" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <KeyValue label="SIDE" value={viewingOrder.side} valueColor={viewingOrder.side === 'BUY' ? 'up' : 'down'} />
                      <KeyValue label="QTY" value={viewingOrder.quantity} />
                      <KeyValue label="PRICE" value={viewingOrder.price} />
                      <KeyValue label="AVG_PRC" value={viewingOrder.raw.average_price || '--'} />
                      <KeyValue label="MESSAGE" value={viewingOrder.raw.status_message || 'OK'} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '30px' }}>
                    {(viewingOrder.status === 'PENDING' || viewingOrder.status === 'OPEN' || viewingOrder.status === 'PUT_ORDER_REQ_RECEIVED') && (
                        <>
                            <Button variant="buy" style={{ flex: 1 }} onClick={() => openModifyModal(viewingOrder)}>MODIFY ORDER</Button>
                            <Button variant="danger" style={{ flex: 1 }} onClick={async () => { await upstoxApi.cancelOrder(accessToken!, viewingOrder.id); addToast('CANCEL REQ SENT', 'info'); closeOrderModal(); }}>CANCEL ORDER</Button>
                        </>
                    )}
                    <Button variant="ghost" style={{ flex: 1 }} onClick={closeOrderModal}>CLOSE</Button>
                </div>
              </div>
            ) : (
                <>
                {/* Status Strip */}
                <FilterRow noBackground style={{ borderBottom: BORDER.standard, height: '32px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Text variant="label">POSITION:</Text>
                      <Text weight="bold">0</Text>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Text variant="label">NBBO:</Text>
                      <Text variant="value">{(currentLtp - 0.05).toFixed(2)} / {(currentLtp + 0.05).toFixed(2)}</Text>
                    </div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Target size={12} color={isGTT ? COLOR.semantic.info : COLOR.text.muted} />
                      <Text variant="label" color={isGTT ? 'info' : 'muted'}>GTT: {isGTT ? 'ON' : 'OFF'}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} color={isBracket ? COLOR.semantic.info : COLOR.text.muted} />
                      <Text variant="label" color={isBracket ? 'info' : 'muted'}>BO: {isBracket ? 'ON' : 'OFF'}</Text>
                    </div>
                  </div>
                </FilterRow>

                {/* Main Control Area */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* B/S Toggle */}
                    <div style={{ display: 'flex', border: BORDER.standard }}>
                      <button style={superBtnStyle(isBuy)} onClick={() => setMode('BUY')}>BUY</button>
                      <button style={superBtnStyle(!isBuy)} onClick={() => setMode('SELL')}>SELL</button>
                    </div>

                    {/* Product Toggle */}
                    <div style={{ display: 'flex', border: BORDER.standard }}>
                      <button style={superBtnStyle(productType === 'I')} onClick={() => setProductType('I')}>MIS</button>
                      <button style={superBtnStyle(productType === 'D')} onClick={() => setProductType('D')}>CNC</button>
                    </div>

                    {/* Order Type */}
                    <Select 
                      value={orderType} 
                      onChange={e => setOrderType(e.target.value as any)}
                      style={{ width: '100px' }}
                      selectSize="sm"
                    >
                      <option value="MARKET">MARKET</option>
                      <option value="LIMIT">LIMIT</option>
                      <option value="SL">STOP LOSS</option>
                      <option value="SL-M">SL-MKT</option>
                    </Select>

                    {/* Qty */}
                    <Input 
                      type="number"
                      inputSize="sm"
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: '80px' }}
                      rightEl={<Text size="xs" color="muted">QTY</Text>}
                    />

                    {/* Price */}
                    <Input 
                      type="text"
                      inputSize="sm"
                      disabled={orderType.includes('MARKET')}
                      value={orderType.includes('MARKET') ? currentLtp.toFixed(2) : price}
                      onChange={e => setPrice(e.target.value)}
                      style={{ width: '100px', opacity: orderType.includes('MARKET') ? 0.4 : 1 }}
                      rightEl={<Text size="xs" color="muted">PRC</Text>}
                    />

                    {/* Trigger */}
                    {(orderType === 'SL' || orderType === 'SL-M') && (
                      <Input 
                        type="text"
                        inputSize="sm"
                        value={triggerPrice}
                        onChange={e => setTriggerPrice(e.target.value)}
                        style={{ width: '100px' }}
                        rightEl={<Text size="xs" color="muted">TRG</Text>}
                      />
                    )}

                    {/* Validity */}
                    <Select
                      value={validity}
                      onChange={e => setValidity(e.target.value as any)}
                      style={{ width: '70px' }}
                      selectSize="sm"
                    >
                      <option value="DAY">DAY</option>
                      <option value="IOC">IOC</option>
                    </Select>

                    <div style={{ flex: 1 }} />

                    {/* Values */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '100px', textAlign: 'right' }}>
                      <Text size="xs" color="muted">VAL: ₹{totalValue.toLocaleString()}</Text>
                      <Text size="xs" color={marginReq > availableMargin ? 'down' : 'muted'}>MAR: ₹{marginReq.toLocaleString()}</Text>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant={executing ? 'ghost' : isBuy ? 'buy' : 'sell'}
                      size="md"
                      onClick={handleExecute}
                      disabled={executing}
                      style={{ minWidth: '140px' }}
                    >
                      {executing ? 'EXECUTING...' : editingOrder ? 'MODIFY COMMAND' : `SUBMIT_${mode}`}
                    </Button>
                  </div>

                  {/* Secondary Options */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '24px', 
                    padding: '8px 0', 
                    borderTop: `1px solid ${COLOR.bg.border}` 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={isGTT} onChange={e => setIsGTT(e.target.checked)} style={{ accentColor: COLOR.semantic.info }} />
                      <Text variant="label" color={isGTT ? 'info' : 'muted'}>GTT</Text>
                      {isGTT && (
                        <Input 
                          inputSize="sm"
                          value={gttTriggerPrice}
                          onChange={e => setGttTriggerPrice(e.target.value)}
                          style={{ width: '80px', height: '20px' }}
                          placeholder="TRG"
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={isBracket} onChange={e => setIsBracket(e.target.checked)} style={{ accentColor: COLOR.semantic.info }} />
                      <Text variant="label" color={isBracket ? 'info' : 'muted'}>BRACKET</Text>
                      {isBracket && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Input inputSize="sm" value={stopLoss} onChange={e => setStopLoss(e.target.value)} style={{ width: '60px', height: '20px' }} placeholder="SL" />
                          <Input inputSize="sm" value={target} onChange={e => setTarget(e.target.value)} style={{ width: '60px', height: '20px' }} placeholder="TP" />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={isAmo} onChange={e => setIsAmo(e.target.checked)} style={{ accentColor: COLOR.semantic.warning }} />
                      <Text variant="label" color={isAmo ? 'warning' : 'muted'}>AMO_SESSION</Text>
                    </div>
                  </div>
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
