import React, { useState, useEffect, useMemo } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useSelectionStore } from '../../store/useStore';
import { upstoxApi } from '../../services/upstoxApi';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { TrendingUp, Activity, Filter, Info, Search } from 'lucide-react';
import { NIFTY_50 } from '../../utils/defaultSymbol';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const IVChart: React.FC = () => {
    const { selectedSymbol: globalSymbol } = useSelectionStore();
    const { accessToken } = useUpstoxStore();
    const [localSymbol, setLocalSymbol] = useState<any>(null);
    const activeSymbol = localSymbol || globalSymbol || NIFTY_50;

    const [expiries, setExpiries] = useState<string[]>([]);
    const [selectedExpiry, setSelectedExpiry] = useState('');
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!accessToken || !activeSymbol.instrument_key) return;
        const loadExpiries = async () => {
            try {
                const res = await upstoxApi.getExpiries(accessToken, activeSymbol.instrument_key);
                if (res.status === 'success' && Array.isArray(res.data)) {
                    setExpiries(res.data);
                    if (res.data.length > 0) setSelectedExpiry(res.data[0]);
                }
            } catch (err) {
                console.error('Failed to load expiries for IV Chart:', err);
            }
        };
        loadExpiries();
    }, [activeSymbol.instrument_key, accessToken]);

    useEffect(() => {
        if (!accessToken || !activeSymbol.instrument_key || !selectedExpiry) return;
        const loadData = async () => {
            setIsLoading(true);
            try {
                const res = await upstoxApi.getOptionChain(accessToken, activeSymbol.instrument_key, selectedExpiry);
                if (res.status === 'success' && Array.isArray(res.data)) {
                    const processed = res.data.map((item: any) => ({
                        strike: item.strike_price,
                        iv: (item.call_options?.market_data?.iv || item.put_options?.market_data?.iv || 0),
                        type: item.call_options?.market_data?.iv ? 'CALL' : 'PUT'
                    })).filter((d: any) => d.iv > 0)
                      .sort((a: any, b: any) => a.strike - b.strike);
                    setData(processed);
                }
            } catch (err) {
                console.error('Failed to load IV data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [selectedExpiry, activeSymbol.instrument_key, accessToken]);

    const atmStrike = useMemo(() => {
        if (data.length === 0) return null;
        // Logic to find central strike would go here
        return null;
    }, [data]);

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <TrendingUp size={14} style={{ color: COLOR.semantic.info }} />
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: '0.1em' }}>IV_PROFILE: {activeSymbol.ticker}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={10} style={{ color: COLOR.text.muted }} />
                    <select 
                        value={selectedExpiry}
                        onChange={(e) => setSelectedExpiry(e.target.value)}
                        style={{ background: COLOR.bg.elevated, border: BORDER.standard, color: COLOR.text.primary, fontSize: '9px', padding: '2px 4px', outline: 'none' }}
                    >
                        {expiries.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                    </select>
                </div>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, padding: SPACE[4], display: 'flex', flexDirection: 'column', background: '#000' }}>
                {isLoading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>CALCULATING_IV_MESH...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>NO_IV_DATA_DETECTED</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="strike" fontSize={9} stroke="#444" tick={{ fill: '#666' }} />
                            <YAxis fontSize={9} stroke="#444" tick={{ fill: '#666' }} domain={['auto', 'auto']} />
                            <Tooltip 
                                contentStyle={{ background: '#000', border: '1px solid #333', fontSize: '10px', borderRadius: 0 }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="iv" fill={COLOR.semantic.info}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.iv > 40 ? COLOR.semantic.down : COLOR.semantic.info} opacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '8px', color: COLOR.text.muted }}>UPSTOX_V2_INTELLIGENCE</span>
                <span style={{ fontSize: '8px', fontWeight: 'black', color: COLOR.semantic.info }}>IV_LIVE: STABLE</span>
            </div>
        </WidgetShell>
    );
};
