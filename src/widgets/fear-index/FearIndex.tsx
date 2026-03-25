import React, { useMemo } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { normalise } from '../../utils/normalise';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { TrendingDown, TrendingUp, Info, Activity } from 'lucide-react';

interface FearInputs {
  indiaVIX: number;
  cboeVIX: number;
  yieldSpread: number;
  btcChange24h: number;
  goldChange7d: number;
  usdInrChange: number;
}

const FearIndex: React.FC = () => {
    // Mocking API inputs for now as fetching from 6 sources needs aggregation
    const inputs: FearInputs = {
        indiaVIX: 14.5,
        cboeVIX: 18.2,
        yieldSpread: -0.2,
        btcChange24h: -2.5,
        goldChange7d: 1.2,
        usdInrChange: 0.1,
    };

    const components = useMemo(() => ({
        indiaVIX: normalise(inputs.indiaVIX, 10, 40, true),
        cboeVIX: normalise(inputs.cboeVIX, 10, 40, true),
        yieldCurve: normalise(inputs.yieldSpread, -1, 2, false),
        btcMomentum: normalise(inputs.btcChange24h, -10, 10, false),
        goldRatio: normalise(inputs.goldChange7d, -3, 3, true),
        usdInr: normalise(inputs.usdInrChange, -1, 1, true)
    }), [inputs]);

    const score = Object.values(components).reduce((a, b) => a + b) / 6;

    const getStatus = (s: number) => {
        if (s < 30) return { label: 'EXTREME FEAR', color: '#EF4444' };
        if (s < 45) return { label: 'FEAR', color: '#F87171' };
        if (s < 60) return { label: 'NEUTRAL', color: '#FBBF24' };
        if (s < 80) return { label: 'GREED', color: '#10B981' };
        return { label: 'EXTREME GREED', color: '#059669' };
    };

    const status = getStatus(score);

    // Mock history for sparkline
    const mockHistory = Array.from({ length: 7 }, (_, i) => ({
        val: score + (Math.random() * 10 - 5)
    }));

    return (
        <div className="h-full flex flex-col p-4 bg-[#050505] overflow-y-auto overflow-x-hidden custom-scrollbar">
            {/* Gauge SVG */}
            <div className="relative w-full aspect-video flex items-center justify-center -mb-4">
                <svg viewBox="0 0 100 55" className="w-[85%] overflow-visible group">
                    {/* Background Arc */}
                    <path 
                        d="M10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke="#111" 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                    />
                    {/* Gradient Arc */}
                    <path 
                        d="M10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke="url(#fearGradient)" 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        strokeDasharray={`${(score / 100) * 125.6} 125.6`}
                        className="transition-[stroke-dasharray] duration-1000 ease-out"
                    />
                    <defs>
                        <linearGradient id="fearGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#EF4444" />
                            <stop offset="50%" stopColor="#FBBF24" />
                            <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                    </defs>
                    {/* Needle */}
                    <g 
                        className="transition-transform duration-1000 ease-out origin-center"
                        style={{ 
                            transform: `rotate(${(score / 100) * 180 - 90}deg)`,
                            transformOrigin: '50px 50px'
                        }}
                    >
                        <line x1="50" y1="50" x2="15" y2="50" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="2.5" fill="#FFF" />
                    </g>
                </svg>
                
                {/* Score Text Overlay */}
                <div className="absolute top-[45%] text-center left-1/2 -translate-x-1/2 group-hover:scale-105 transition-transform">
                    <div className="text-3xl font-extrabold text-white tracking-tighter tabular-nums leading-none mb-1">
                        {Math.round(score)}
                    </div>
                    <div className="text-[9px] font-bold tracking-widest text-[#FFF] uppercase bg-black/40 px-2 py-0.5 rounded-full border border-white/10" style={{ color: status.color }}>
                        {status.label}
                    </div>
                </div>
            </div>

            {/* Component Breakdown */}
            <div className="space-y-3 mt-4">
                {Object.entries(components).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-1.5 p-2 px-1 hover:bg-[#111] rounded transition-colors border border-transparent hover:border-[#222]">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-text-muted font-bold tracking-wide uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-[10px] text-text-primary font-bold tabular-nums">{Math.round(val)}%</span>
                        </div>
                        <div className="h-0.5 bg-[#111] rounded-full overflow-hidden w-full relative">
                            <div 
                                className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out bg-[#3B82F6]"
                                style={{ 
                                    width: `${val}%`, 
                                    backgroundColor: getStatus(val).color,
                                    opacity: 0.8
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Sparkline Overlay */}
            <div className="mt-6 pt-4 border-t border-[#111] h-12 relative">
                <div className="absolute -top-1 right-0 text-[8px] font-bold text-text-muted bg-black px-1 leading-none uppercase tracking-widest">
                    Last 7 Days
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockHistory}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={status.color} stopOpacity={0.1}/>
                                <stop offset="95%" stopColor={status.color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area 
                            type="monotone" 
                            dataKey="val" 
                            stroke={status.color} 
                            strokeWidth={1.5} 
                            fillOpacity={1} 
                            fill="url(#colorVal)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FearIndex;
