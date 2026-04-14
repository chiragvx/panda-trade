import React, { useState, useEffect, useMemo } from 'react';
import { TabNode } from 'flexlayout-react';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { useToastStore } from '../../components/ToastContainer';
import { 
  ShieldCheck, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw,
  Search,
  Activity,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { 
  COLOR, 
  TYPE, 
  BORDER, 
  WidgetShell,
  Text,
  Input,
  Select,
  Button,
  SegmentedControl,
  Price,
  Badge
} from '../../ds';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';

interface OrderWidgetProps {
    node?: TabNode;
}

export const OrderEntryWidget: React.FC<OrderWidgetProps> = ({ node }) => {
    const { selectedSymbol, setSelectedSymbol } = useSelectionStore();
    const { orderMode, editingOrder, closeOrderModal } = useLayoutStore();
    const { accessToken, status, prices, funds, setInstrumentMeta } = useUpstoxStore();
    const { addToast } = useToastStore();

    const [side, setSide] = useState<'BUY' | 'SELL'>(orderMode || 'BUY');
    const [productType, setProductType] = useState<'I' | 'D'>('I');
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SL' | 'SL-M'>('MARKET');
    const [qty, setQty] = useState<number>(1);
    const [price, setPrice] = useState<string>('');
    const [triggerPrice, setTriggerPrice] = useState<string>('');
    const [validity, setValidity] = useState<'DAY' | 'IOC'>('DAY');
    
    const [executing, setExecuting] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        if (orderMode) setSide(orderMode);
    }, [orderMode]);

    useEffect(() => {
        if (editingOrder) {
            const raw = editingOrder.raw;
            setSide(editingOrder.side as any);
            setQty(raw.quantity);
            setPrice(String(raw.price || 0));
            setTriggerPrice(String(raw.trigger_price || 0));
            setProductType(raw.product as any);
            setOrderType(raw.order_type as any);
            setValidity(raw.validity as any);
        } else if (selectedSymbol) {
            const ltp = prices[selectedSymbol.instrument_key || '']?.ltp || selectedSymbol.ltp || 0;
            if (orderType !== 'MARKET') setPrice(Number(ltp).toFixed(2));
            setTriggerPrice(Number(ltp).toFixed(2));
        }
    }, [selectedSymbol, editingOrder]);

    const currentLtp = useMemo(() => {
        if (!selectedSymbol) return 0;
        return prices[selectedSymbol.instrument_key || '']?.ltp || selectedSymbol.ltp || 0;
    }, [selectedSymbol, prices]);

    const isBuy = side === 'BUY';
    const accent = isBuy ? COLOR.semantic.up : COLOR.semantic.down;
    const isLive = status === 'connected' && !!accessToken;
    const availableMargin = Number(funds?.available_margin ?? 0);
    
    const totalValue = qty * (orderType === 'MARKET' ? currentLtp : parseFloat(price) || currentLtp);
    const marginReq = productType === 'I' ? totalValue / 5 : totalValue;

    const handleExecute = async () => {
        if (!isLive || !selectedSymbol?.instrument_key) {
            addToast('OFFLINE', 'error');
            return;
        }
        setExecuting(true);
        try {
            const orderPayload = {
                quantity: qty,
                product: productType,
                validity,
                price: (orderType === 'MARKET' || orderType === 'SL-M') ? 0 : parseFloat(price),
                tag: 'ANTIGRAVITY_v2',
                instrument_token: selectedSymbol.instrument_key,
                order_type: orderType,
                transaction_type: side,
                disclosed_quantity: 0,
                trigger_price: (orderType === 'SL' || orderType === 'SL-M') ? parseFloat(triggerPrice) : 0,
                is_amo: false,
            };

            const res = editingOrder 
                ? await upstoxApi.modifyOrder(accessToken!, { ...orderPayload, order_id: editingOrder.id })
                : await upstoxApi.placeOrder(accessToken!, orderPayload as any);

            if (res.status === 'success') {
                addToast('TRANSMITTED', 'success');
                if (editingOrder) closeOrderModal();
            } else {
                addToast(res.errors?.[0]?.message || 'REJECTED', 'error');
            }
        } catch (err: any) {
            addToast(err.message, 'error');
        } finally {
            setExecuting(false);
        }
    };

    const handleAddFunds = () => {
        window.open('https://pro.upstox.com/funds/securities/wallet', '_blank');
    };

    return (
        <WidgetShell>
            <style dangerouslySetInnerHTML={{ __html: `
                .no-spinners::-webkit-outer-spin-button,
                .no-spinners::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .no-spinners {
                    -moz-appearance: textfield;
                }
            `}} />
            
            {showSearch && (
                <div style={{ padding: '8px', background: COLOR.bg.elevated, borderBottom: BORDER.standard, position: 'relative', zIndex: 10 }}>
                    <WidgetSymbolSearch onSelect={(res) => { setSelectedSymbol({ ticker: res.ticker, name: res.name, exchange: res.exchange, instrument_key: res.instrumentKey, ltp: 0 } as any); setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } }); setShowSearch(false); }} />
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: COLOR.bg.base, overflowX: 'hidden', overflowY: 'auto' }}>
                {/* Header Info */}
                <div style={{ padding: '12px 16px', borderBottom: BORDER.standard, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 900, color: COLOR.text.primary, letterSpacing: '-0.02em' }}>{selectedSymbol?.ticker || '---'}</span>
                            <Badge label={selectedSymbol?.exchange || '---'} variant="info" />
                        </div>
                        <span style={{ fontSize: '11px', color: COLOR.text.muted, fontWeight: 700, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedSymbol?.name || '...'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                            <Price value={currentLtp} size="md" weight="black" />
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <Activity size={10} color={COLOR.semantic.up} />
                                <Text size="xs" color="up" weight="black">{(selectedSymbol?.changePct || 0).toFixed(2)}%</Text>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => setShowSearch(!showSearch)} style={{ width: '28px', height: '28px', background: COLOR.bg.elevated, border: BORDER.standard, color: COLOR.text.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Search size={14} /></button>
                            <button onClick={() => { setQty(1); setOrderType('MARKET'); }} style={{ width: '28px', height: '28px', background: COLOR.bg.elevated, border: BORDER.standard, color: COLOR.text.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RotateCcw size={14} /></button>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <Text variant="label" color="muted" size="xs">SIDE</Text>
                         <SegmentedControl 
                            options={[{ label: 'BUY', value: 'BUY' }, { label: 'SELL', value: 'SELL' }]}
                            value={side}
                            onChange={(v) => setSide(v as any)}
                            style={{ height: '40px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Text variant="label" color="muted" size="xs">ORDER TYPE</Text>
                        <SegmentedControl 
                            options={[{ label: 'MARKET', value: 'MARKET' }, { label: 'LIMIT', value: 'LIMIT' }, { label: 'SL', value: 'SL' }]}
                            value={orderType}
                            onChange={(v: any) => setOrderType(v)}
                            style={{ height: '40px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Text variant="label" color="muted" size="xs">PRODUCT</Text>
                        <SegmentedControl 
                            options={[
                                { label: 'INTRADAY', value: 'I' }, 
                                { label: 'DELIVERY', value: 'D' }
                            ]}
                            value={productType}
                            onChange={(v: any) => setProductType(v)}
                            style={{ height: 'auto', minHeight: '48px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Text variant="label" color="muted" size="xs">QUANTITY</Text>
                        <div style={{ display: 'flex', border: BORDER.standard, height: '40px', background: COLOR.bg.elevated }}>
                            <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ padding: '0 12px', border: 'none', background: 'transparent', color: COLOR.text.muted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronDown size={14} /></button>
                            <input 
                                type="number" 
                                className="no-spinners"
                                value={qty} 
                                onChange={e => setQty(parseInt(e.target.value) || 0)} 
                                style={{ flex: 1, border: 'none', background: 'transparent', color: COLOR.text.primary, textAlign: 'center', fontSize: '14px', fontWeight: 'bold', outline: 'none', padding: '0 12px', margin: '0 4px' }} 
                            />
                            <button onClick={() => setQty(q => q+1)} style={{ padding: '0 12px', border: 'none', background: 'transparent', color: COLOR.text.muted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronUp size={14} /></button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Text variant="label" color="muted" size="xs">{orderType === 'MARKET' ? 'ESTIMATED PRICE' : 'PRICE'}</Text>
                        <div style={{ display: 'flex', border: BORDER.standard, height: '40px', background: orderType === 'MARKET' ? 'transparent' : COLOR.bg.elevated }}>
                            {orderType !== 'MARKET' && <button onClick={() => setPrice(p => (parseFloat(p || '0') - 0.05).toFixed(2))} style={{ padding: '0 12px', border: 'none', background: 'transparent', color: COLOR.text.muted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronDown size={14} /></button>}
                            <input 
                                type="text" 
                                disabled={orderType === 'MARKET'}
                                value={orderType === 'MARKET' ? currentLtp.toFixed(2) : price} 
                                onChange={e => setPrice(e.target.value)} 
                                style={{ flex: 1, border: 'none', background: 'transparent', color: orderType === 'MARKET' ? COLOR.text.muted : COLOR.text.primary, textAlign: 'center', fontSize: '14px', fontWeight: 'bold', outline: 'none', padding: '0 12px', margin: '0 4px' }} 
                            />
                            {orderType !== 'MARKET' && <button onClick={() => setPrice(p => (parseFloat(p || '0') + 0.05).toFixed(2))} style={{ padding: '0 12px', border: 'none', background: 'transparent', color: COLOR.text.muted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronUp size={14} /></button>}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                         {orderType.startsWith('SL') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Text variant="label" color="muted" size="xs">TRIGGER</Text>
                                <Input value={triggerPrice} onChange={e => setTriggerPrice(e.target.value)} inputSize="md" className="no-spinners" style={{ textAlign: 'center', fontWeight: 'bold', padding: '0 12px', height: '40px' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Text variant="label" color="muted" size="xs">VAL</Text>
                            <Select value={validity} onChange={e => setValidity(e.target.value as any)} selectSize="md" style={{ height: '40px' }}>
                                <option value="DAY">DAY</option>
                                <option value="IOC">IOC</option>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* INTEGRATED ACTION FOOTER */}
            <div style={{ padding: '16px', borderTop: BORDER.standard, background: '#000', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Linked Financial Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: 900, letterSpacing: '0.05em' }}>REQUIRED</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                             <span style={{ fontSize: '12px', color: COLOR.text.primary, fontWeight: 900 }}>₹</span>
                             <span style={{ fontSize: '14px', color: COLOR.text.primary, fontWeight: 900 }}>{marginReq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: 900, letterSpacing: '0.05em' }}>AVAILABLE</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                             <span style={{ fontSize: '12px', color: COLOR.semantic.up, fontWeight: 900 }}>₹</span>
                             <span style={{ fontSize: '14px', color: COLOR.semantic.up, fontWeight: 900 }}>{availableMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Primary Action Row */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                        variant={isBuy ? 'buy' : 'sell'} 
                        size="md" 
                        disabled={executing || (isLive && availableMargin < marginReq)}
                        onClick={handleExecute}
                        style={{ height: '36px', borderRadius: '2px', flex: 1 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
                                {executing ? '...' : (editingOrder ? 'UPDATE' : 'TRADE')}
                            </span>
                            {!executing && <ArrowRight size={14} color="currentColor" />}
                        </div>
                    </Button>

                    <Button 
                        variant="secondary" 
                        size="md" 
                        onClick={handleAddFunds}
                        style={{ 
                            height: '36px', 
                            borderRadius: '2px',
                            border: BORDER.standard,
                            flex: 1
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Wallet size={14} color={COLOR.text.muted} />
                            <span style={{ fontSize: '12px', color: COLOR.text.muted, fontWeight: 700, letterSpacing: '1px' }}>
                                FUNDS
                            </span>
                        </div>
                    </Button>
                </div>
            </div>
        </WidgetShell>
    );
};
