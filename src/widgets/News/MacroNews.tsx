import React, { useState, useEffect, useMemo } from 'react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { Calendar, Info, Activity, Search, Filter, RefreshCw, AlertCircle, Globe, TrendingUp } from 'lucide-react';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { SegmentedControl } from '../../ds/components/SegmentedControl';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Badge, Text } from '../../ds';
import axios from 'axios';

interface EconomicEvent {
    id: string;
    title: string;
    country: string;
    date: string; // ISO
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    actual: string | null;
    forecast: string | null;
    previous: string | null;
    unit: string;
}

const IMPACT_COLORS = {
    HIGH: COLOR.semantic.down,
    MEDIUM: COLOR.semantic.warning,
    LOW: COLOR.semantic.info
};

export const EconomicCalendar: React.FC = () => {
    const { rapidApiKey } = useSettingsStore();
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [search, setSearch] = useState('');
    const [minImpact, setMinImpact] = useState<'ALL' | 'MEDIUM' | 'HIGH'>('ALL');

    const fetchCalendar = async () => {
        if (!rapidApiKey) {
            // Provide high-quality mock data if no key
            setEvents(MOCK_EVENTS);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/macro/events', {
                headers: {
                    'X-RapidAPI-Key': rapidApiKey,
                    'X-RapidAPI-Host': 'ultimate-economic-calendar.p.rapidapi.com'
                },
                params: {
                    limit: 50,
                    order: 'asc'
                }
            });

            if (response.data && Array.isArray(response.data)) {
                setEvents(response.data.map((e: any) => ({
                    id: e.id || Math.random().toString(),
                    title: e.event || e.title,
                    country: e.country,
                    date: e.date,
                    impact: (e.impact || 'LOW').toUpperCase() as any,
                    actual: e.actual,
                    forecast: e.forecast,
                    previous: e.previous,
                    unit: e.unit || ''
                })));
            }
        } catch (err) {
            setError('FAILED_TO_LOAD_LIVE_DATA');
            setEvents(MOCK_EVENTS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendar();
    }, [rapidApiKey]);

    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                                 e.country.toLowerCase().includes(search.toLowerCase());
            const matchesImpact = minImpact === 'ALL' || 
                                 (minImpact === 'MEDIUM' && (e.impact === 'MEDIUM' || e.impact === 'HIGH')) ||
                                 (minImpact === 'HIGH' && e.impact === 'HIGH');
            
            const eventDate = new Date(e.date);
            const now = new Date();
            const isUpcoming = eventDate >= now;

            if (activeTab === 'upcoming') return isUpcoming && matchesSearch && matchesImpact;
            if (activeTab === 'past') return !isUpcoming && matchesSearch && matchesImpact;
            if (activeTab === 'high') return e.impact === 'HIGH' && matchesSearch && matchesImpact;
            
            return matchesSearch && matchesImpact;
        });
    }, [events, search, minImpact, activeTab]);

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Calendar size={14} color={COLOR.semantic.info} />
                    <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps }}>ECONOMIC_INTEL</span>
                    {loading && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR.semantic.info, animation: 'pulse 1s infinite' }} />}
                    {!rapidApiKey && <Badge label="SANDBOX_MODE" variant="warning" />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
                    <button onClick={fetchCalendar} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }}>
                        <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                </div>
            </WidgetShell.Toolbar>

            <div style={{ background: COLOR.bg.elevated, borderBottom: BORDER.standard, padding: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={12} color={COLOR.text.muted} style={{ position: 'absolute', left: '10px' }} />
                        <input 
                            placeholder="Search regions or events..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%', background: COLOR.bg.base, border: BORDER.standard,
                                borderRadius: '2px', padding: '6px 12px 6px 30px', color: COLOR.text.primary,
                                fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, outline: 'none'
                            }}
                        />
                    </div>
                    <select 
                        value={minImpact}
                        onChange={(e) => setMinImpact(e.target.value as any)}
                        style={{
                            background: COLOR.bg.base, border: BORDER.standard, borderRadius: '2px',
                            padding: '0 8px', color: COLOR.text.muted, fontSize: '10px',
                            fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono, outline: 'none'
                        }}
                    >
                        <option value="ALL">ALL_IMPACT</option>
                        <option value="MEDIUM">MED_HIGH</option>
                        <option value="HIGH">CRITICAL_ONLY</option>
                    </select>
                </div>
                <SegmentedControl 
                    options={[
                        { label: 'Upcoming', value: 'upcoming' },
                        { label: 'Historical', value: 'past' },
                        { label: 'Critical', value: 'high' }
                    ]}
                    value={activeTab}
                    onChange={(v) => setActiveTab(v as any)}
                    style={{ height: '28px' }}
                />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: COLOR.bg.base }} className="custom-scrollbar">
                {filteredEvents.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', opacity: 0.3 }}>
                        <Globe size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
                        <Text weight="black" size="md">NO_DATA_MATCHES</Text>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: COLOR.bg.elevated, zIndex: 1, borderBottom: BORDER.standard }}>
                            <tr>
                                <th style={thStyle}>TIME/REGION</th>
                                <th style={{ ...thStyle, textAlign: 'left' }}>EVENT</th>
                                <th style={thStyle}>ACTUAL</th>
                                <th style={thStyle}>FORECAST</th>
                                <th style={thStyle}>PREVIOUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map(event => (
                                <EventRow key={event.id} event={event} />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ padding: '6px 12px', borderTop: BORDER.standard, background: COLOR.bg.elevated, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={12} color={COLOR.semantic.info} />
                    <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>LIVE_MACRO_STREAM</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: TYPE.weight.black, color: COLOR.text.muted, opacity: 0.5 }}>ULTIMATE_CAL V2.1</span>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
            `}</style>
        </WidgetShell>
    );
};

const EventRow: React.FC<{ event: EconomicEvent }> = ({ event }) => {
    const d = new Date(event.date);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return (
        <tr style={{ borderBottom: BORDER.standard, cursor: 'pointer' }} className="hover-row">
            <td style={tdStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Text size="xs" weight="black" color="primary">{timeStr}</Text>
                    <Text size="xs" color="muted" weight="bold">{dateStr}</Text>
                    <Text size="xs" color="info" weight="black" style={{ marginTop: '2px' }}>{event.country}</Text>
                </div>
            </td>
            <td style={{ ...tdStyle, textAlign: 'left', paddingRight: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '16px', borderRadius: '2px', background: IMPACT_COLORS[event.impact] }} />
                    <Text size="xs" weight="bold" color="primary" style={{ lineHeight: '1.4' }}>{event.title}</Text>
                </div>
            </td>
            <td style={tdStyle}><ValueBox value={event.actual} unit={event.unit} isBold /></td>
            <td style={tdStyle}><ValueBox value={event.forecast} unit={event.unit} color="muted" /></td>
            <td style={tdStyle}><ValueBox value={event.previous} unit={event.unit} color="muted" /></td>
        </tr>
    );
};

const ValueBox: React.FC<{ value: string | null; unit: string; isBold?: boolean; color?: 'primary' | 'muted' }> = ({ value, unit, isBold, color = 'primary' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Text 
            family="mono" 
            size="xs" 
            weight={isBold ? "black" : "bold"} 
            color={value ? (color as any) : "muted"}
        >
            {value || '--'}
        </Text>
        {value && <Text size="xs" color="muted" weight="bold" style={{ opacity: 0.5, fontSize: '8px' }}>{unit}</Text>}
    </div>
);

const thStyle: React.CSSProperties = {
    padding: '8px 4px',
    fontSize: '10px',
    color: COLOR.text.muted,
    fontWeight: TYPE.weight.black,
    letterSpacing: TYPE.letterSpacing.caps,
    textAlign: 'center',
    borderBottom: BORDER.standard
};

const tdStyle: React.CSSProperties = {
    padding: '10px 4px',
    textAlign: 'center',
    verticalAlign: 'middle'
};

const MOCK_EVENTS: EconomicEvent[] = [
    { id: '1', title: 'CPI (YoY) (Mar)', country: 'USA', date: new Date().toISOString(), impact: 'HIGH', actual: null, forecast: '3.2%', previous: '3.1%', unit: '%' },
    { id: '2', title: 'Interest Rate Decision', country: 'EUR', date: new Date(Date.now() + 86400000).toISOString(), impact: 'HIGH', actual: null, forecast: '4.50%', previous: '4.50%', unit: '%' },
    { id: '3', title: 'Initial Jobless Claims', country: 'USA', date: new Date(Date.now() + 3600000 * 2).toISOString(), impact: 'MEDIUM', actual: null, forecast: '210K', previous: '215K', unit: 'K' },
    { id: '4', title: 'Industrial Production (MoM)', country: 'IND', date: new Date(Date.now() - 3600000 * 5).toISOString(), impact: 'MEDIUM', actual: '4.2%', forecast: '3.8%', previous: '3.5%', unit: '%' },
    { id: '5', title: 'Consumer Confidence', country: 'JPN', date: new Date(Date.now() + 3600000 * 12).toISOString(), impact: 'LOW', actual: null, forecast: '38.5', previous: '39.0', unit: 'idx' }
];

export const MacroNews = EconomicCalendar;
