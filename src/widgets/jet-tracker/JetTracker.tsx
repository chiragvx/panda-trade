import React, { useMemo, useState } from 'react';
import { Plane, MapPin, Navigation, History, CornerDownRight, ShieldAlert, Zap } from 'lucide-react';
import { useNSEData } from '../../hooks/useNSEData';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { EmptyState } from '../../ds/components/EmptyState';

interface Aircraft {
  company: string;
  tail: string;
  icao24: string;
  lastLocation: string;
  lastFlight: string;
  status: 'airborne' | 'grounded';
  origin?: string;
  destination?: string;
}

const parseJets = (payload: any): Aircraft[] => {
  const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return raw.map((item: any) => ({
    company: String(item.company || 'UNKNOWN'),
    tail: String(item.tail || item.registration || 'N/A'),
    icao24: String(item.icao24 || 'N/A'),
    lastLocation: String(item.lastLocation || '--'),
    lastFlight: String(item.lastFlight || '--'),
    status: item.status === 'airborne' ? 'airborne' : 'grounded',
    origin: item.origin ? String(item.origin) : undefined,
    destination: item.destination ? String(item.destination) : undefined,
  }));
};

const JetTracker: React.FC = () => {
  const { data } = useNSEData<any>('/api/corporate-jets', { pollingInterval: 60 * 1000 });
  const trackedJets = useMemo(() => parseJets(data), [data]);
  const alertJet = trackedJets.find((j) => j.status === 'airborne') || null;
  const [selectedTail, setSelectedTail] = useState<string | null>(null);

  return (
    <WidgetShell>
        <WidgetShell.Toolbar>
            <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>
                INSTITUTIONAL_TRAFFIC_MONITOR
            </span>
        </WidgetShell.Toolbar>

        {alertJet && (
            <div style={{ padding: '10px 12px', background: `${COLOR.semantic.warning}15`, borderBottom: `1px solid ${COLOR.semantic.warning}30`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert size={14} style={{ color: COLOR.semantic.warning }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.warning, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AIRBORNE_JET_DETECTED</span>
                    <div style={{ fontSize: '11px', color: COLOR.text.primary, fontWeight: TYPE.weight.bold, marginTop: '2px' }}>
                        {alertJet.company} DEP {alertJet.origin || '--'} <CornerDownRight size={10} style={{ display: 'inline', transform: 'rotate(270deg)', color: COLOR.text.muted }} /> {alertJet.destination || '--'}
                    </div>
                </div>
            </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
            {trackedJets.length === 0 ? (
                <EmptyState 
                    icon={<Plane size={32} />}
                    message="NO JET TRACKING DATA"
                    subMessage="Waiting for transponder data from active institutional aircraft."
                />
            ) : (
                trackedJets.map((jet, idx) => (
                    <div
                        key={`${jet.tail}-${idx}`}
                        style={{
                            padding: SPACE[4],
                            borderBottom: BORDER.standard,
                            background: jet.status === 'airborne' ? `${COLOR.semantic.info}05` : 'transparent',
                            position: 'relative',
                            cursor: 'pointer'
                        }}
                        onClick={() => setSelectedTail(selectedTail === jet.tail ? null : jet.tail)}
                        className="hover:bg-bg-elevated transition-colors"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: SPACE[3] }}>
                            <div>
                                <span style={{ fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase', fontWeight: TYPE.weight.bold, display: 'block', marginBottom: '2px' }}>{jet.company}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{jet.tail}</span>
                                    <span style={{ fontSize: '8px', color: COLOR.text.muted, border: BORDER.standard, padding: '1px 4px', background: COLOR.bg.elevated }}>{jet.icao24}</span>
                                </div>
                            </div>
                            <div
                                style={{
                                    fontSize: '9px',
                                    fontWeight: TYPE.weight.bold,
                                    color: jet.status === 'airborne' ? COLOR.semantic.info : COLOR.text.muted,
                                    border: BORDER.standard,
                                    padding: '2px 8px',
                                    textTransform: 'uppercase',
                                    background: COLOR.bg.surface
                                }}
                            >
                                <Zap size={8} style={{ display: 'inline', marginRight: '4px', fill: jet.status === 'airborne' ? COLOR.semantic.info : 'none' }} />
                                {jet.status}
                            </div>
                        </div>

                        {jet.status === 'airborne' ? (
                            <div style={{ display: 'flex', alignItems: 'center', background: COLOR.bg.surface, border: BORDER.standard, padding: '12px', marginTop: SPACE[2] }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{jet.origin || '--'}</div>
                                    <div style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>ORIGIN</div>
                                </div>
                                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
                                    <div style={{ width: '100%', height: '1px', background: `linear-gradient(90deg, transparent, ${COLOR.semantic.info}40, transparent)` }} />
                                    <Plane size={12} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)', color: COLOR.semantic.info }} />
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{jet.destination || '--'}</div>
                                    <div style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>DESTINATION</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', background: COLOR.bg.surface, padding: '8px 12px', border: BORDER.standard, marginTop: SPACE[2] }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={10} style={{ color: COLOR.text.muted }} />
                                    <span style={{ color: COLOR.text.secondary, fontSize: '10px' }}>LAST_POS: <span style={{ color: COLOR.text.primary, fontWeight: TYPE.weight.bold }}>{jet.lastLocation}</span></span>
                                </div>
                                <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>{jet.lastFlight}</span>
                            </div>
                        )}

                        {selectedTail === jet.tail && (
                            <div style={{ marginTop: SPACE[4], display: 'flex', justifyContent: 'space-between', borderTop: `1px dashed ${COLOR.bg.border}`, paddingTop: SPACE[3] }}>
                                <button style={{ background: COLOR.bg.elevated, border: BORDER.standard, padding: '4px 10px', color: COLOR.text.muted, fontSize: '9px', fontWeight: TYPE.weight.bold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} className="hover:text-text-primary">
                                    <History size={10} /> VIEW_HISTORY
                                </button>
                                <button style={{ background: COLOR.semantic.info, border: BORDER.standard, padding: '4px 10px', color: COLOR.text.inverse, fontSize: '9px', fontWeight: TYPE.weight.bold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} className="hover:opacity-80">
                                    DEEP_SCAN <Navigation size={10} style={{ transform: 'rotate(90deg)' }} />
                                </button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    </WidgetShell>
  );
};

export default JetTracker;

