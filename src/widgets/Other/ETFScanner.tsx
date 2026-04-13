import React, { useState, useEffect } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { COLOR, TYPE, BORDER, SPACE, ROW_HEIGHT } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { Search, Info, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { Change } from '../../ds/components/Change';

export const ETFScanner: React.FC = () => {
    const { accessToken } = useUpstoxStore();
    const [etfs, setEtfs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { prices } = useUpstoxStore();

    useEffect(() => {
        if (!accessToken) return;

        const loadETFs = async () => {
            setIsLoading(true);
            try {
                // Search for ETF in symbol names
                const res = await upstoxApi.searchInstruments(accessToken, 'ETF');
                if (res.status === 'success' && Array.isArray(res.data)) {
                    // Filter for EQUITY only and ensure "ETF" is in the name
                    const filtered = res.data.filter((i: any) => 
                        (i.instrument_type === 'EQUITY' || !i.instrument_type) && 
                        (i.name?.toUpperCase().includes('ETF') || i.trading_symbol?.toUpperCase().includes('ETF'))
                    );
                    setEtfs(filtered.slice(0, 50));
                }
            } catch (err) {
                console.error("Failed to fetch ETFs:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadETFs();
    }, [accessToken]);

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={14} color={COLOR.semantic.info} />
                    <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps }}>ETF_EXPLORER</span>
                </div>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflowY: 'auto', background: COLOR.bg.surface }} className="custom-scrollbar">
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: COLOR.text.muted }}>SCANNING_EXCHANGES...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {etfs.map((etf) => {
                            const priceData = prices[etf.instrument_key];
                            return (
                                <div 
                                    key={etf.instrument_key}
                                    style={{ 
                                        display: 'flex', 
                                        height: '44px', 
                                        borderBottom: BORDER.standard,
                                        padding: '0 12px',
                                        alignItems: 'center',
                                        transition: 'background 0.1s linear'
                                    }}
                                    className="hover:bg-bg-elevated"
                                >
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary }}>{etf.name || etf.trading_symbol}</span>
                                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>{etf.trading_symbol} • {etf.exchange}</span>
                                    </div>
                                    
                                    {priceData && (
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: TYPE.family.mono }}>{priceData.ltp.toFixed(2)}</div>
                                            <Change value={priceData.pChange} format="percent" size="xs" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.elevated }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={12} color={COLOR.text.muted} />
                    <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>LIQUIDITY_RANKED: NSE/BSE</span>
                </div>
            </div>
        </WidgetShell>
    );
};
