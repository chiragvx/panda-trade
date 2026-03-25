import React, { useState, useEffect } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { Plane, AlertTriangle, MapPin, Navigation, History, Plus, CornerDownRight, ShieldAlert, Zap } from 'lucide-react';

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
    // OpenSky API integration: https://opensky-network.org/api/states/all?lamin=8&lomin=68&lamax=37&lomax=97
    // Mocking for seed list
    const [trackedJets, setTrackedJets] = useState<Aircraft[]>([
        { company: 'Adani Group', tail: 'VT-ANL', icao24: '800b3e', lastLocation: 'AMD', lastFlight: '2h ago', status: 'grounded' },
        { company: 'Reliance Industries', tail: 'VT-BRS', icao24: '800531', lastLocation: 'BOM', lastFlight: '14h ago', status: 'grounded' },
        { company: 'Tata Sons', tail: 'VT-TTC', icao24: '8009c2', lastLocation: 'DEL', lastFlight: '6h ago', status: 'grounded' },
    ]);

    const [alertJet, setAlertJet] = useState<Aircraft | null>(null);

    useEffect(() => {
        // Simulate real-time airborne detection for demonstration
        const timer = setTimeout(() => {
            setTrackedJets(prev => {
                const updated = [...prev];
                updated[0] = { ...updated[0], status: 'airborne', origin: 'AMD', destination: 'DEL', lastLocation: 'Over Rajasthan' };
                return updated;
            });
            setAlertJet(trackedJets[0]);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="h-full flex flex-col bg-[#050505]">
            {/* Header / Alerts Area */}
            {alertJet && (
                <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 animate-in slide-in-from-top duration-500 flex items-center gap-3">
                    <div className="bg-amber-500/30 p-2 rounded-lg">
                        <ShieldAlert size={16} className="text-amber-500 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Unscheduled Flight Detected</span>
                        <div className="text-[11px] font-bold text-white flex items-center gap-2 mt-0.5">
                            {alertJet.company} jet departing {alertJet.origin} <CornerDownRight size={10} className="inline rotate-[270deg]" /> {alertJet.destination}
                        </div>
                    </div>
                </div>
            )}

            {/* List Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#888]">Institutional Aircraft Traffic</span>
                     <button className="flex items-center gap-1.5 px-2 py-1 bg-[#111] border border-[#222] rounded hover:border-[#444] transition-all text-[#666] hover:text-white text-[9px] font-bold uppercase">
                        <Plus size={10} /> Add ICAO
                     </button>
                </div>

                {trackedJets.map((jet, idx) => (
                    <div 
                        key={idx} 
                        className={`p-4 rounded-xl border transition-all ${jet.status === 'airborne' ? 'bg-gradient-to-br from-blue-500/10 to-[#0A0A0A] border-blue-500/30 ring-1 ring-blue-500/10' : 'bg-[#0A0A0A] border-[#1A1A1A] hover:border-[#333]'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-[#888] uppercase tracking-widest leading-none mb-2">{jet.company}</span>
                                <div className="flex items-center gap-2">
                                     <span className="text-sm font-black text-white italic">{jet.tail}</span>
                                     <span className="text-[9px] font-medium text-[#444] bg-[#111] px-1.5 py-0.5 rounded border border-white/5">{jet.icao24}</span>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ring-1 ${jet.status === 'airborne' ? 'bg-blue-500/20 text-blue-400 ring-blue-500/30 animate-pulse' : 'bg-[#141414] text-[#444] ring-[#222]'}`}>
                                <Zap size={10} className={jet.status === 'airborne' ? 'fill-blue-400' : ''} />
                                {jet.status}
                            </div>
                        </div>

                        {jet.status === 'airborne' ? (
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5 group overflow-hidden relative">
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-black text-white">{jet.origin}</span>
                                        <span className="text-[9px] font-bold text-text-muted uppercase">Home Base</span>
                                    </div>
                                    <div className="flex-1 px-4 relative flex items-center justify-center">
                                         <div className="w-full h-[1px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-blue-500/10 relative">
                                            <Plane size={14} className="absolute left-1/2 -top-[6.5px] -translate-x-1/2 text-blue-400 rotate-90" />
                                         </div>
                                    </div>
                                    <div className="text-right flex flex-col gap-1">
                                        <span className="text-[11px] font-black text-white">{jet.destination || '???'}</span>
                                        <span className="text-[9px] font-bold text-text-muted uppercase">ETA ???</span>
                                    </div>
                                </div>
                                {/* Track mini line decoration */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#0A0A0A_70%)] opacity-30 pointer-events-none" />
                            </div>
                        ) : (
                            <div className="flex justify-between items-center text-[10px] font-medium text-text-secondary bg-black/20 p-2.5 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2">
                                    <MapPin size={12} className="text-[#444]" />
                                    <span>Last at <span className="text-white font-bold">{jet.lastLocation}</span></span>
                                </div>
                                <span className="text-[#444] font-bold uppercase tracking-tighter">Updated {jet.lastFlight}</span>
                            </div>
                        )}

                        {/* Recent History Toggle (Simulated) */}
                        <div className="mt-4 flex justify-between items-center">
                            <button className="text-[9px] font-black text-[#555] hover:text-white transition-colors uppercase tracking-[0.2em] flex items-center gap-1">
                                <History size={11} /> View Hist. (14)
                            </button>
                            <button className="text-[9px] font-black text-blue-500/80 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-1 group">
                                Deep Scan <Navigation size={10} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JetTracker;
