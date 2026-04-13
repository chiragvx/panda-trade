import React, { useState } from 'react';
import { useVolatilitySkew } from '../../hooks/useVolatilitySkew';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER, SPACE, Text, Badge, WidgetShell, Select } from '../../ds';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Filter, Info, RefreshCw } from 'lucide-react';
import { NIFTY_50 } from '../../utils/defaultSymbol';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';

export const VolatilitySkew: React.FC = () => {
    const { selectedSymbol: globalSymbol } = useSelectionStore();
    const { setInstrumentMeta } = useUpstoxStore();
    const [localSymbol, setLocalSymbol] = useState<{ instrument_key: string, ticker: string } | null>(null);
    
    const activeSymbol = localSymbol || globalSymbol || NIFTY_50;
    const { data, isLoading, expiries, selectedExpiry, setSelectedExpiry } = useVolatilitySkew(activeSymbol?.instrument_key);

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={14} style={{ color: COLOR.semantic.info }} />
                        <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                            IV_SKEW: {activeSymbol.ticker}
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
                            <Select 
                                value={selectedExpiry}
                                onChange={(e) => setSelectedExpiry(e.target.value)}
                                selectSize="sm"
                            >
                                {expiries.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                            </Select>
                        </div>
                    </div>
                </WidgetShell.Toolbar.Right>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, padding: SPACE[4], display: 'flex', flexDirection: 'column' }}>
                {isLoading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: COLOR.text.muted }}>
                         <RefreshCw size={16} className="animate-spin" />
                         <Text size="sm" weight="bold">GENERATING_VOL_SMILE...</Text>
                    </div>
                ) : (
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.bg.elevated} vertical={false} />
                                <XAxis 
                                    dataKey="strike" 
                                    stroke={COLOR.text.muted} 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis 
                                    stroke={COLOR.text.muted} 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                    cursor={{ stroke: COLOR.bg.border, strokeWidth: 1 }}
                                    contentStyle={{ 
                                        backgroundColor: COLOR.bg.surface, 
                                        border: BORDER.standard,
                                        fontSize: TYPE.size.xs,
                                        borderRadius: 0,
                                        fontFamily: TYPE.family.mono,
                                        padding: '8px'
                                    }}
                                    itemStyle={{ padding: '0px' }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    height={36} 
                                    wrapperStyle={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, letterSpacing: '0.05em' }} 
                                />
                                <Line name="CALL IV" type="monotone" dataKey="callIV" stroke={COLOR.semantic.down} dot={false} strokeWidth={2} />
                                <Line name="PUT IV" type="monotone" dataKey="putIV" stroke={COLOR.semantic.up} dot={false} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div style={{ height: '32px', padding: '0 12px', borderTop: BORDER.strong, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Info size={12} color={COLOR.text.muted} />
                   <Text size="xs" color="muted" weight="bold">SMILE_DYNAMICS: LIVE_GREEKS_V2</Text>
               </div>
               <Badge label="ANALYTICS ENGINE V2" variant="info" />
            </div>
        </WidgetShell>
    );
};
