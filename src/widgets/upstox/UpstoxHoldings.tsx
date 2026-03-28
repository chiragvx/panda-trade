import React, { useMemo, useState } from 'react';
import { isIsin } from '../../utils/liveSymbols';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useContextMenuStore, ContextMenuOption } from '../../store/useContextMenuStore';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';
import { Badge } from '../../ds/components/Badge';
import { Wallet, Info, ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { DataTable } from '../../ds/components/DataTable';
import { EmptyState } from '../../ds/components/EmptyState';
import { HoverActions } from '../../ds/components/HoverActions';

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const UpstoxHoldings: React.FC = () => {
    const rawHoldings = useUpstoxStore((s) => s.holdings);
    const prices = useUpstoxStore((s) => s.prices);
    const { openOrderModal, openHoldingDetails } = useLayoutStore();
    const { setSelectedSymbol } = useSelectionStore();
    const { openContextMenu } = useContextMenuStore();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const holdings = useMemo(() =>
        rawHoldings.map((h: any) => {
            const qty = toNumber(h?.quantity);
            const avgCost = toNumber(h?.average_price ?? h?.avg_price);
            const instrumentKey = String(h?.instrument_token || '');
            const liveLtp = toNumber(prices[instrumentKey]?.ltp, NaN);
            const fallbackLtp = toNumber(h?.last_price ?? h?.ltp);
            const ltp = Number.isFinite(liveLtp) ? liveLtp : fallbackLtp;
            const marketValue = qty * ltp;
            const pnl = toNumber(h?.pnl, (ltp - avgCost) * qty);
            const pnlPct = avgCost > 0 && qty > 0 ? (pnl / (avgCost * qty)) * 100 : 0;
            const rawSymbol = String(h?.trading_symbol || h?.tradingsymbol || h?.symbol || '--');
            const name = String(h?.name || h?.company_name || '');
            const symbol = isIsin(rawSymbol) && name ? name : rawSymbol;

            return {
                symbol,
                exchange: String(h?.exchange || 'NSE'),
                quantity: qty,
                avgCost,
                ltp,
                marketValue,
                pnl,
                pnlPct,
                instrument_token: h.instrument_token,
                raw: h
            };
        }),
        [prices, rawHoldings]
    );

    const totalValue = useMemo(() => holdings.reduce((acc, h) => acc + h.marketValue, 0), [holdings]);
    const totalPnL = useMemo(() => holdings.reduce((acc, h) => acc + h.pnl, 0), [holdings]);
    const totalPnLPct = totalValue > totalPnL ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    const handleSelect = (item: any) => {
        setSelectedSymbol({ ticker: item.symbol, instrument_key: item.instrument_token } as any);
    };

    const handleAction = (item: any, type: 'BUY' | 'SELL') => {
        handleSelect(item);
        setTimeout(() => openOrderModal(type), 0);
    };

    const handleRightClick = (e: React.MouseEvent, item: any) => {
        e.preventDefault();
        const options: ContextMenuOption[] = [
            { 
                label: 'BUY MORE', 
                icon: <ArrowUpCircle size={14} />, 
                variant: 'info',
                onClick: () => handleAction(item, 'BUY')
            },
            { 
                label: 'EXIT POSITION', 
                icon: <ArrowDownCircle size={14} />, 
                variant: 'danger',
                onClick: () => handleAction(item, 'SELL')
            },
            { 
                label: 'HOLDING DETAILS', 
                icon: <Info size={14} />, 
                variant: 'muted',
                onClick: () => { openHoldingDetails(item.raw); } 
            }
        ];
        openContextMenu(e.clientX, e.clientY, options);
    };

    const columns = [
        { 
            key: 'symbol', 
            label: 'SYMBOL', 
            width: 160,
            render: (val: string, item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge label={item.exchange} variant={item.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
                    <span style={{ fontWeight: 'bold' }}>{val}</span>
                </div>
            )
        },
        { key: 'quantity', label: 'QTY', align: 'right' as const, width: 80 },
        { 
            key: 'avgCost', 
            label: 'AVG_COST', 
            align: 'right' as const, 
            width: 100,
            render: (val: number) => <span style={{ color: COLOR.text.secondary }}>{val.toFixed(2)}</span>
        },
        { 
            key: 'ltp', 
            label: 'LTP', 
            align: 'right' as const, 
            width: 100,
            render: (val: number) => <Price value={val} size="sm" weight="bold" />
        },
        { 
            key: 'marketValue', 
            label: 'CUR_VALUE', 
            align: 'right' as const, 
            width: 120,
            render: (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
        },
        { 
            key: 'pnl', 
            label: 'PNL', 
            align: 'right' as const, 
            width: 120,
            render: (val: number, item: any, idx: number) => (
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                     onMouseEnter={() => setHoveredIndex(idx)}
                     onMouseLeave={() => setHoveredIndex(null)}>
                    <span style={{ fontWeight: '900', color: val >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                        {val >= 0 ? '+' : ''}{val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                    <HoverActions 
                        isVisible={hoveredIndex === idx}
                        onBuy={() => handleAction(item, 'BUY')}
                        onSell={() => handleAction(item, 'SELL')}
                        onInfo={() => openHoldingDetails(item.raw)}
                    />
                </div>
            )
        },
        { 
            key: 'pnlPct', 
            label: '%CHG', 
            align: 'right' as const, 
            width: 100,
            render: (val: number) => <Change value={val} format="percent" weight="bold" size="sm" />
        }
    ];

    return (
        <WidgetShell>
            {/* Portfolio Summary */}
            <div style={{ display: 'flex', gap: '32px', padding: '12px 16px', background: COLOR.bg.surface, borderBottom: BORDER.standard }}>
                <div>
                    <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: '900', letterSpacing: '0.1em', display: 'block' }}>TOTAL_MARKET_VALUE</span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: COLOR.text.primary }}>
                        ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <div>
                    <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: '900', letterSpacing: '0.1em', display: 'block' }}>UNREALIZED_PNL</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                            {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                            ({totalPnLPct.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>

            {holdings.length === 0 ? (
                <EmptyState 
                    icon={<Wallet size={32} />} 
                    message="NO HOLDINGS FOUND" 
                    subMessage="Long term investments will appear here once settled."
                />
            ) : (
                <DataTable 
                    data={holdings}
                    columns={columns}
                    onRowClick={handleSelect}
                    stickyFirstColumn
                />
            )}

            <div style={{ height: '24px', padding: '0 12px', background: COLOR.bg.surface, borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: 'bold' }}>SOURCE: UPSTOX_HOLDINGS_V2</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <BarChart3 size={12} color={COLOR.text.muted} />
                    <Wallet size={12} color={COLOR.text.muted} />
                </div>
            </div>
        </WidgetShell>
    );
};

export default UpstoxHoldings;

