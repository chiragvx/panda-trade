import React, { useMemo, useState } from 'react';
import { getDisplayTicker } from '../../utils/liveSymbols';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useContextMenuStore, ContextMenuOption } from '../../store/useContextMenuStore';
import { 
  COLOR, 
  TYPE, 
  BORDER, 
  SPACE,
  Text,
  Price,
  Change,
  Badge,
  WidgetShell,
  DataTable,
  EmptyState,
  HoverActions
} from '../../ds';
import { Wallet, Info, ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';

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
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('desc'); }
    };

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
            const symbol = getDisplayTicker({
                ticker: rawSymbol,
                name,
                instrumentKey,
                fallback: rawSymbol,
            });

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
    const totalPnLPct = (totalValue - totalPnL) > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    const sortedHoldings = useMemo(() => {
        if (!sortCol) return holdings;
        return [...holdings].sort((a, b) => {
            const av: any = (a as any)[sortCol];
            const bv: any = (b as any)[sortCol];
            if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === 'asc' ? (av ?? 0) - (bv ?? 0) : (bv ?? 0) - (av ?? 0);
        });
    }, [holdings, sortCol, sortDir]);

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
            label: 'Symbol',
            width: 180,
            sortable: true,
            render: (val: string, item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge label={item.exchange} variant={item.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
                    <Text weight="bold" size="md">{val}</Text>
                </div>
            )
        },
        { key: 'quantity', label: 'Qty', align: 'right' as const, width: 80, sortable: true, render: (val: number) => <Text weight="medium" size="sm">{val}</Text> },
        {
            key: 'avgCost',
            label: 'Avg Cost',
            align: 'right' as const,
            width: 100,
            sortable: true,
            render: (val: number) => <Text color="secondary" size="sm">{val.toFixed(2)}</Text>
        },
        {
            key: 'ltp',
            label: 'LTP',
            align: 'right' as const,
            width: 100,
            sortable: true,
            render: (val: number) => <Price value={val} size="sm" weight="bold" />
        },
        {
            key: 'marketValue',
            label: 'Cur Value',
            align: 'right' as const,
            width: 120,
            sortable: true,
            render: (val: number) => <Text weight="medium" size="sm">₹{val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
        },
        {
            key: 'pnl',
            label: 'PnL',
            align: 'right' as const,
            width: 130,
            sortable: true,
            render: (val: number, item: any, idx: number) => (
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                     onMouseEnter={() => setHoveredIndex(idx)}
                     onMouseLeave={() => setHoveredIndex(null)}>
                    
                    <Change value={val} format="absolute" size="sm" weight="bold" />
 
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
            label: '% Chg',
            align: 'right' as const,
            width: 80,
            sortable: true,
            render: (val: number) => <Change value={val} format="percent" weight="medium" size="xs" />
        }
    ];

    return (
        <WidgetShell>
            {/* Portfolio Summary */}
            <div style={{ display: 'flex', gap: '32px', padding: '12px 16px', background: COLOR.bg.base, borderBottom: BORDER.standard }}>
                <div>
                    <Text variant="label" size="xs" weight="bold" color="muted" block style={{ letterSpacing: '0.05em' }}>Total Market Value</Text>
                    <Text size="xl" weight="bold" color="primary">
                        ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Text>
                </div>
                <div>
                    <Text variant="label" size="xs" weight="bold" color="muted" block style={{ letterSpacing: '0.05em' }}>Unrealized PnL</Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <Text size="xl" weight="bold" color={totalPnL >= 0 ? 'up' : 'down'}>
                            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Text>
                        <Text size="sm" weight="medium" color={totalPnL >= 0 ? 'up' : 'down'}>
                            ({totalPnLPct.toFixed(2)}%)
                        </Text>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {holdings.length === 0 ? (
                    <EmptyState 
                        icon={<Wallet size={48} />} 
                        message="No holdings found" 
                        subMessage="Long term investments will appear here once settled."
                    />
                ) : (
                    <DataTable
                        data={sortedHoldings}
                        columns={columns}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                        onRowClick={handleSelect}
                        stickyFirstColumn
                    />
                )}
            </div>

            <div style={{ height: '32px', padding: '0 12px', background: COLOR.bg.surface, borderTop: BORDER.strong, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size="xs" color="muted" weight="bold" style={{ letterSpacing: '0.05em' }}>Source: Upstox_Holdings_Pro_v3</Text>
            </div>
        </WidgetShell>
    );
};

export default UpstoxHoldings;
