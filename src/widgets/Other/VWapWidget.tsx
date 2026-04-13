import React from 'react';
import { useVWAP } from '../../hooks/useVWAP';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER, SPACE, Text, Badge, WidgetShell, Price } from '../../ds';
import { Orbit, Info, TrendingUp, TrendingDown, Target, RefreshCw } from 'lucide-react';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';

export const VWapWidget: React.FC = () => {
    const [localSymbol, setLocalSymbol] = React.useState<any>(null);
    const { vwap, isLoading, symbol } = useVWAP(localSymbol);
    const { setInstrumentMeta } = useUpstoxStore();

    const ltp = useUpstoxStore(s => {
        const key = localSymbol?.instrument_key || Object.keys(s.prices).find(k => k.includes(symbol || ''));
        return key ? s.prices[key]?.ltp : 0;
    });

    const diff = vwap ? ((ltp - vwap) / vwap) * 100 : 0;
    const isAbove = ltp > (vwap || 0);

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Orbit size={14} style={{ color: COLOR.semantic.info }} />
                        <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                            VWAP_ANALYSIS: {symbol || 'NONE'}
                        </Text>
                    </div>
                </WidgetShell.Toolbar.Left>
                
                <WidgetShell.Toolbar.Right>
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
                                style={{ background: 'transparent', border: 'none', color: COLOR.semantic.down, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, cursor: 'pointer' }}
                            >
                                RESET
                            </button>
                        )}
                    </div>
                </WidgetShell.Toolbar.Right>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, padding: SPACE[6], display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: SPACE[6] }}>
                {vwap ? (
                    <>
                        <div style={{ textAlign: 'center' }}>
                            <Text size="xs" weight="black" color="muted" style={{ letterSpacing: '0.2em', display: 'block', marginBottom: SPACE[2] }}>
                                ANCHORED VWAP (TODAY)
                            </Text>
                            <Text size="3xl" weight="black" family="mono" color="primary">
                                {vwap.toFixed(2)}
                            </Text>
                        </div>

                        <div style={{ width: '100%', maxWidth: '320px', background: COLOR.bg.surface, border: BORDER.standard, padding: SPACE[4], display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text size="sm" weight="bold" color="secondary">DISTANCE FROM VWAP</Text>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isAbove ? COLOR.semantic.up : COLOR.semantic.down }}>
                                    {isAbove ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    <Text size="md" weight="black" family="mono" color={isAbove ? 'up' : 'down'}>
                                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                                    </Text>
                                </div>
                            </div>
                            
                            <div style={{ height: '4px', background: COLOR.bg.elevated, position: 'relative', borderRadius: '2px' }}>
                                <div style={{ 
                                    position: 'absolute', 
                                    left: '50%', 
                                    top: '-4px', 
                                    width: '1px', 
                                    height: '12px', 
                                    background: COLOR.border.standard 
                                }} />
                                <div style={{ 
                                    position: 'absolute', 
                                    left: `${Math.max(5, Math.min(95, 50 + (diff * 5)))}%`, // Capped for UI
                                    top: '-6px', 
                                    width: '4px', 
                                    height: '16px', 
                                    background: isAbove ? COLOR.semantic.up : COLOR.semantic.down,
                                    borderRadius: '2px',
                                    transition: 'left 0.3s ease-out'
                                }} />
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text size="xs" color="muted" weight="black">BEARISH_ZONE</Text>
                                <Text size="xs" color="muted" weight="black">BULLISH_ZONE</Text>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: SPACE[4], alignItems: 'center' }}>
                            <Target size={16} color={COLOR.text.muted} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text size="xs" color="muted" weight="black">MARKET_BIAS</Text>
                                <Text size="sm" weight="black" color={isAbove ? 'up' : 'down'}>
                                    {isAbove ? 'BULLISH_INTENSITY' : 'BEARISH_PRESSURE'}
                                </Text>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[4] }}>
                        <RefreshCw size={32} className="animate-spin" color={COLOR.text.muted} style={{ opacity: 0.5 }} />
                        <Text size="xs" color="muted" family="mono" weight="black">FETCHING_INTRADAY_VOLUMES...</Text>
                    </div>
                )}
            </div>

            <div style={{ height: '32px', padding: '0 12px', borderTop: BORDER.strong, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Info size={12} color={COLOR.text.muted} />
                   <Text size="xs" color="muted" weight="bold">ALGO_SIGNAL: VWAP_CROSSOVER_TRACKER</Text>
               </div>
               <Badge label="V2_ANALYTICS" variant="info" />
            </div>
        </WidgetShell>
    );
};
