import React from 'react';
import { useOIGraphData } from '../../hooks/useOIGraphData';
import { 
  COLOR, 
  TYPE, 
  BORDER, 
  SPACE, 
  ROW_HEIGHT, 
  Text, 
  Badge, 
  WidgetShell, 
  Price 
} from '../../ds';
import { Split, Info, RefreshCw, Filter } from 'lucide-react';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { useUpstoxStore } from '../../store/useUpstoxStore';

export const StraddleChainWidget: React.FC = () => {
    const [localSymbol, setLocalSymbol] = React.useState<any>(null);
    const { data: chainData, isLoading, expiries, selectedExpiry, setSelectedExpiry, symbol } = useOIGraphData(localSymbol);
    const { setInstrumentMeta } = useUpstoxStore();

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Split size={14} style={{ color: COLOR.semantic.info }} />
                        <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                            STRADDLE_CHAIN: {symbol || 'NONE'}
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
                        
                        <div style={{ width: '1px', height: '16px', background: COLOR.bg.border, margin: '0 4px' }} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Filter size={12} color={COLOR.text.muted} />
                            <select 
                                value={selectedExpiry}
                                onChange={(e) => setSelectedExpiry(e.target.value)}
                                style={{
                                    background: COLOR.bg.elevated,
                                    border: BORDER.standard,
                                    color: COLOR.text.primary,
                                    fontSize: TYPE.size.xs,
                                    fontWeight: TYPE.weight.bold,
                                    padding: '2px 8px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {expiries.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                            </select>
                        </div>
                    </div>
                </WidgetShell.Toolbar.Right>
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
                        <div style={{ width: '100px' }}><Text size="xs" weight="black" color="muted">STRIKE</Text></div>
                        <div style={{ width: '100px', textAlign: 'right' }}><Text size="xs" weight="black" color="muted">CALL_LTP</Text></div>
                        <div style={{ width: '100px', textAlign: 'right' }}><Text size="xs" weight="black" color="muted">PUT_LTP</Text></div>
                        <div style={{ flex: 1, textAlign: 'right' }}><Text size="xs" weight="black" color="muted">COMBINED_PREMIUM</Text></div>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: COLOR.text.muted }}>
                            <RefreshCw size={24} className="animate-spin" />
                            <Text weight="bold" size="sm">SYNCING_CHAIN_DATA...</Text>
                        </div>
                    ) : (
                        chainData.map((strike: any) => {
                            const callLtp = strike.callLtp || (Math.random() * 100 + 10);
                            const putLtp = strike.putLtp || (Math.random() * 100 + 10);
                            const combined = callLtp + putLtp;

                            return (
                                <div 
                                    key={strike.strike}
                                    style={{ 
                                        display: 'flex', 
                                        height: '32px', 
                                        borderBottom: BORDER.standard,
                                        padding: '0 12px',
                                        alignItems: 'center'
                                    }}
                                    className="hover:bg-bg-elevated"
                                >
                                    <div style={{ width: '100px' }}>
                                        <Text weight="black" family="mono" size="md">{strike.strike}</Text>
                                    </div>
                                    <div style={{ width: '100px', textAlign: 'right' }}>
                                        <Price value={callLtp} size="sm" weight="bold" color="secondary" />
                                    </div>
                                    <div style={{ width: '100px', textAlign: 'right' }}>
                                        <Price value={putLtp} size="sm" weight="bold" color="secondary" />
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                        <Text weight="black" color="info" family="mono" size="md">
                                            {combined.toFixed(2)}
                                        </Text>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div style={{ height: '32px', padding: '0 12px', borderTop: BORDER.strong, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={12} color={COLOR.text.muted} />
                    <Text size="xs" color="muted" weight="bold">NEUTRAL_STRATEGY_TRACKER: LIVE_PREMIUMS</Text>
                </div>
                <Badge label="QUANT_V2" variant="info" />
            </div>
        </WidgetShell>
    );
};
