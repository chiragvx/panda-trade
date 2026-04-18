import React, { useState, useEffect, useMemo } from 'react';
import { TabNode } from 'flexlayout-react';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { useToastStore } from '../../components/ToastContainer';
import { ChevronUp, ChevronDown, RotateCcw, Search, ArrowRight, Wallet } from 'lucide-react';
import {
    COLOR, BORDER, SPACE, LAYOUT, ROW_HEIGHT,
    WidgetShell,
    Text,
    Select,
    Button,
    SegmentedControl,
    Price,
    Badge,
    FormField,
    ActionWrapper,
    KeyValue,
    HeaderStack,
} from '../../ds';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';

interface OrderWidgetProps {
    node?: TabNode;
}

const CONTROL_H = ROW_HEIGHT.relaxed; // 36px — matches Button md

const StepperRow: React.FC<{
    value: string | number;
    onChange: (v: string) => void;
    onDecrement: () => void;
    onIncrement: () => void;
    disabled?: boolean;
    inputType?: string;
}> = ({ value, onChange, onDecrement, onIncrement, disabled, inputType = 'text' }) => (
    <div style={{ display: 'flex', border: BORDER.standard, height: CONTROL_H, background: disabled ? 'transparent' : COLOR.bg.elevated }}>
        <ActionWrapper size="md" onClick={onDecrement} disabled={disabled} style={{ height: '100%', width: CONTROL_H, borderRight: BORDER.standard }}>
            <ChevronDown size={13} />
        </ActionWrapper>
        <input
            type={inputType}
            disabled={disabled}
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: disabled ? COLOR.text.muted : COLOR.text.primary,
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: '600',
                outline: 'none',
                fontFamily: 'inherit',
                padding: 0,
                MozAppearance: 'textfield' as any,
            }}
            className="oe-no-spin"
        />
        <ActionWrapper size="md" onClick={onIncrement} disabled={disabled} style={{ height: '100%', width: CONTROL_H, borderLeft: BORDER.standard }}>
            <ChevronUp size={13} />
        </ActionWrapper>
    </div>
);

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
    const isLive = status === 'connected' && !!accessToken;
    const availableMargin = Number(funds?.available_margin ?? 0);
    const totalValue = qty * (orderType === 'MARKET' ? currentLtp : parseFloat(price) || currentLtp);
    const marginReq = productType === 'I' ? totalValue / 5 : totalValue;
    const hasInsufficientFunds = isLive && availableMargin < marginReq;

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

    return (
        <WidgetShell>
            <style dangerouslySetInnerHTML={{ __html: `
                .oe-no-spin::-webkit-outer-spin-button,
                .oe-no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .oe-no-spin { -moz-appearance: textfield; }
            `}} />

            {showSearch && (
                <div style={{ padding: SPACE[2], background: COLOR.bg.elevated, borderBottom: BORDER.standard }}>
                    <WidgetSymbolSearch onSelect={(res) => {
                        setSelectedSymbol({ ticker: res.ticker, name: res.name, exchange: res.exchange, instrument_key: res.instrumentKey, ltp: 0 } as any);
                        setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
                        setShowSearch(false);
                    }} />
                </div>
            )}

            {/* Header — two rows so nothing clips at narrow widths */}
            <WidgetShell.Toolbar height={LAYOUT.widgetHeaderH} style={{ padding: `0 ${SPACE[3]}` }}>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: '0.875rem', color: COLOR.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedSymbol?.ticker || '---'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[1], flexShrink: 0 }}>
                    <ActionWrapper onClick={() => setShowSearch(!showSearch)} active={showSearch}>
                        <Search size={13} />
                    </ActionWrapper>
                    <ActionWrapper onClick={() => { setQty(1); setOrderType('MARKET'); }}>
                        <RotateCcw size={13} />
                    </ActionWrapper>
                </div>
            </WidgetShell.Toolbar>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE[2]} ${SPACE[3]}`, borderBottom: BORDER.standard, gap: SPACE[2], flexShrink: 0 }}>
                <Text size="xs" color="muted" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {selectedSymbol?.name || 'No symbol selected'}
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], flexShrink: 0 }}>
                    {selectedSymbol && <Badge label={selectedSymbol.exchange} variant="info" />}
                    <div style={{ textAlign: 'right' }}>
                        <Price value={currentLtp} size="md" weight="black" />
                        <Text size="xs" color="up" weight="black">
                            {(selectedSymbol?.changePct || 0).toFixed(2)}%
                        </Text>
                    </div>
                </div>
            </div>

            {/* Form body */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: SPACE[4], padding: `${SPACE[4]} ${SPACE[3]}` }}>

                <FormField label="Side">
                    <SegmentedControl
                        options={[{ label: 'Buy', value: 'BUY' }, { label: 'Sell', value: 'SELL' }]}
                        value={side}
                        onChange={(v) => setSide(v as any)}
                        style={{ height: CONTROL_H }}
                    />
                </FormField>

                <FormField label="Order type">
                    <SegmentedControl
                        options={[
                            { label: 'Market', value: 'MARKET' },
                            { label: 'Limit', value: 'LIMIT' },
                            { label: 'Stop loss', value: 'SL' },
                        ]}
                        value={orderType}
                        onChange={(v: any) => setOrderType(v)}
                        style={{ height: CONTROL_H }}
                    />
                </FormField>

                <FormField label="Product">
                    <SegmentedControl
                        options={[
                            { label: 'Intraday', value: 'I' },
                            { label: 'Delivery', value: 'D' },
                        ]}
                        value={productType}
                        onChange={(v: any) => setProductType(v)}
                        style={{ height: CONTROL_H }}
                    />
                </FormField>

                <FormField label="Quantity">
                    <StepperRow
                        inputType="number"
                        value={qty}
                        onChange={v => setQty(parseInt(v) || 0)}
                        onDecrement={() => setQty(q => Math.max(1, q - 1))}
                        onIncrement={() => setQty(q => q + 1)}
                    />
                </FormField>

                <FormField label={orderType === 'MARKET' ? 'Estimated price' : 'Price'}>
                    <StepperRow
                        value={orderType === 'MARKET' ? currentLtp.toFixed(2) : price}
                        onChange={v => setPrice(v)}
                        onDecrement={() => setPrice(p => (parseFloat(p || '0') - 0.05).toFixed(2))}
                        onIncrement={() => setPrice(p => (parseFloat(p || '0') + 0.05).toFixed(2))}
                        disabled={orderType === 'MARKET'}
                    />
                </FormField>

                {orderType.startsWith('SL') && (
                    <FormField label="Trigger price">
                        <StepperRow
                            value={triggerPrice}
                            onChange={v => setTriggerPrice(v)}
                            onDecrement={() => setTriggerPrice(p => (parseFloat(p || '0') - 0.05).toFixed(2))}
                            onIncrement={() => setTriggerPrice(p => (parseFloat(p || '0') + 0.05).toFixed(2))}
                        />
                    </FormField>
                )}

                <FormField label="Validity">
                    <Select value={validity} onChange={e => setValidity(e.target.value as any)} selectSize="md" style={{ height: CONTROL_H, width: '100%' }}>
                        <option value="DAY">Day</option>
                        <option value="IOC">IOC</option>
                    </Select>
                </FormField>
            </div>

            {/* Footer */}
            <div style={{ borderTop: BORDER.standard, background: COLOR.bg.base, flexShrink: 0 }}>
                <div style={{ padding: `${SPACE[2]} ${SPACE[3]}` }}>
                    <KeyValue
                        label="Required margin"
                        value={`₹${marginReq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        valueColor={hasInsufficientFunds ? 'down' : 'primary'}
                        divider={false}
                        style={{ paddingLeft: 0, paddingRight: 0 }}
                    />
                    <KeyValue
                        label="Available margin"
                        value={`₹${availableMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        valueColor="up"
                        divider={false}
                        style={{ paddingLeft: 0, paddingRight: 0 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: SPACE[2], padding: `${SPACE[2]} ${SPACE[3]} ${SPACE[3]}` }}>
                    <Button
                        variant={isBuy ? 'buy' : 'sell'}
                        size="md"
                        disabled={executing || hasInsufficientFunds}
                        onClick={handleExecute}
                        loading={executing}
                        style={{ flex: 1 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
                            <span>{editingOrder ? 'Update order' : (isBuy ? 'Buy' : 'Sell')}</span>
                            {!executing && <ArrowRight size={13} />}
                        </div>
                    </Button>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => window.open('https://pro.upstox.com/funds/securities/wallet', '_blank')}
                        style={{ width: CONTROL_H }}
                        title="Add funds"
                    >
                        <Wallet size={13} />
                    </Button>
                </div>
            </div>
        </WidgetShell>
    );
};
