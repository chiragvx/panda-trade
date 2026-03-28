import React, { useMemo, useState } from 'react';
import { useAnthropicAPI } from '../../hooks/useAnthropicAPI';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { Search, History, Sparkles, ChevronRight, CornerDownRight } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { DataTable } from '../../ds/components/DataTable';
import { EmptyState } from '../../ds/components/EmptyState';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';

interface ScreenerFilter {
  field: string;
  operator: string;
  value: any;
}

interface ScreenerSpec {
  filters: ScreenerFilter[];
  limit: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  interpretation: string;
}

type LiveRow = {
  symbol: string;
  sector: string;
  price: number;
  change1d: number;
  change: number;
  deliveryPct: number;
  delivery: number;
  volume: number;
  [key: string]: string | number;
};

const evaluateFilter = (row: any, filter: ScreenerFilter) => {
  const left = row[filter.field];
  const right = typeof filter.value === 'string' ? filter.value : Number(filter.value);
  if (filter.operator === '>') return Number(left) > Number(right);
  if (filter.operator === '<') return Number(left) < Number(right);
  if (filter.operator === '=') return String(left) === String(right);
  return true;
};

const NLScreener: React.FC = () => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [spec, setSpec] = useState<ScreenerSpec | null>(null);
    const { callClaude, loading } = useAnthropicAPI();
    const { prices, instrumentMeta } = useUpstoxStore();

    const suggestedQueries = [
        'F&O stocks near 52w high',
        'High delivery small caps today',
        'Up more than 5% with rising volumes',
    ];

    const liveRows = useMemo<LiveRow[]>(
        () =>
            Object.keys(prices).map((key) => {
                const symbol = buildSymbolFromFeed(key, prices[key], instrumentMeta[key]);
                return {
                    symbol: symbol.ticker,
                    sector: 'UNKNOWN',
                    price: symbol.ltp,
                    change1d: symbol.changePct,
                    change: symbol.changePct,
                    deliveryPct: symbol.deliveryPct || 0,
                    delivery: symbol.deliveryPct || 0,
                    volume: symbol.volume || 0,
                };
            }),
        [prices, instrumentMeta]
    );

    const filteredRows = useMemo<LiveRow[]>(() => {
        if (!spec) return [];
        const applied = liveRows.filter((row) => spec.filters?.every((f) => evaluateFilter(row, f)));
        const sorted = [...applied].sort((a, b) => {
            const left = Number(a[spec.sortBy] ?? 0);
            const right = Number(b[spec.sortBy] ?? 0);
            return spec.sortDirection === 'asc' ? left - right : right - left;
        });
        return sorted.slice(0, spec.limit || 20);
    }, [liveRows, spec]);

    const handleSearch = async (q: string = query) => {
        if (!q.trim()) return;
        setHistory((prev) => [q, ...prev.slice(0, 9)]);

        const prompt = `Convert this stock screener query into a JSON filter specification.
Available fields: price, change1d, volume, deliveryPct
Query: "${q}"
Respond only with JSON:
{
  "filters": [{ "field": "string", "operator": ">|<|=", "value": number|string }],
  "limit": 20,
  "sortBy": "string",
  "sortDirection": "desc|asc",
  "interpretation": "friendly sentence describing the scan"
}`;

        const result = await callClaude(prompt);
        if (result) {
            try {
                const parsed = JSON.parse(result);
                setSpec(parsed);
            } catch (e) {
                console.error('Failed to parse AI response', e);
            }
        }
    };

    const columns = [
        { 
            key: 'symbol', 
            label: 'SYMBOL', 
            width: 140,
            render: (val: string, item: any) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold }}>{val}</span>
                    <span style={{ fontSize: '9px', color: COLOR.text.muted }}>{item.sector}</span>
                </div>
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
            key: 'change', 
            label: '%_CHG', 
            align: 'right' as const, 
            width: 100,
            render: (val: number) => <Change value={val} format="percent" weight="bold" size="sm" />
        },
        { 
            key: 'delivery', 
            label: 'DELV_PTS', 
            align: 'right' as const, 
            width: 100,
            render: (val: number) => (
                <span style={{ fontSize: '10px', fontWeight: TYPE.weight.bold, background: COLOR.bg.elevated, padding: '2px 6px', border: BORDER.standard }}>
                    {val.toFixed(2)}
                </span>
            )
        }
    ];

    return (
        <WidgetShell>
            <WidgetShell.Toolbar style={{ height: 'auto', flexDirection: 'column', gap: SPACE[3], padding: SPACE[4] }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Search style={{ position: 'absolute', left: '12px', color: COLOR.text.muted }} size={14} />
                    <input
                        type="text"
                        style={{
                            width: '100%',
                            background: COLOR.bg.elevated,
                            border: BORDER.standard,
                            padding: '10px 10px 10px 36px',
                            fontSize: TYPE.size.xs,
                            color: COLOR.text.primary,
                            outline: 'none',
                            fontFamily: TYPE.family.mono,
                        }}
                        placeholder="TYPE_QUERY_E.G._DELIVERY_>_65%..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={() => handleSearch()}
                        disabled={loading}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            padding: '4px 12px',
                            background: COLOR.semantic.info,
                            color: COLOR.text.inverse,
                            border: 'none',
                            fontSize: '9px',
                            fontWeight: TYPE.weight.bold,
                            cursor: 'pointer',
                        }}
                        className="hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? 'PROCESSING...' : 'EXECUTE'}
                    </button>
                </div>

                {spec && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <CornerDownRight size={10} style={{ color: COLOR.text.muted }} />
                        <span style={{ fontSize: '9px', color: COLOR.semantic.info, fontWeight: TYPE.weight.bold, fontStyle: 'italic' }}>
                            "{spec.interpretation?.toUpperCase() || 'SCAN READY'}"
                        </span>
                    </div>
                )}

                {!spec && !loading && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: '100%' }} className="no-scrollbar">
                        {suggestedQueries.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setQuery(q);
                                    handleSearch(q);
                                }}
                                style={{
                                    whiteSpace: 'nowrap',
                                    padding: '4px 8px',
                                    background: COLOR.bg.elevated,
                                    border: BORDER.standard,
                                    fontSize: '9px',
                                    color: COLOR.text.secondary,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                                className="hover:text-text-primary"
                            >
                                <Sparkles size={8} style={{ color: COLOR.semantic.warning }} />
                                {q.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {loading ? (
                    <EmptyState 
                        icon={<Sparkles size={32} className="animate-pulse" />} 
                        message="NEURAL_SCAN_IN_PROGRESS" 
                        subMessage="Synthesizing market patterns and calculating real-time alignment."
                    />
                ) : spec ? (
                    filteredRows.length === 0 ? (
                        <EmptyState 
                            icon={<Search size={32} />} 
                            message="NO MATCHING LIVE RESULTS" 
                            subMessage="Try adjusting your pattern filters or selecting a broader query."
                        />
                    ) : (
                        <DataTable 
                            data={filteredRows}
                            columns={columns}
                        />
                    )
                ) : history.length > 0 ? (
                    <div style={{ padding: SPACE[4], display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLOR.text.muted }}>
                            <History size={12} />
                            <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>HISTORICAL_QUERIES</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {history.map((h, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setQuery(h);
                                        handleSearch(h);
                                    }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 12px',
                                        background: COLOR.bg.surface,
                                        border: BORDER.standard,
                                        color: COLOR.text.secondary,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                    className="hover:border-text-muted hover:text-text-primary transition-colors"
                                >
                                    {h.toUpperCase()}
                                    <ChevronRight size={12} />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <EmptyState 
                        icon={<Sparkles size={32} />} 
                        message="MARKET_COGNITION_READY" 
                        subMessage="Describe pattern requirements to execute neural-assisted scan."
                    />
                )}
            </div>
        </WidgetShell>
    );
};

export default NLScreener;

