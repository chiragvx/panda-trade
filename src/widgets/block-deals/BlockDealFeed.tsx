import React, { useState, useEffect, useMemo } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { useGlobalStore } from '../../store/globalStore';
import { useAlertStore } from '../../store/alertStore';
import { ListFilter, Zap } from 'lucide-react';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { SegmentedControl } from '../../ds/components/SegmentedControl';
import { DataTable } from '../../ds/components/DataTable';
import { EmptyState } from '../../ds/components/EmptyState';

const BlockDealFeed: React.FC = () => {
    const { watchlist } = useGlobalStore();
    const { addAlert } = useAlertStore();
    const [filter, setFilter] = useState<'ALL' | 'WATCHLIST' | 'BUY' | 'SELL'>('ALL');
    const [threshold, setThreshold] = useState(10); 

    const { data: nseBlockDeals, isLoading: nseBlockLoading } = useNSEData<any>('/api/block-deal', {
        pollingInterval: 60 * 1000,
    });

    const processedDeals = useMemo(() => {
        if (!nseBlockDeals?.data) return [];
        
        return nseBlockDeals.data.map((d: any) => {
            const q = d.quantity || d.qty || 0;
            const p = d.price || 0;
            return {
                symbol: d.symbol || 'UNKNOWN',
                clientName: d.clientName || 'UNKNOWN_CLIENT',
                type: (d.buySell === 'Buy' || d.type === 'BUY' || d.type === 'B') ? 'BUY' : 'SELL',
                quantity: q,
                price: p,
                value: (q * p) / 10000000, 
                timestamp: d.time || d.timestamp || new Date().toISOString(),
            };
        }).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [nseBlockDeals]);

    useEffect(() => {
        if (processedDeals.length > 0) {
            const topDeal = processedDeals[0];
            const inWatchlist = watchlist.includes(topDeal.symbol);
            
            if (inWatchlist && topDeal.value > threshold) {
                addAlert({
                    symbol: topDeal.symbol,
                    type: 'event',
                    condition: 'Block Deal',
                    value: topDeal.value,
                    priority: 'high',
                    message: `${topDeal.symbol}: Block deal of ₹${topDeal.value.toFixed(1)}cr by ${topDeal.clientName}`,
                });
            }
        }
    }, [processedDeals, watchlist, threshold, addAlert]);

    const filteredDeals = useMemo(() => processedDeals.filter((deal: any) => {
        if (deal.value < threshold) return false;
        if (filter === 'WATCHLIST' && !watchlist.includes(deal.symbol)) return false;
        if (filter === 'BUY' && deal.type !== 'BUY') return false;
        if (filter === 'SELL' && deal.type !== 'SELL') return false;
        return true;
    }), [processedDeals, filter, threshold, watchlist]);

    const columns = [
        { 
            key: 'symbol', 
            label: 'SYMBOL', 
            width: 120,
            render: (val: string) => {
                const inWatchlist = watchlist.includes(val);
                return (
                    <span style={{ 
                        fontSize: '9px', 
                        fontWeight: TYPE.weight.bold, 
                        color: inWatchlist ? COLOR.semantic.warning : COLOR.semantic.info,
                        border: `1px solid ${inWatchlist ? COLOR.semantic.warning : COLOR.semantic.info}40`,
                        padding: '1px 6px',
                        background: COLOR.bg.surface
                    }}>
                        {val}
                    </span>
                );
            }
        },
        { 
            key: 'type', 
            label: 'FLOW', 
            width: 80,
            render: (val: string, item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ 
                        fontSize: '8px', 
                        fontWeight: TYPE.weight.bold, 
                        color: val === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down,
                        textTransform: 'uppercase'
                    }}>
                        {val}
                    </span>
                    {item.value > 50 && <Zap size={10} style={{ color: COLOR.semantic.warning }} />}
                </div>
            )
        },
        { 
            key: 'value', 
            label: 'VALUE (CR)', 
            align: 'right' as const,
            width: 100,
            render: (val: number) => `₹${val.toFixed(1)}CR`
        },
        { 
            key: 'clientName', 
            label: 'CLIENT', 
            width: 200,
            render: (val: string) => (
                <div style={{ fontSize: '10px', color: COLOR.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {val}
                </div>
            )
        },
        { 
            key: 'quantity', 
            label: 'QTY', 
            align: 'right' as const,
            width: 100,
            render: (val: number) => val.toLocaleString()
        },
        { 
            key: 'price', 
            label: 'PRICE', 
            align: 'right' as const,
            width: 100,
            render: (val: number) => val.toFixed(2)
        }
    ];

    return (
        <WidgetShell>
            <WidgetShell.Toolbar style={{ flexDirection: 'column', gap: '8px', height: 'auto', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <SegmentedControl 
                        options={['ALL', 'WATCHLIST', 'BUY', 'SELL'].map(f => ({ label: f, value: f }))}
                        value={filter}
                        onChange={(v) => setFilter(v as any)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: COLOR.text.muted, width: '100%' }}>
                    <ListFilter size={10} />
                    <span>THRESHOLD:</span>
                    <input 
                        type="number" 
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        style={{ background: COLOR.bg.base, border: BORDER.standard, color: COLOR.text.primary, padding: '2px 4px', width: '40px', fontSize: '9px', outline: 'none', fontFamily: TYPE.family.mono }}
                    />
                    <span>CR_INR</span>
                </div>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {nseBlockLoading && filteredDeals.length === 0 ? (
                    <EmptyState 
                        icon={<Zap size={32} className="animate-pulse" />} 
                        message="POLLING_FEED..." 
                        subMessage="Synchronizing with NSE block deal terminal."
                    />
                ) : filteredDeals.length === 0 ? (
                    <EmptyState 
                        icon={<ListFilter size={32} />} 
                        message="NO_ACTIVE_FLOWS_DETECTED" 
                        subMessage="Check filter settings or threshold limits."
                    />
                ) : (
                    <DataTable 
                        data={filteredDeals}
                        columns={columns}
                    />
                )}
            </div>
        </WidgetShell>
    );
};

export default BlockDealFeed;

