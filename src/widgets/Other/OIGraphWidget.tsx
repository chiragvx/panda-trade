import React from 'react';
import { useOIGraphData } from '../../hooks/useOIGraphData';
import { COLOR, TYPE, BORDER, SPACE, Text, Badge, WidgetShell, Select } from '../../ds';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart2, Info, RefreshCw, Filter } from 'lucide-react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';

export const OIGraphWidget: React.FC = () => {
    const [localSymbol, setLocalSymbol] = React.useState<{ instrument_key: string, ticker: string } | null>(null);
    const { data, isLoading, expiries, selectedExpiry, setSelectedExpiry, stats, symbol } = useOIGraphData(localSymbol || undefined);
    const { setInstrumentMeta } = useUpstoxStore();

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={14} style={{ color: COLOR.semantic.info }} />
                        <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                            OI_DISTRIBUTION: {symbol || 'NONE'}
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
                {stats && (
                    <div style={{ display: 'flex', gap: SPACE[4], marginBottom: SPACE[4], background: COLOR.bg.surface, padding: SPACE[3], border: BORDER.standard }}>
                        <div style={{ flex: 1 }}>
                            <Text size="xs" weight="black" color="muted" block>TOTAL CALL OI</Text>
                            <Text size="lg" weight="black" color="down" family="mono">{stats.totalCallOI.toLocaleString()}</Text>
                        </div>
                        <div style={{ width: '1px', background: COLOR.bg.border }} />
                        <div style={{ flex: 1 }}>
                            <Text size="xs" weight="black" color="muted" block>TOTAL PUT OI</Text>
                            <Text size="lg" weight="black" color="up" family="mono">{stats.totalPutOI.toLocaleString()}</Text>
                        </div>
                        <div style={{ width: '1px', background: COLOR.bg.border }} />
                        <div style={{ flex: 1 }}>
                            <Text size="xs" weight="black" color="muted" block>OVERALL PCR</Text>
                            <Text size="lg" weight="black" color="primary" family="mono">{stats.pcr.toFixed(2)}</Text>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, minHeight: 0 }}>
                    {isLoading ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <RefreshCw size={24} className="animate-spin" color={COLOR.text.muted} />
                            <Text weight="bold" size="sm" color="muted">LOAD_OI_STRIKES...</Text>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.bg.elevated} vertical={false} />
                                <XAxis 
                                    dataKey="strike" 
                                    stroke={COLOR.text.muted} 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis hide domain={[0, 'auto']} />
                                <Tooltip 
                                    cursor={{ fill: COLOR.bg.elevated, opacity: 0.4 }}
                                    contentStyle={{ 
                                        backgroundColor: COLOR.bg.surface, 
                                        border: BORDER.standard,
                                        fontSize: TYPE.size.xs,
                                        borderRadius: 0,
                                        fontFamily: TYPE.family.mono
                                    }}
                                />
                                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black }} />
                                <Bar name="CALL OI" dataKey="callOI" fill={COLOR.semantic.down} opacity={0.8} />
                                <Bar name="PUT OI" dataKey="putOI" fill={COLOR.semantic.up} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div style={{ height: '32px', padding: '0 12px', borderTop: BORDER.strong, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={12} color={COLOR.text.muted} />
                    <Text size="xs" color="muted" weight="bold">OI_SNAPSHOT: LATEST_EXPIRY_SKEW</Text>
                </div>
                <Badge label="ANALYTICS ENGINE V2" variant="info" />
            </div>
        </WidgetShell>
    );
};
