import React, { useState, useEffect } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { 
    COLOR, 
    TYPE, 
    BORDER, 
    SPACE, 
    Text, 
    Badge, 
    Price, 
    Change, 
    WidgetShell, 
    Button 
} from '../../ds';
import { Search, Activity, RefreshCw } from 'lucide-react';

interface ScreenerResult {
    symbol: string;
    ticker: string;
    ltp: number;
    change: number;
    change_percent: number;
    volume: number;
}

export const NLScreener: React.FC = () => {
    const { accessToken } = useUpstoxStore();
    const [results, setResults] = useState<ScreenerResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState<'GAINERS' | 'LOSERS' | 'VOLUME'>('GAINERS');

    const NIFTY_SAMPLES = [
        'NSE_EQ|RELIANCE', 'NSE_EQ|TCS', 'NSE_EQ|HDFCBANK', 'NSE_EQ|ICICIBANK', 'NSE_EQ|INFY',
        'NSE_EQ|BHARTIARTL', 'NSE_EQ|ITC', 'NSE_EQ|SBIN', 'NSE_EQ|LTIM', 'NSE_EQ|HUL',
        'NSE_EQ|AXISBANK', 'NSE_EQ|BAJFINANCE', 'NSE_EQ|KOTAKBANK', 'NSE_EQ|LT', 'NSE_EQ|MARUTI'
    ];

    const runScreener = async () => {
        if (!accessToken) return;
        setIsLoading(true);
        try {
            const res = await upstoxApi.getMarketQuotes(accessToken, NIFTY_SAMPLES);
            if (res.status === 'success' && res.data) {
                const mapped: ScreenerResult[] = Object.entries(res.data).map(([key, data]: [string, any]) => ({
                    symbol: key,
                    ticker: key.split('|').pop() || '',
                    ltp: data.last_price,
                    change: data.last_price - data.ohlc.close,
                    change_percent: ((data.last_price - data.ohlc.close) / data.ohlc.close) * 100,
                    volume: data.volume
                }));

                let sorted = [...mapped];
                if (filter === 'GAINERS') sorted.sort((a, b) => b.change_percent - a.change_percent);
                else if (filter === 'LOSERS') sorted.sort((a, b) => a.change_percent - b.change_percent);
                else sorted.sort((a, b) => b.volume - a.volume);

                setResults(sorted);
            }
        } catch (err) {
            console.error('Screener run failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        runScreener();
        const interval = setInterval(runScreener, 30000);
        return () => clearInterval(interval);
    }, [accessToken, filter]);

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={14} color={COLOR.semantic.info} />
                        <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                            BLUECHIP_ALPHA_SCREENER
                        </Text>
                    </div>
                </WidgetShell.Toolbar.Left>
                <WidgetShell.Toolbar.Right>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {(['GAINERS', 'LOSERS', 'VOLUME'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '2px 8px',
                                    background: filter === f ? COLOR.bg.elevated : 'transparent',
                                    border: BORDER.standard,
                                    color: filter === f ? COLOR.text.primary : COLOR.text.muted,
                                    fontSize: TYPE.size.xs,
                                    fontWeight: TYPE.weight.black,
                                    cursor: 'pointer',
                                    borderRadius: '2px',
                                    transition: 'all 0.1s linear',
                                    letterSpacing: TYPE.letterSpacing.caps
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </WidgetShell.Toolbar.Right>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                {results.map((r) => (
                    <div key={r.symbol} style={{ 
                        padding: '10px 12px', 
                        borderBottom: BORDER.standard,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: COLOR.bg.surface
                    }}>
                        <div style={{ flex: 1 }}>
                            <Text size="md" weight="black" color="primary" block>{r.ticker}</Text>
                            <Text size="xs" color="muted" weight="bold">{r.symbol}</Text>
                        </div>
                        
                        <div style={{ textAlign: 'right', minWidth: '90px' }}>
                            <Price value={r.ltp} weight="black" size="md" />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
                                <Change value={r.change_percent} format="percent" size="sm" weight="black" />
                                <Text size="xs" color="muted" family="mono" weight="bold">
                                    {r.change > 0 ? '+' : ''}{r.change.toFixed(2)}
                                </Text>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && results.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
                         <RefreshCw size={24} className="animate-spin" color={COLOR.text.muted} />
                         <Text size="sm" color="muted" weight="bold">SCANNING_MARKET_SNAPSHOTS...</Text>
                    </div>
                )}
            </div>

            <div style={{ height: '32px', padding: '0 12px', borderTop: BORDER.standard, background: COLOR.bg.elevated, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={12} color={COLOR.semantic.up} />
                    <Text size="xs" color="muted" weight="bold">SCOPE: NSE_50_BLUECHIPS</Text>
                </div>
                <Badge label="UPSTOX_ENGINE_V3" variant="info" />
            </div>
        </WidgetShell>
    );
};
