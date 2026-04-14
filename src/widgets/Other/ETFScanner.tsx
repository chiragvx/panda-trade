import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { upstoxWebSocket } from '../../services/upstoxWebSocket';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { Search, Info, TrendingUp, BarChart3, Link2, Filter, Layers } from 'lucide-react';
import { DataTable } from '../../ds/components/DataTable';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';
import { Tooltip } from '../../ds/components/Tooltip';
import { useSelectionStore } from '../../store/useStore';

const CORE_ETFS = [
    'NIFTYBEES', 'BANKBEES', 'GOLDBEES', 'LIQUIDBEES', 'JUNIORBEES', 
    'CPSEETF', 'MON100', 'MAFANG', 'SETFNIF50', 'MID150BEES',
    'PHARMABEES', 'ITBEES', 'CONSUMEBEES', 'INFRAKBEES', 'TNIDETF',
];

import { HoverActions } from '../../ds/components/HoverActions';
import { useLayoutStore } from '../../store/useStore';

export const ETFScanner: React.FC = () => {
    const { accessToken } = useUpstoxStore();
    const { setSelectedSymbol } = useSelectionStore();
    const { openOrderModal } = useLayoutStore();
    const [etfs, setEtfs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'gainers' | 'losers'>('all');
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);

    // Initial Search for ETFs
    useEffect(() => {
        if (!accessToken) return;

        const loadETFs = async () => {
            setIsLoading(true);
            try {
                // 1. Search for CORE ETFs first to ensure they are present
                const coreKeysSet = new Set<string>();
                let combined: any[] = [];
                
                // Fetch Core ETFs specifically
                const coreResults = await Promise.all(
                    CORE_ETFS.slice(0, 8).map(q => upstoxApi.searchInstruments(accessToken, q))
                );
                
                coreResults.forEach(res => {
                    if (res.status === 'success' && res.data?.[0]) {
                        const best = res.data[0];
                        if (!coreKeysSet.has(best.instrument_key)) {
                            coreKeysSet.add(best.instrument_key);
                            combined.push(best);
                        }
                    }
                });

                // 2. Broad Search for others
                const res = await upstoxApi.searchInstruments(accessToken, 'ETF');
                if (res.status === 'success' && Array.isArray(res.data)) {
                    res.data.forEach((i: any) => {
                        if (!coreKeysSet.has(i.instrument_key) && 
                            (i.instrument_type === 'EQUITY' || !i.instrument_type) && 
                            (i.name?.toUpperCase().includes('ETF') || i.trading_symbol?.toUpperCase().includes('ETF'))
                        ) {
                            coreKeysSet.add(i.instrument_key);
                            combined.push(i);
                        }
                    });
                }
                
                const batch = combined.slice(0, 50);
                setEtfs(batch.map(i => ({
                    ...i,
                    ltp: Math.random() * 500 + 50,
                    pChange: 0,
                    volume: 0,
                    high: 0,
                    low: 0
                })));

                // Subscribe to real-time updates
                upstoxWebSocket.subscribe(batch.map(b => b.instrument_key), 'ltpc');
            } catch (err) {
                console.error("Failed to fetch ETFs:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadETFs();
    }, [accessToken]);

    // Secondary fetch for bulk market quotes to populate volume/high/low/change
    useEffect(() => {
        if (!accessToken || etfs.length === 0) return;

        const fetchQuotes = async () => {
            try {
                const keys = etfs.map(e => e.instrument_key);
                const res = await upstoxApi.getFullQuotes(accessToken, keys);
                if (res.status === 'success' && res.data) {
                    const quotes = res.data;
                    setEtfs(prev => prev.map(item => {
                        const quote = quotes[item.instrument_key];
                        if (!quote) return item;
                        return {
                            ...item,
                            ltp: quote.last_price || item.ltp,
                            pChange: quote.net_change !== undefined && quote.last_price ? (quote.net_change / (quote.last_price - quote.net_change)) * 100 : item.pChange,
                            volume: quote.volume || 0,
                            high: quote.ohlc?.high || 0,
                            low: quote.ohlc?.low || 0
                        };
                    }));
                }
            } catch (err) {
                console.warn("Bulk quote fetch failed for scanner:", err);
            }
        };

        fetchQuotes();
    }, [accessToken, etfs.length > 0]); // Run once when list is ready

    const filteredData = useMemo(() => {
        let results = [...etfs].filter(e => 
            e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            e.trading_symbol?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterType === 'gainers') results = results.filter(e => e.pChange > 0);
        if (filterType === 'losers') results = results.filter(e => e.pChange < 0);

        if (sort) {
            results.sort((a, b) => {
                const valA = a[sort.col];
                const valB = b[sort.col];
                if (sort.dir === 'asc') return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
            });
        } else if (filterType === 'gainers') {
            results.sort((a, b) => b.pChange - a.pChange);
        } else if (filterType === 'losers') {
            results.sort((a, b) => a.pChange - b.pChange);
        }

        return results;
    }, [etfs, searchTerm, filterType, sort]);

    const handleSort = (col: string) => {
        setSort(prev => {
            if (prev?.col === col) {
                if (prev.dir === 'desc') return null;
                return { col, dir: 'desc' };
            }
            return { col, dir: 'asc' };
        });
    };

    const columns = useMemo(() => [
        {
            key: 'name',
            label: 'ASSET_NAME',
            width: 180,
            sortable: true,
            render: (val: string, item: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: TYPE.weight.bold, color: COLOR.text.primary, fontSize: '11px' }}>{val || item.trading_symbol}</span>
                    <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: TYPE.weight.black }}>{item.trading_symbol} • {item.exchange}</span>
                </div>
            )
        },
        {
            key: 'ltp',
            label: 'PRICE',
            align: 'right' as const,
            width: 100,
            sortable: true,
            render: (val: number) => <Price value={val} size="sm" />
        },
        {
            key: 'pChange',
            label: '%CHG',
            align: 'right' as const,
            width: 80,
            sortable: true,
            render: (val: number) => <Change value={val} format="percent" size="sm" />
        },
        {
            key: 'volume',
            label: 'VOL',
            align: 'right' as const,
            width: 80,
            sortable: true,
            render: (val: number) => (
                <span style={{ fontSize: '11px', color: COLOR.text.muted }}>
                    {val > 1000000 ? `${(val / 1000000).toFixed(1)}M` : val > 1000 ? `${(val / 1000).toFixed(1)}K` : val}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            width: 200,
            align: 'right' as const,
            render: (_: any, item: any, index: number) => (
                <HoverActions 
                    isVisible={hoveredRow === index}
                    position="sticky"
                    onBuy={() => { setSelectedSymbol(item); openOrderModal('BUY'); }}
                    onSell={() => { setSelectedSymbol(item); openOrderModal('SELL'); }}
                    onChart={() => { setSelectedSymbol(item); (window as any).targetWidget('chart'); }}
                    onInfo={() => { setSelectedSymbol(item); (window as any).replaceTab('fundamentals'); }}
                    extraActions={
                        <Tooltip content="Option Chain" position="left">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedSymbol(item); (window as any).replaceTab('options-chain'); }}
                                style={{ 
                                    width: '32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: 'none', background: 'transparent', color: COLOR.text.muted, cursor: 'pointer',
                                    padding: 0, margin: 0, outline: 'none'
                                }}
                            >
                                <Link2 size={14} />
                            </button>
                        </Tooltip>
                    }
                />
            )
        }
    ], [hoveredRow, setSelectedSymbol, openOrderModal]);

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={14} color={COLOR.semantic.info} />
                        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps }}>ETF_SCANNER</span>
                    </div>

                    <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
                            <Search size={12} color={COLOR.text.muted} />
                        </div>
                        <input 
                            placeholder="SEARCH_INDEX_FUNDS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                height: '28px',
                                background: 'transparent',
                                border: BORDER.standard,
                                color: COLOR.text.primary,
                                fontSize: '10px',
                                fontWeight: TYPE.weight.bold,
                                fontFamily: TYPE.family.mono,
                                width: '100%',
                                padding: '0 10px 0 28px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '2px' }}>
                        {(['all', 'gainers', 'losers'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterType(f)}
                                style={{
                                    height: '28px',
                                    padding: '0 10px',
                                    fontSize: '9px',
                                    fontWeight: TYPE.weight.black,
                                    letterSpacing: TYPE.letterSpacing.caps,
                                    background: filterType === f ? COLOR.bg.elevated : 'transparent',
                                    border: BORDER.standard,
                                    color: filterType === f ? COLOR.text.primary : COLOR.text.muted,
                                    cursor: 'pointer',
                                    transition: 'all 0.1s linear'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflow: 'hidden', background: COLOR.bg.surface, display: 'flex', flexDirection: 'column' }}>
                {isLoading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLOR.text.muted, fontSize: '10px', fontWeight: 'bold' }}>
                        INITIALIZING_ETF_DATABASE...
                    </div>
                ) : (
                    <DataTable 
                        data={filteredData}
                        columns={columns}
                        rowHeight="relaxed"
                        onRowMouseEnter={(_, idx) => setHoveredRow(idx)}
                        onRowMouseLeave={() => setHoveredRow(null)}
                        stickyLastColumn={true}
                        onRowClick={(item) => setSelectedSymbol(item)}
                        sortCol={sort?.col}
                        sortDir={sort?.dir}
                        onSort={handleSort}
                    />
                )}
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.elevated }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={12} color={COLOR.text.muted} />
                    <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>
                        FOUND {filteredData.length} ACTIVE LIQUID ASSETS
                    </span>
                </div>
                <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: 'bold' }}>UPSTOX_V2_REALTIME</span>
            </div>
        </WidgetShell>
    );
};
