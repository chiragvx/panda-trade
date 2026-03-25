import React, { useState, useEffect } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { useGlobalStore } from '../../store/globalStore';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Zap, Plus, Info, ChevronRight, TrendingUp, Search, Clock, ShieldCheck } from 'lucide-react';

interface Setup {
  symbol: string;
  sector: string;
  score: number;
  reasons: string[];
  price: number;
  change1d: number;
  delivery: number;
  history: { val: number }[];
}

const AccumulationScreener: React.FC = () => {
  const { addToWatchlist, watchlist } = useGlobalStore();
  const [lastScanTime, setLastScanTime] = useState<string>('09:25:14 IST');
  const [isScanning, setIsScanning] = useState(false);

  // Mock scan results
  const [setups, setSetups] = useState<Setup[]>([
    {
      symbol: 'TATASTEEL',
      sector: 'Steel',
      score: 92,
      reasons: ['Delivery 71% vs 42% avg', 'Volume 2.1× norm', 'No filings in 8 days'],
      price: 148.5,
      change1d: 0.2,
      delivery: 71.4,
      history: Array.from({ length: 15 }, () => ({ val: 145 + Math.random() * 5 }))
    },
    {
      symbol: 'SBIN',
      sector: 'Banks',
      score: 88,
      reasons: ['Price consolidated 1.2% range', 'Delivery 64%', 'Large blocks detected'],
      price: 752.4,
      change1d: -0.1,
      delivery: 64.8,
      history: Array.from({ length: 15 }, () => ({ val: 740 + Math.random() * 20 }))
    },
    {
      symbol: 'WIPRO',
      sector: 'IT',
      score: 85,
      reasons: ['Multiple green volume bars', 'Retail exit signal', 'No filings (5d)'],
      price: 482.1,
      change1d: 0.5,
      delivery: 62.5,
      history: Array.from({ length: 15 }, () => ({ val: 470 + Math.random() * 15 }))
    }
  ]);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScanTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      {/* Header with Scan Status */}
      <div className="p-4 border-b border-[#111] bg-[#0A0A0A] flex justify-between items-center sticky top-0 z-10">
        <div className="flex flex-col">
           <div className="flex items-center gap-2 mb-0.5">
              <ShieldCheck size={14} className="text-green-500" />
              <span className="text-[10px] font-black tracking-[0.2em] text-[#AAA] uppercase">Quant Screener</span>
           </div>
           <div className="text-[9px] text-text-muted font-mono">LAST SCAN: {lastScanTime}</div>
        </div>
        <button 
          onClick={runScan}
          disabled={isScanning}
          className="flex items-center gap-2 bg-accent-info hover:bg-accent-info/80 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {isScanning ? <Clock size={12} className="animate-spin" /> : <Search size={12} />}
          {isScanning ? 'SCANNING...' : 'RE-SCAN'}
        </button>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {setups.map((setup, idx) => (
          <div 
            key={idx} 
            className="group relative bg-gradient-to-br from-[#0A0A0A] to-[#040404] border border-[#1A1A1A] hover:border-accent-info/30 rounded-xl overflow-hidden shadow-lg transition-all p-4"
          >
            {/* Top Row: Symbol & Score */}
            <div className="flex justify-between items-start mb-4">
               <div className="flex flex-col">
                  <span className="text-lg font-black text-white italic group-hover:text-accent-info transition-colors leading-none">{setup.symbol}</span>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1.5">{setup.sector}</span>
               </div>
               
               {/* Score Gauge (Circle) */}
               <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                     <circle cx="20" cy="20" r="18" fill="none" stroke="#111" strokeWidth="2.5" />
                     <circle 
                        cx="20" cy="20" r="18" 
                        fill="none" 
                        stroke="#3B82F6" 
                        strokeWidth="2.5" 
                        strokeDasharray={`${(setup.score / 100) * 113} 113`}
                        strokeLinecap="round"
                     />
                  </svg>
                  <span className="absolute text-[10px] font-black text-white tabular-nums">{setup.score}</span>
               </div>
            </div>

            {/* Middle Row: Stats & Sparkline */}
            <div className="grid grid-cols-2 gap-4 items-center mb-4">
               <div className="space-y-2">
                  <div className="flex justify-between items-center bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                     <span className="text-[9px] font-bold text-text-muted">DELIVERY</span>
                     <span className="text-[10px] font-black text-green-500">{setup.delivery}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                     <span className="text-[9px] font-bold text-text-muted">LTP</span>
                     <span className="text-[10px] font-black text-white">₹{setup.price}</span>
                  </div>
               </div>
               <div className="h-10 w-full opacity-60">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={setup.history}>
                     <Area type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={1.5} fill="transparent" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Reasons List */}
            <div className="space-y-1.5 mb-4">
               {setup.reasons.map((reason, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-medium text-text-secondary bg-[#111] px-2 py-1 rounded border border-white/5">
                     <Zap size={10} className="text-amber-500 shrink-0" />
                     {reason}
                  </div>
               ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-[#111] pt-3 mt-1">
               <button 
                onClick={() => addToWatchlist(setup.symbol)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-black transition-all ${watchlist.includes(setup.symbol) ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-[#141414] text-text-muted border border-[#222] hover:bg-[#1A1A1A] hover:text-white hover:border-[#333]'}`}
               >
                  {watchlist.includes(setup.symbol) ? <ShieldCheck size={12} /> : <Plus size={12} />}
                  {watchlist.includes(setup.symbol) ? 'WATCHING' : 'WATCHLIST'}
               </button>
               <button className="px-3 rounded-lg py-1.5 text-[10px] font-black bg-[#141414] text-text-muted border border-[#222] hover:bg-[#1A1A1A] hover:text-white hover:border-[#333] transition-all">
                  CHART
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccumulationScreener;
