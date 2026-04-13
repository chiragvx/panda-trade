import React from 'react';
import { useTechnicals } from '../../hooks/useTechnicals';
import { COLOR, TYPE, BORDER, SPACE, Text, Price, Badge, WidgetShell } from '../../ds';
import { Cpu, Info, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { useUpstoxStore } from '../../store/useUpstoxStore';

export const TechnicalsWidget: React.FC = () => {
    const [localSymbol, setLocalSymbol] = React.useState<any>(null);
    const { indicators, isLoading, symbol } = useTechnicals(localSymbol);
    const { setInstrumentMeta } = useUpstoxStore();

    const getRSISentiment = (rsi: number) => {
        if (rsi >= 70) return { label: 'OVERBOUGHT', color: 'down' as const };
        if (rsi <= 30) return { label: 'OVERSOLD', color: 'up' as const };
        return { label: 'NEUTRAL', color: 'muted' as const };
    };

    const getPriceRelation = (price: number, ma: number) => {
        if (price > ma) return { icon: <TrendingUp size={12} />, color: 'up' as const, label: 'ABOVE' };
        if (price < ma) return { icon: <TrendingDown size={12} />, color: 'down' as const, label: 'BELOW' };
        return { icon: <Minus size={12} />, color: 'muted' as const, label: 'AT' };
    };

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cpu size={14} style={{ color: COLOR.semantic.info }} />
                        <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                            TECH_ANALYSIS: {symbol || 'NONE'}
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

            <div style={{ flex: 1, padding: SPACE[3], overflowY: 'auto' }} className="custom-scrollbar">
                {indicators ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
                        {/* RSI SECTION */}
                        <div style={{ background: COLOR.bg.surface, border: BORDER.standard, padding: SPACE[3] }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: SPACE[2] }}>
                                <Text size="xs" weight="black" color="muted">RSI (14)</Text>
                                <Text size="xs" weight="bold" color={getRSISentiment(indicators.rsi).color}>
                                    {getRSISentiment(indicators.rsi).label}
                                </Text>
                            </div>
                            <div style={{ height: '4px', background: COLOR.bg.elevated, position: 'relative', borderRadius: '2px', marginBottom: SPACE[2] }}>
                                <div style={{ 
                                    position: 'absolute', 
                                    left: '30%', 
                                    right: '30%', 
                                    top: 0, 
                                    bottom: 0, 
                                    background: 'rgba(255,255,255,0.05)',
                                    borderLeft: `1px solid ${COLOR.bg.border}`,
                                    borderRight: `1px solid ${COLOR.bg.border}`
                                }} />
                                <div style={{ 
                                    position: 'absolute', 
                                    left: `${indicators.rsi}%`, 
                                    top: '-4px', 
                                    width: '2px', 
                                    height: '12px', 
                                    background: COLOR.text.primary,
                                    boxShadow: `0 0 8px ${COLOR.text.primary}`
                                }} />
                            </div>
                            <Text family="mono" size="lg" weight="black">{indicators.rsi?.toFixed(2)}</Text>
                        </div>

                        {/* TREND SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
                            <Text size="xs" weight="black" color="muted" style={{ letterSpacing: '0.1em' }}>MOVING AVERAGES</Text>
                            {[
                                { label: 'SMA 20', val: indicators.sma20 },
                                { label: 'EMA 50', val: indicators.ema50 },
                                { label: 'EMA 200', val: indicators.ema200 },
                            ].map(ma => {
                                const rel = getPriceRelation(indicators.lastPrice, ma.val);
                                return (
                                    <div key={ma.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: COLOR.bg.surface, border: BORDER.standard }}>
                                        <Text size="sm" weight="bold" color="secondary">{ma.label}</Text>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Price value={ma.val} size="sm" weight="black" />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px', justifyContent: 'flex-end' }}>
                                            <div style={{ color: COLOR.semantic[rel.color as keyof typeof COLOR.semantic] }}>{rel.icon}</div>
                                            <Text size="xs" weight="black" color={rel.color as any}>{rel.label}</Text>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: COLOR.text.muted }}>
                         <RefreshCw size={16} className="animate-spin" />
                         <Text size="sm" weight="bold">CALCULATING_SIGNALS...</Text>
                    </div>
                )}
            </div>

            <div style={{ height: '32px', padding: '0 12px', background: COLOR.bg.surface, borderTop: BORDER.strong, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Info size={12} color={COLOR.text.muted} />
                   <Text size="xs" color="muted" weight="bold">INDICATORS_LAGGING: DAILY_CHART</Text>
               </div>
               <Badge label="QUANT_ENGINE_V1" variant="info" />
            </div>
        </WidgetShell>
    );
};
