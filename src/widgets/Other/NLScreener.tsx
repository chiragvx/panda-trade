import React, { useState, useEffect } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { Search, TrendingUp, TrendingDown, Activity, Filter, RefreshCcw } from 'lucide-react';
import { Price } from '../../ds/components/Price';

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

    // For a real-time screener without a backend, we sample Nifty 50 stocks
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Search size={14} style={{ color: COLOR.semantic.info }} />
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: '0.1em' }}>UPSTOX_REALTIME_SCREENER</span>
                </div>
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
                                fontSize: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflowY: 'auto', background: '#000' }} className="custom-scrollbar">
                {results.map((r, idx) => (
                    <div key={r.symbol} style={{ 
                        padding: '10px 12px', 
                        borderBottom: BORDER.standard,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{r.ticker}</div>
                            <div style={{ fontSize: '9px', color: COLOR.text.muted }}>{r.symbol}</div>
                        </div>
                        
                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                            <Price value={r.ltp} size="sm" weight="bold" />
                            <div style={{ 
                                fontSize: '10px', 
                                fontWeight: 'bold', 
                                color: r.change >= 0 ? COLOR.semantic.up : COLOR.semantic.down,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '2px'
                            }}>
                                {r.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(r.change_percent).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && results.length === 0 && (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>INITIALIZING_SCANNER...</span>
                    </div>
                )}
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '8px', color: COLOR.text.muted }}>SAMPLE: NIFTY_BLUECHIPS</span>
                <span style={{ fontSize: '8px', fontWeight: 'black', color: COLOR.semantic.info }}>ENGINE_STATUS: ACTIVE</span>
            </div>
        </WidgetShell>
    );
};
