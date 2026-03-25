import React, { useState, useEffect, useMemo } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { useGlobalStore } from '../../store/globalStore';
import { useAlertStore } from '../../store/alertStore';
import { ListFilter, Bell, Volume2, ShieldCheck, ShoppingCart } from 'lucide-react';

interface Deal {
  symbol: string;
  clientName: string;
  type: 'BUY' | 'SELL' | 'B' | 'S';
  quantity: number;
  price: number;
  value: number; // calculated if not present
  timestamp: string;
}

const BlockDealFeed: React.FC = () => {
  const { watchlist } = useGlobalStore();
  const { addAlert } = useAlertStore();
  const [filter, setFilter] = useState<'ALL' | 'WATCHLIST' | 'BUY' | 'SELL'>('ALL');
  const [threshold, setThreshold] = useState(10); // in Crore

  const { data: nseBlockDeals, isLoading: nseBlockLoading } = useNSEData<any>('/api/block-deal', {
    pollingInterval: 60 * 1000,
  });

  const processedDeals = useMemo(() => {
    if (!nseBlockDeals?.data) return [];
    
    return nseBlockDeals.data.map((d: any) => ({
      symbol: d.symbol,
      clientName: d.clientName,
      type: d.buySell === 'Buy' ? 'BUY' : 'SELL',
      quantity: d.quantity,
      price: d.price,
      value: (d.quantity * d.price) / 10000000, // to crore
      timestamp: d.time || new Date().toISOString(),
    })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [nseBlockDeals]);

  // Alert and Chime logic
  useEffect(() => {
    if (processedDeals.length > 0) {
      const topDeal = processedDeals[0];
      const isNew = true; // Simulating newness for now
      const inWatchlist = watchlist.includes(topDeal.symbol);
      
      if (isNew && inWatchlist && topDeal.value > threshold) {
        addAlert({
          symbol: topDeal.symbol,
          type: 'event',
          condition: 'Block Deal',
          value: topDeal.value,
          priority: 'high',
          message: `${topDeal.symbol}: Block deal of ₹${topDeal.value.toFixed(1)}cr by ${topDeal.clientName}`,
        });
        
        // Play Chime
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
      }
    }
  }, [processedDeals, watchlist, threshold, addAlert]);

  const filteredDeals = processedDeals.filter((deal: any) => {
    if (deal.value < threshold) return false;
    if (filter === 'WATCHLIST' && !watchlist.includes(deal.symbol)) return false;
    if (filter === 'BUY' && deal.type !== 'BUY') return false;
    if (filter === 'SELL' && deal.type !== 'SELL') return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      {/* Top Controls */}
      <div className="p-3 border-b border-[#111] flex flex-col gap-2 bg-[#0A0A0A]">
        <div className="flex justify-between items-center gap-2">
           <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
             {['ALL', 'WATCHLIST', 'BUY', 'SELL'].map(f => (
               <button 
                 key={f}
                 onClick={() => setFilter(f as any)}
                 className={`px-2 py-1 text-[10px] rounded border transition-colors ${filter === f ? 'bg-accent-info text-white border-accent-info' : 'border-[#222] text-text-muted hover:border-[#444]'}`}
               >
                 {f}
               </button>
             ))}
           </div>
        </div>
        <div className="flex items-center gap-2 bg-[#141414] p-1.5 rounded-lg border border-[#1E1E1E]">
            <ListFilter size={12} className="text-text-muted" />
            <span className="text-[10px] text-text-muted whitespace-nowrap">Threshold:</span>
            <input 
              type="number" 
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="bg-transparent border-none focus:ring-0 text-[10px] text-text-primary p-0 w-8"
            />
            <span className="text-[10px] text-text-muted">Cr</span>
        </div>
      </div>

      {/* List Feed */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {nseBlockLoading && filteredDeals.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted text-[10px]">
            Updating feed...
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted text-[10px]">
            No deals above ₹{threshold}cr
          </div>
        ) : filteredDeals.map((deal: any, idx: number) => (
          <div 
            key={idx} 
            className={`p-2.5 rounded-lg border transition-all ${watchlist.includes(deal.symbol) ? 'bg-[#0A0A0A]/80 border-amber-500/30' : 'bg-[#0A0A0A]/50 border-[#1A1A1A]'} hover:border-[#333]`}
          >
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${watchlist.includes(deal.symbol) ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30' : 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20'}`}>
                  {deal.symbol}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${deal.type === 'BUY' ? 'bg-green-500/10 text-green-500 ring-1 ring-green-500/20' : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20'}`}>
                  {deal.type}
                </span>
              </div>
              <span className="text-[10px] font-bold text-text-primary">₹{deal.value.toFixed(1)} Cr</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="text-[10px] text-text-secondary font-medium truncate w-[180px]">
                {deal.clientName}
              </div>
              <div className="flex justify-between items-center text-[9px] text-text-muted font-medium">
                <span className="bg-[#141414] px-1.5 py-0.5 rounded border border-[#1E1E1E]">Qty: {deal.quantity.toLocaleString()}</span>
                <span className="bg-[#141414] px-1.5 py-0.5 rounded border border-[#1E1E1E]">@ {deal.price.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockDealFeed;
