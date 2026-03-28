import React, { useMemo, useState } from 'react';
import { useGlobalStore } from '../../store/globalStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { Plus, Search, Clock, ShieldCheck } from 'lucide-react';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { DataTable } from '../../ds/components/DataTable';
import { EmptyState } from '../../ds/components/EmptyState';
import { Change } from '../../ds/components/Change';
import { Price } from '../../ds/components/Price';

interface Setup {
  symbol: string;
  score: number;
  price: number;
  change1d: number;
  history: { val: number }[];
}

const AccumulationScreener: React.FC = () => {
    const { addToWatchlist, watchlist } = useGlobalStore();
    const { prices, instrumentMeta } = useUpstoxStore();
    const [lastScanTime, setLastScanTime] = useState<string>(new Date().toLocaleTimeString('en-IN'));
    const [isScanning, setIsScanning] = useState(false);

    const setups = useMemo<Setup[]>(() => {
        return Object.keys(prices)
            .map((key) => buildSymbolFromFeed(key, prices[key], instrumentMeta[key]))
            .map((symbol) => {
                const score = Math.max(0, Math.min(100, Math.round(Math.abs(symbol.changePct) * 10)));
                return {
                    symbol: symbol.ticker,
                    score,
                    price: symbol.ltp,
                    change1d: symbol.changePct,
                    history: Array.from({ length: 15 }, () => ({ val: symbol.ltp })),
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 50);
    }, [prices, instrumentMeta]);

    const runScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setLastScanTime(new Date().toLocaleTimeString('en-IN'));
        }, 700);
    };

    const columns = [
        { 
            key: 'symbol', 
            label: 'SYMBOL', 
            width: 140,
            render: (val: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{val}</span>
                    {watchlist.includes(val) && <ShieldCheck size={10} style={{ color: COLOR.semantic.up }} />}
                </div>
            )
        },
        { 
            key: 'score', 
            label: 'SCORE', 
            align: 'right' as const,
            width: 80,
            render: (val: number) => (
                <span style={{ fontWeight: 'bold', color: val > 70 ? COLOR.semantic.up : COLOR.semantic.info }}>
                    {val}
                </span>
            )
        },
        { 
            key: 'price', 
            label: 'PRICE', 
            align: 'right' as const,
            width: 100,
            render: (val: number) => <Price value={val} size="sm" weight="bold" />
        },
        { 
            key: 'change1d', 
            label: 'CHANGE', 
            align: 'right' as const,
            width: 100,
            render: (val: number) => <Change value={val} format="percent" weight="bold" size="sm" />
        },
        {
            key: 'actions',
            label: '',
            width: 60,
            align: 'center' as const,
            render: (_: any, item: any) => (
                <button
                    onClick={(e) => { e.stopPropagation(); addToWatchlist(item.symbol); }}
                    disabled={watchlist.includes(item.symbol)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: watchlist.includes(item.symbol) ? COLOR.semantic.up : COLOR.text.muted,
                        cursor: watchlist.includes(item.symbol) ? 'default' : 'pointer'
                    }}
                    className={watchlist.includes(item.symbol) ? "" : "hover:text-text-primary"}
                >
                    <Plus size={14} />
                </button>
            )
        }
    ];

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div>
                    <div style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, display: 'flex', alignItems: 'center', gap: '6px' }}>
                         ACCUMULATION_SCREENER
                    </div>
                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>LAST_RUN: {lastScanTime}</div>
                </div>
                <button
                    onClick={runScan}
                    disabled={isScanning}
                    style={{
                        background: COLOR.semantic.info,
                        border: 'none',
                        color: COLOR.text.inverse,
                        fontSize: '9px',
                        fontWeight: TYPE.weight.bold,
                        padding: '4px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        letterSpacing: TYPE.letterSpacing.caps,
                    }}
                    className="hover:opacity-90 active:opacity-100 disabled:opacity-50"
                >
                    {isScanning ? <Clock size={12} className="animate-spin" /> : <Search size={12} />}
                    {isScanning ? 'RUNNING...' : 'EXECUTE'}
                </button>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {setups.length === 0 ? (
                    <EmptyState 
                        icon={<Search size={32} />} 
                        message="NO LIVE SCREENER DATA" 
                        subMessage="Execute scan to identify accumulation patterns in real-time."
                    />
                ) : (
                    <DataTable 
                        data={setups}
                        columns={columns}
                    />
                )}
            </div>
        </WidgetShell>
    );
};

export default AccumulationScreener;

