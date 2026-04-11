import React from 'react';
import { useIndices } from '../../hooks/useIndices';
import { COLOR, TYPE, BORDER, SPACE, ROW_HEIGHT } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

export const IndicesWidget: React.FC = () => {
    const indices = useIndices();

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} style={{ color: COLOR.semantic.info }} />
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: '0.1em' }}>MARKET_INDICES</span>
                </div>
            </WidgetShell.Toolbar>
            
            <div style={{ flex: 1, overflowY: 'auto', background: COLOR.bg.surface }} className="custom-scrollbar">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ 
                        display: 'flex', 
                        height: ROW_HEIGHT.header, 
                        borderBottom: BORDER.standard,
                        background: COLOR.bg.elevated,
                        padding: '0 12px',
                        alignItems: 'center'
                    }}>
                        <span style={{ flex: 1, fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted }}>INDEX</span>
                        <span style={{ width: '70px', textAlign: 'right', fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted }}>LTP</span>
                        <span style={{ width: '70px', textAlign: 'right', fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted }}>%CHG</span>
                    </div>

                    {indices.map((idx) => (
                        <div 
                            key={idx.instrument_key}
                            style={{ 
                                display: 'flex', 
                                height: ROW_HEIGHT.relaxed, 
                                borderBottom: BORDER.standard,
                                padding: '0 12px',
                                alignItems: 'center',
                                transition: 'background 0.1s linear'
                            }}
                            className="hover:bg-bg-elevated"
                        >
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{idx.ticker}</span>
                                <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: TYPE.weight.medium }}>{idx.instrument_key.split('|')[0]}</span>
                            </div>
                            
                            <div style={{ width: '70px', textAlign: 'right' }}>
                                <span style={{ 
                                    fontFamily: TYPE.family.mono, 
                                    fontSize: TYPE.size.sm, 
                                    fontWeight: TYPE.weight.bold,
                                    color: COLOR.text.primary 
                                }}>
                                    {idx.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div style={{ width: '70px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                                <Change value={idx.pChange} format="percent" size="sm" />
                                <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>
                                    {idx.change > 0 ? '+' : ''}{idx.change.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <div style={{ width: '6px', height: '6px', background: COLOR.semantic.up, borderRadius: '50%' }} />
                   <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>REAL-TIME FEED</span>
               </div>
               <span style={{ fontSize: '8px', fontWeight: TYPE.weight.black, color: COLOR.text.muted }}>NSE_EXCHANGE</span>
            </div>
        </WidgetShell>
    );
};
