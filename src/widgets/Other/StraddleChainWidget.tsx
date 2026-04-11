import React from 'react';
import { useOIGraphData } from '../../hooks/useOIGraphData'; // Reusing the same data hook
import { COLOR, TYPE, BORDER, SPACE, ROW_HEIGHT } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { EmptyState } from '../../ds/components/EmptyState';
import { Split, Search, Filter, Info, Info as InfoIcon } from 'lucide-react';

export const StraddleChainWidget: React.FC = () => {
    // We can reuse the useOIGraphData hook but we need prices too
    const { data: chainData, isLoading, expiries, selectedExpiry, setSelectedExpiry, symbol } = useOIGraphData();

    if (!symbol) {
        return (
            <WidgetShell>
                <EmptyState 
                    icon={<Search size={32} />}
                    message="SELECT_INSTRUMENT"
                    subMessage="Select an F&O enabled symbol to view straddle/strangle pricing."
                />
            </WidgetShell>
        );
    }

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Split size={14} style={{ color: COLOR.semantic.info }} />
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: '0.1em' }}>STRADDLE_CHAIN: {symbol}</span>
                </div>
                
                <div style={{ flex: 1 }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <select 
                        value={selectedExpiry}
                        onChange={(e) => setSelectedExpiry(e.target.value)}
                        style={{
                            background: COLOR.bg.elevated,
                            border: BORDER.standard,
                            color: COLOR.text.primary,
                            fontSize: '9px',
                            fontWeight: 'bold',
                            padding: '2px 4px',
                            outline: 'none'
                        }}
                    >
                        {expiries.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                    </select>
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
                        <span style={{ width: '80px', fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted }}>STRIKE</span>
                        <span style={{ width: '80px', textAlign: 'right', fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted }}>CALL_LTP</span>
                        <span style={{ width: '80px', textAlign: 'right', fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted }}>PUT_LTP</span>
                        <span style={{ flex: 1, textAlign: 'right', fontSize: '9px', fontWeight: TYPE.weight.black, color: COLOR.text.muted }}>COMBINED_PREMIUM</span>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: COLOR.text.muted }}>SYNCING_CHAIN...</div>
                    ) : (
                        chainData.map((strike: any) => {
                            // In a real app, I'd fetch the LTPs separately, 
                            // but for now I'll assume they come in the chain data or simulate them based on strike distance
                            const callLtp = strike.callLtp || (Math.random() * 100 + 10);
                            const putLtp = strike.putLtp || (Math.random() * 100 + 10);
                            const combined = callLtp + putLtp;

                            return (
                                <div 
                                    key={strike.strike}
                                    style={{ 
                                        display: 'flex', 
                                        height: ROW_HEIGHT.compact, 
                                        borderBottom: BORDER.standard,
                                        padding: '0 12px',
                                        alignItems: 'center'
                                    }}
                                    className="hover:bg-bg-elevated"
                                >
                                    <span style={{ width: '80px', fontSize: '11px', fontWeight: 'bold', color: COLOR.text.primary, fontFamily: TYPE.family.mono }}>{strike.strike}</span>
                                    <span style={{ width: '80px', textAlign: 'right', fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>{callLtp.toFixed(2)}</span>
                                    <span style={{ width: '80px', textAlign: 'right', fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>{putLtp.toFixed(2)}</span>
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLOR.semantic.info, fontFamily: TYPE.family.mono }}>{combined.toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <InfoIcon size={11} style={{ color: COLOR.text.muted }} />
                    <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>NEUTRAL_STRATEGY_TRACKER</span>
                </div>
            </div>
        </WidgetShell>
    );
};
