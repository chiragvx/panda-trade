import React from 'react';
import { useIndices } from '../../hooks/useIndices';
import { COLOR, TYPE, BORDER, SPACE, ROW_HEIGHT, Text, Badge, WidgetShell, Change } from '../../ds';
import { Activity, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export const IndicesWidget: React.FC = () => {
    const indices = useIndices();

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={14} style={{ color: COLOR.semantic.info }} />
                        <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                            MARKET_INDICES
                        </Text>
                    </div>
                </WidgetShell.Toolbar.Left>
            </WidgetShell.Toolbar>
            
            <div style={{ flex: 1, overflowY: 'auto', background: COLOR.bg.surface }} className="custom-scrollbar">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Header Row */}
                    <div style={{ 
                        display: 'flex', 
                        height: ROW_HEIGHT.header, 
                        borderBottom: BORDER.standard,
                        background: COLOR.bg.elevated,
                        padding: '0 12px',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}>
                        <div style={{ flex: 1 }}><Text size="xs" weight="black" color="muted">INDEX</Text></div>
                        <div style={{ width: '90px', textAlign: 'right' }}><Text size="xs" weight="black" color="muted">LTP</Text></div>
                        <div style={{ width: '90px', textAlign: 'right' }}><Text size="xs" weight="black" color="muted">%CHG</Text></div>
                    </div>

                    {indices.map((idx) => (
                        <div 
                            key={idx.instrument_key}
                            style={{ 
                                display: 'flex', 
                                height: '40px', 
                                borderBottom: BORDER.standard,
                                padding: '0 12px',
                                alignItems: 'center'
                            }}
                            className="hover:bg-bg-elevated"
                        >
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Text weight="black" size="md">{idx.ticker}</Text>
                                <Text size="xs" color="muted" weight="bold">
                                    {idx.instrument_key.split('|')[0]}
                                </Text>
                            </div>
                            
                            <div style={{ width: '90px', textAlign: 'right' }}>
                                <Text weight="black" family="mono" size="md">
                                    {idx.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </div>

                            <div style={{ width: '90px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Change value={idx.pChange} format="percent" size="sm" weight="black" />
                                <Text size="xs" color="muted" family="mono" weight="bold">
                                    {idx.change > 0 ? '+' : ''}{idx.change.toFixed(2)}
                                </Text>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ height: '32px', padding: '0 12px', borderTop: BORDER.strong, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Clock size={12} color={COLOR.semantic.up} />
                   <Text size="xs" color="muted" weight="bold">LIVE_FEED: REALTIME_SNAPSHOT</Text>
               </div>
               <Badge label="NSE_EXCHANGE" variant="muted" />
            </div>
        </WidgetShell>
    );
};
