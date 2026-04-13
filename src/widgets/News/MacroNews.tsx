import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettingsStore } from '../../store/useSettingsStore';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { Globe, Calendar, Clock, AlertCircle, RefreshCcw, ExternalLink } from 'lucide-react';

interface EconomicEvent {
  date: string;
  time: string;
  currency: string;
  event: string;
  importance: 'low' | 'medium' | 'high';
  actual: string;
  forecast: string;
  previous: string;
}

export const MacroNews: React.FC = () => {
    const { rapidApiKey } = useSettingsStore();
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMacroData = async () => {
        if (!rapidApiKey) {
            setError('RAPIDAPI_KEY_MISSING');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('https://ultimate-economic-calendar.p.rapidapi.com/v1/calendar', {
                params: {
                    limit: '50',
                    importance: 'medium,high'
                },
                headers: {
                    'X-RapidAPI-Key': rapidApiKey,
                    'X-RapidAPI-Host': 'ultimate-economic-calendar.p.rapidapi.com'
                }
            });

            if (Array.isArray(response.data)) {
                setEvents(response.data);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                setEvents(response.data.data);
            }
        } catch (err: any) {
            console.error('Macro News fetch failed:', err);
            setError(err.response?.data?.message || 'API_FETCH_ERROR');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMacroData();
    }, [rapidApiKey]);

    const getImportanceColor = (imp: string) => {
        switch (imp.toLowerCase()) {
            case 'high': return COLOR.semantic.down;
            case 'medium': return COLOR.semantic.warning;
            default: return COLOR.text.muted;
        }
    };

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Globe size={14} color={COLOR.semantic.info} />
                    <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps }}>GLOBAL_MACRO_INTEL</span>
                </div>
                <button 
                    onClick={fetchMacroData}
                    disabled={isLoading}
                    style={{ background: 'transparent', border: 'none', color: COLOR.text.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    <RefreshCcw size={12} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: COLOR.bg.base }}>
                {!rapidApiKey ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px' }}>
                        <AlertCircle size={32} color={COLOR.text.muted} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps }}>RAPIDAPI_AUTH_REQUIRED</div>
                            <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, marginTop: '4px', fontWeight: TYPE.weight.bold }}>Please configure the key in API Settings to enable Macro feed.</div>
                        </div>
                    </div>
                ) : isLoading && events.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>LOADING_INTELLIGENCE...</span>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scrollbar">
                        {events.map((ev, idx) => (
                            <div key={idx} style={{ 
                                padding: '12px', 
                                borderBottom: BORDER.standard,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ 
                                            padding: '2px 6px', 
                                            background: getImportanceColor(ev.importance) + '20',
                                            border: `1px solid ${getImportanceColor(ev.importance)}40`,
                                            borderRadius: '2px',
                                            fontSize: TYPE.size.xs,
                                            fontWeight: TYPE.weight.black,
                                            color: getImportanceColor(ev.importance)
                                        }}>
                                            {ev.importance.toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary }}>{ev.event}</span>
                                    </div>
                                    <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>{ev.time}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', fontSize: TYPE.size.xs, marginTop: '4px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>CURR</span>
                                        <span style={{ color: COLOR.text.secondary, fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono }}>{ev.currency}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>ACTUAL</span>
                                        <span style={{ color: ev.actual ? COLOR.text.primary : COLOR.text.muted, fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono }}>{ev.actual || '---'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>FORECAST</span>
                                        <span style={{ color: COLOR.text.secondary, fontWeight: TYPE.weight.bold, fontFamily: TYPE.family.mono }}>{ev.forecast || '---'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>PREVIOUS</span>
                                        <span style={{ color: COLOR.text.secondary, fontWeight: TYPE.weight.bold, fontFamily: TYPE.family.mono }}>{ev.previous || '---'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ padding: '8px 12px', borderTop: BORDER.standard, background: COLOR.bg.elevated, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>POWERED BY RAPIDAPI</span>
                <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.semantic.info, letterSpacing: TYPE.letterSpacing.caps }}>MACRO_STREAM: LIVE</span>
            </div>
        </WidgetShell>
    );
};
