import React from 'react';
import { useOIGraphData } from '../../hooks/useOIGraphData';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { EmptyState } from '../../ds/components/EmptyState';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart2, Info, Search, Filter, Hash } from 'lucide-react';
import { useUpstoxStore } from '../../store/useUpstoxStore';

export const OIGraphWidget: React.FC = () => {
    const [localSymbol, setLocalSymbol] = React.useState<{ instrument_key: string, ticker: string } | null>(null);
    const { data, isLoading, expiries, selectedExpiry, setSelectedExpiry, stats, symbol } = useOIGraphData(localSymbol || undefined);
    const { setInstrumentMeta } = useUpstoxStore();

    if (!symbol) {
        return (
            <WidgetShell>
                <EmptyState 
                    icon={<Search size={32} />}
                    message="SELECT_INSTRUMENT"
                    subMessage="Choose an F&O enabled symbol to view Open Interest distribution."
                />
            </WidgetShell>
        );
    }

    return (
        <WidgetShell>
            <WidgetShell.Toolbar style={{ height: 'auto', padding: '8px 12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={14} style={{ color: COLOR.semantic.info }} />
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: '0.1em' }}>OI_DISTRIBUTION: {symbol}</span>
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
                            outline: 'none',
                            borderRadius: '2px'
                        }}
                    >
                        {expiries.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                    </select>
                </div>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, padding: SPACE[4], display: 'flex', flexDirection: 'column' }}>
                {stats && (
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: COLOR.bg.surface, padding: '12px', border: BORDER.standard }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted }}>TOTAL CALL OI</span>
                            <span style={{ fontSize: '14px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.down, fontFamily: TYPE.family.mono }}>{stats.totalCallOI.toLocaleString()}</span>
                        </div>
                        <div style={{ width: '1px', background: BORDER.standard }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted }}>TOTAL PUT OI</span>
                            <span style={{ fontSize: '14px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.up, fontFamily: TYPE.family.mono }}>{stats.totalPutOI.toLocaleString()}</span>
                        </div>
                        <div style={{ width: '1px', background: BORDER.standard }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted }}>OVERALL PCR</span>
                            <span style={{ fontSize: '14px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary, fontFamily: TYPE.family.mono }}>{stats.pcr.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLOR.bg.elevated} vertical={false} />
                            <XAxis 
                                dataKey="strike" 
                                stroke={COLOR.text.muted} 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                angle={-45}
                                textAnchor="end"
                                height={40}
                            />
                            <YAxis 
                                hide 
                                stroke={COLOR.text.muted} 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <Tooltip 
                                cursor={{ fill: COLOR.bg.elevated, opacity: 0.4 }}
                                contentStyle={{ 
                                    backgroundColor: COLOR.bg.surface, 
                                    border: BORDER.standard,
                                    fontSize: '10px',
                                    borderRadius: 0,
                                    fontFamily: TYPE.family.mono
                                }}
                                itemStyle={{ padding: 0 }}
                            />
                            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                            <Bar name="CALL OI" dataKey="callOI" fill={COLOR.semantic.down} opacity={0.8} />
                            <Bar name="PUT OI" dataKey="putOI" fill={COLOR.semantic.up} opacity={0.8} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={11} style={{ color: COLOR.text.muted }} />
                    <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>OI_SNAPSHOT: LATEST_EXPIRY</span>
                </div>
                <span style={{ fontSize: '8px', fontWeight: TYPE.weight.black, color: COLOR.semantic.info }}>ANALYTICS ENGINE V2</span>
            </div>
        </WidgetShell>
    );
};
