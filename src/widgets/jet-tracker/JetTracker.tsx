import React, { useState, useEffect } from 'react';
import { Plane, MapPin, Navigation, History, Plus, CornerDownRight, ShieldAlert, Zap } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

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

const JetTracker: React.FC = () => {
    const [trackedJets, setTrackedJets] = useState<Aircraft[]>([
        { company: 'ADANI_GROUP', tail: 'VT-ANL', icao24: '800B3E', lastLocation: 'AMD', lastFlight: '2H AGO', status: 'grounded' },
        { company: 'RELIANCE_IND', tail: 'VT-BRS', icao24: '800531', lastLocation: 'BOM', lastFlight: '14H AGO', status: 'grounded' },
        { company: 'TATA_SONS', tail: 'VT-TTC', icao24: '8009C2', lastLocation: 'DEL', lastFlight: '6H AGO', status: 'grounded' },
    ]);

    const [alertJet, setAlertJet] = useState<Aircraft | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTrackedJets(prev => {
                const updated = [...prev];
                updated[0] = { ...updated[0], status: 'airborne', origin: 'AMD', destination: 'DEL', lastLocation: 'OVER RAJASTHAN' };
                return updated;
            });
            setAlertJet({ company: 'ADANI_GROUP', tail: 'VT-ANL', icao24: '800B3E', lastLocation: 'OVER RAJASTHAN', lastFlight: 'NOW', status: 'airborne', origin: 'AMD', destination: 'DEL' });
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, fontFamily: TYPE.family.mono }}>
            {/* Alerts */}
            {alertJet && (
                <div style={{ padding: '8px 12px', background: `${COLOR.semantic.warning}20`, borderBottom: `1px solid ${COLOR.semantic.warning}40`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldAlert size={14} style={{ color: COLOR.semantic.warning }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.warning, textTransform: 'uppercase' }}>UNSCHEDULED_DEPARTURE_DETECTED</span>
                        <div style={{ fontSize: '10px', color: COLOR.text.primary, fontWeight: TYPE.weight.bold, marginTop: '2px' }}>
                            {alertJet.company} DEP {alertJet.origin} <CornerDownRight size={10} style={{ display: 'inline', transform: 'rotate(270deg)' }} /> {alertJet.destination}
                        </div>
                    </div>
                </div>
            )}

            {/* Content list */}
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLOR.bg.surface }}>
                     <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>INSTITUTIONAL_TRAFFIC_MONITOR</span>
                     <button style={{ background: COLOR.bg.elevated, border: BORDER.standard, color: COLOR.text.secondary, fontSize: '8px', fontWeight: TYPE.weight.bold, padding: '2px 8px', cursor: 'pointer' }}>
                        + ICAO_REG
                     </button>
                </div>

                {trackedJets.map((jet, idx) => (
                    <div 
                        key={idx} 
                        style={{ 
                            padding: SPACE[4], 
                            borderBottom: BORDER.standard, 
                            background: jet.status === 'airborne' ? `${COLOR.semantic.info}05` : 'transparent',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: SPACE[4] }}>
                            <div>
                                <span style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{jet.company}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <span style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{jet.tail}</span>
                                     <span style={{ fontSize: '8px', color: COLOR.text.muted, border: BORDER.standard, padding: '1px 4px', background: COLOR.bg.elevated }}>{jet.icao24}</span>
                                </div>
                            </div>
                            <div style={{ 
                                fontSize: '8px', 
                                fontWeight: TYPE.weight.bold, 
                                color: jet.status === 'airborne' ? COLOR.semantic.info : COLOR.text.muted,
                                border: `1px solid ${jet.status === 'airborne' ? COLOR.semantic.info : COLOR.bg.border }`,
                                padding: '2px 8px',
                                textTransform: 'uppercase'
                            }}>
                                <Zap size={8} style={{ display: 'inline', marginRight: '4px', fill: jet.status === 'airborne' ? COLOR.semantic.info : 'none' }} />
                                {jet.status}
                            </div>
                        </div>

                        {jet.status === 'airborne' ? (
                            <div style={{ display: 'flex', alignItems: 'center', background: COLOR.bg.surface, border: BORDER.standard, padding: '12px' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{jet.origin}</div>
                                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>ORIGIN</div>
                                </div>
                                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
                                     <div style={{ width: '100%', height: '1px', background: `linear-gradient(90deg, transparent, ${COLOR.semantic.info}40, transparent)` }} />
                                     <Plane size={12} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)', color: COLOR.semantic.info }} />
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{jet.destination || '??'}</div>
                                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>DEST_ETA_??</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', background: COLOR.bg.surface, padding: '8px 12px', border: BORDER.standard }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={10} style={{ color: COLOR.text.muted }} />
                                    <span style={{ color: COLOR.text.secondary }}>LAST_POS: <span style={{ color: COLOR.text.primary, fontWeight: TYPE.weight.bold }}>{jet.lastLocation}</span></span>
                                </div>
                                <span style={{ fontSize: '8px', color: COLOR.text.muted }}>{jet.lastFlight}</span>
                            </div>
                        )}

                        <div style={{ marginTop: SPACE[4], display: 'flex', justifyContent: 'space-between' }}>
                            <button style={{ background: 'none', border: 'none', color: COLOR.text.muted, fontSize: '9px', fontWeight: TYPE.weight.bold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} className="hover:text-text-primary">
                                <History size={10} /> VIEW_HISTORY
                            </button>
                            <button style={{ background: 'none', border: 'none', color: COLOR.semantic.info, fontSize: '9px', fontWeight: TYPE.weight.bold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} className="hover:opacity-80">
                                DEEP_SCAN <Navigation size={10} style={{ transform: 'rotate(90deg)' }} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JetTracker;
