import React from 'react';
import { useTechnicals } from '../../hooks/useTechnicals';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { EmptyState } from '../../ds/components/EmptyState';
import { Cpu, Search, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const TechnicalsWidget: React.FC = () => {
    const { indicators, isLoading, symbol } = useTechnicals();

    if (!symbol) {
        return (
            <WidgetShell>
                <EmptyState 
                    icon={<Search size={32} />}
                    message="SELECT_INSTRUMENT"
                    subMessage="Choose a symbol to analyze core technical indicators and price trends."
                />
            </WidgetShell>
        );
    }

    const getRSISentiment = (rsi: number) => {
        if (rsi >= 70) return { label: 'OVERBOUGHT', color: COLOR.semantic.down };
        if (rsi <= 30) return { label: 'OVERSOLD', color: COLOR.semantic.up };
        return { label: 'NEUTRAL', color: COLOR.text.muted };
    };

    const getPriceRelation = (price: number, ma: number) => {
        if (price > ma) return { icon: <TrendingUp size={12} />, color: COLOR.semantic.up, label: 'ABOVE' };
        if (price < ma) return { icon: <TrendingDown size={12} />, color: COLOR.semantic.down, label: 'BELOW' };
        return { icon: <Minus size={12} />, color: COLOR.text.muted, label: 'AT' };
    };

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={14} style={{ color: COLOR.semantic.info }} />
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: '0.1em' }}>TECHNICAL_ANALYSIS: {symbol}</span>
                </div>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, padding: SPACE[4], overflowY: 'auto' }} className="custom-scrollbar">
                {indicators ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* RSI SECTION */}
                        <div style={{ background: COLOR.bg.surface, border: BORDER.standard, padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted }}>RSI (14)</span>
                                <span style={{ fontSize: '10px', fontWeight: TYPE.weight.bold, color: getRSISentiment(indicators.rsi).color }}>{getRSISentiment(indicators.rsi).label}</span>
                            </div>
                            <div style={{ height: '4px', background: COLOR.bg.elevated, position: 'relative', borderRadius: '2px' }}>
                                <div style={{ 
                                    position: 'absolute', 
                                    left: '30%', 
                                    right: '30%', 
                                    top: 0, 
                                    bottom: 0, 
                                    background: 'rgba(255,255,255,0.05)',
                                    borderLeft: '1px solid #333',
                                    borderRight: '1px solid #333'
                                }} />
                                <div style={{ 
                                    position: 'absolute', 
                                    left: `${indicators.rsi}%`, 
                                    top: '-4px', 
                                    width: '2px', 
                                    height: '12px', 
                                    background: '#fff',
                                    boxShadow: '0 0 8px #fff'
                                }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                <span style={{ fontFamily: TYPE.family.mono, fontSize: '12px', fontWeight: 'bold' }}>{indicators.rsi?.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* TREND SECTION */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted, letterSpacing: '0.1em' }}>MOVING AVERAGES</span>
                            {[
                                { label: 'SMA 20', val: indicators.sma20 },
                                { label: 'EMA 50', val: indicators.ema50 },
                                { label: 'EMA 200', val: indicators.ema200 },
                            ].map(ma => {
                                const rel = getPriceRelation(indicators.lastPrice, ma.val);
                                return (
                                    <div key={ma.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: COLOR.bg.surface, border: BORDER.standard }}>
                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: COLOR.text.secondary }}>{ma.label}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontFamily: TYPE.family.mono, fontSize: '11px', color: COLOR.text.primary }}>{ma.val?.toFixed(2)}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '60px', justifyContent: 'flex-end', color: rel.color }}>
                                                {rel.icon}
                                                <span style={{ fontSize: '9px', fontWeight: 'black' }}>{rel.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.sm }}>CALCULATING_SIGNALS...</div>
                )}
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <Info size={11} style={{ color: COLOR.text.muted }} />
                   <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>INDICATORS_LAGGING: DAILY_CHART</span>
               </div>
               <span style={{ fontSize: '8px', fontWeight: TYPE.weight.black, color: COLOR.semantic.info }}>QUANT_ENGINE_V1</span>
            </div>
        </WidgetShell>
    );
};
