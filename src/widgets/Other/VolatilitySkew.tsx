import React, { useState } from 'react';
import { useVolatilitySkew } from '../../hooks/useVolatilitySkew';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { EmptyState } from '../../ds/components/EmptyState';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Search, Filter, Info } from 'lucide-react';

export const VolatilitySkew: React.FC = () => {
    const { selectedSymbol: globalSymbol } = useSelectionStore();
    const { setInstrumentMeta } = useUpstoxStore();
    const [localSymbol, setLocalSymbol] = useState<{ instrument_key: string, ticker: string } | null>(null);
    
    const activeSymbol = localSymbol || globalSymbol;
    const { data, isLoading, expiries, selectedExpiry, setSelectedExpiry } = useVolatilitySkew(activeSymbol?.instrument_key);

    if (!activeSymbol) {
        return (
            <WidgetShell>
                <EmptyState 
                    icon={<Search size={32} />}
                    message="SELECT_INSTRUMENT"
                    subMessage="Select a symbol to analyze the Implied Volatility skew across strikes."
                />
            </WidgetShell>
        );
    }

    return (
        <WidgetShell>
            <WidgetShell.Toolbar style={{ height: 'auto', padding: '8px 12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} style={{ color: COLOR.semantic.info }} />
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: '0.1em' }}>IV_SKEW: {activeSymbol.ticker}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <WidgetSymbolSearch 
                        onSelect={(res) => {
                            setLocalSymbol({ instrument_key: res.instrumentKey, ticker: res.ticker });
                            setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
                        }} 
                        placeholder="OVERRIDE..." 
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

                <div style={{ flex: 1 }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={10} style={{ color: COLOR.text.muted }} />
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

            <div style={{ flex: 1, padding: SPACE[4], display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLOR.bg.elevated} vertical={false} />
                            <XAxis 
                                dataKey="strike" 
                                stroke={COLOR.text.muted} 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                angle={-45}
                                textAnchor="end"
                            />
                            <YAxis 
                                stroke={COLOR.text.muted} 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                domain={['auto', 'auto']}
                                label={{ value: 'IV %', angle: -90, position: 'insideLeft', style: { fill: COLOR.text.muted, fontSize: '9px' } }}
                            />
                            <Tooltip 
                                cursor={{ stroke: COLOR.bg.border, strokeWidth: 1 }}
                                contentStyle={{ 
                                    backgroundColor: COLOR.bg.surface, 
                                    border: BORDER.standard,
                                    fontSize: '10px',
                                    borderRadius: 0,
                                    fontFamily: TYPE.family.mono
                                }}
                            />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                            <Line name="CALL IV" type="monotone" dataKey="callIV" stroke={COLOR.semantic.down} dot={false} strokeWidth={2} />
                            <Line name="PUT IV" type="monotone" dataKey="putIV" stroke={COLOR.semantic.up} dot={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <Info size={11} style={{ color: COLOR.text.muted }} />
                   <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>SMILE_DYNAMICS: LIVE_GREEKS</span>
               </div>
               <span style={{ fontSize: '8px', fontWeight: TYPE.weight.black, color: COLOR.semantic.info }}>ANALYTICS ENGINE V2</span>
            </div>
        </WidgetShell>
    );
};
