import React from 'react';
import { useVWAP } from '../../hooks/useVWAP';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { EmptyState } from '../../ds/components/EmptyState';
import { Orbit, Search, Info, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';

export const VWapWidget: React.FC = () => {
    const [localSymbol, setLocalSymbol] = React.useState<any>(null);
    const { vwap, isLoading, symbol } = useVWAP(localSymbol);
    const { setInstrumentMeta } = useUpstoxStore();
    // LTP is derived from store prices mapped by symbol from hook

    // I'll just use the hook I created or get it from store
    const ltp = useUpstoxStore(s => {
        const key = localSymbol?.instrument_key || Object.keys(s.prices).find(k => k.includes(symbol || '')); // Precise if local, rough if global
        return key ? s.prices[key]?.ltp : 0;
    });

    if (!symbol) {
        return (
            <WidgetShell>
                <EmptyState 
                    icon={<Search size={32} />}
                    message="SELECT_INSTRUMENT"
                    subMessage="VWAP requires intraday volume and price data for calculation."
                />
            </WidgetShell>
        );
    }

    const diff = vwap ? ((ltp - vwap) / vwap) * 100 : 0;
    const isAbove = ltp > (vwap || 0);

    return (
        <WidgetShell>
            <WidgetShell.Toolbar style={{ height: 'auto', padding: '8px 12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Orbit size={14} style={{ color: COLOR.semantic.info }} />
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: '0.1em' }}>VWAP_ANALYSIS: {symbol}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <WidgetSymbolSearch 
                        onSelect={(res) => {
                            setLocalSymbol({ instrument_key: res.instrumentKey, ticker: res.ticker });
                            setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
                        }} 
                        placeholder="SEARCH..." 
                    />
                    {localSymbol && (
                        <button 
                            onClick={() => setLocalSymbol(null)}
                            style={{ background: 'transparent', border: 'none', color: COLOR.semantic.down, fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            RESET
                        </button>
                    )}
                </div>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, padding: SPACE[4], display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
                {vwap ? (
                    <>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted, letterSpacing: '0.2em', display: 'block', marginBottom: '8px' }}>ANCHORED VWAP (TODAY)</span>
                            <span style={{ fontSize: '32px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary, fontFamily: TYPE.family.mono }}>{vwap.toFixed(2)}</span>
                        </div>

                        <div style={{ width: '100%', maxWidth: '300px', background: COLOR.bg.surface, border: BORDER.standard, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: COLOR.text.secondary }}>DISTANCE FROM VWAP</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isAbove ? COLOR.semantic.up : COLOR.semantic.down }}>
                                    {isAbove ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: TYPE.family.mono }}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}%</span>
                                </div>
                            </div>
                            
                            <div style={{ height: '2px', background: COLOR.bg.elevated, position: 'relative' }}>
                                <div style={{ 
                                    position: 'absolute', 
                                    left: '50%', 
                                    top: '-4px', 
                                    width: '1px', 
                                    height: '10px', 
                                    background: COLOR.text.muted 
                                }} />
                                <div style={{ 
                                    position: 'absolute', 
                                    left: `${50 + (diff * 5)}%`, // Scaled for UI
                                    top: '-6px', 
                                    width: '4px', 
                                    height: '14px', 
                                    background: isAbove ? COLOR.semantic.up : COLOR.semantic.down,
                                    borderRadius: '2px',
                                    transition: 'left 0.3s ease-out'
                                }} />
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span style={{ fontSize: '8px', color: COLOR.text.muted }}>BEARISH ZONE</span>
                                <span style={{ fontSize: '8px', color: COLOR.text.muted }}>BULLISH ZONE</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Target size={14} style={{ color: COLOR.text.muted }} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: 'bold' }}>MARKET BIAS</span>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: isAbove ? COLOR.semantic.up : COLOR.semantic.down }}>
                                        {isAbove ? 'BULLISH_INTENSITY' : 'BEARISH_PRESSURE'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <Orbit size={32} className="animate-spin" style={{ color: COLOR.text.muted, marginBottom: '16px', opacity: 0.5 }} />
                        <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>FETCHING_INTRADAY_VOLUMES...</span>
                    </div>
                )}
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <Info size={11} style={{ color: COLOR.text.muted }} />
                   <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>ALGO_SIGNAL: VWAP_CROSSOVER_TRACKER</span>
               </div>
               <span style={{ fontSize: '8px', fontWeight: TYPE.weight.black, color: COLOR.semantic.info }}>V2_ANALYTICS</span>
            </div>
        </WidgetShell>
    );
};
