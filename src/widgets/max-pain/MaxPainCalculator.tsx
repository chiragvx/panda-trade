import React, { useState, useMemo } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ChevronDown, Target, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface OptionChainData {
  strikePrice: number;
  CE?: { openInterest: number; lastPrice: number };
  PE?: { openInterest: number; lastPrice: number };
}

const MaxPainCalculator: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [expiryIdx, setExpiryIdx] = useState(0);

  const { data: chainData, isLoading, error } = useNSEData<any>(
    `/api/option-chain-indices?symbol=${symbol}`,
    { pollingInterval: 10 * 60 * 1000 }
  );

  const { maxPain, filteredData, currentPrice, expiries } = useMemo(() => {
    if (!chainData?.records?.data) return { maxPain: 0, filteredData: [], currentPrice: 0, expiries: [] };

    const expiries = chainData.records.expiryDates.slice(0, 3);
    const selectedExpiry = expiries[expiryIdx];
    const currentPrice = chainData.records.underlyingValue;

    // Filter by expiry and strike range (+-10%)
    const rawData = chainData.records.data
      .filter((d: any) => d.expiryDate === selectedExpiry)
      .filter((d: any) => d.strikePrice > currentPrice * 0.9 && d.strikePrice < currentPrice * 1.1)
      .map((d: any) => ({
        strike: d.strikePrice,
        ceOI: d.CE?.openInterest || 0,
        peOI: d.PE?.openInterest || 0,
      }));

    // Calculate Max Pain
    const strikes = rawData.map((d: any) => d.strike);
    let minPain = Infinity;
    let maxPainStrike = 0;

    strikes.forEach((strike: number) => {
      const totalPain = rawData.reduce((sum: number, s: any) => {
        const ceLoss = s.strike < strike ? (strike - s.strike) * s.ceOI : 0;
        const peLoss = s.strike > strike ? (s.strike - strike) * s.peOI : 0;
        return sum + ceLoss + peLoss;
      }, 0);

      if (totalPain < minPain) {
        minPain = totalPain;
        maxPainStrike = strike;
      }
    });

    return { maxPain: maxPainStrike, filteredData: rawData, currentPrice, expiries };
  }, [chainData, expiryIdx]);

  if (isLoading && !chainData) return <div className="h-full flex items-center justify-center text-[10px] text-text-muted">Loading Options Chain...</div>;

  const diffPoints = maxPain - currentPrice;
  const diffPct = (diffPoints / currentPrice) * 100;

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      {/* Target Controls */}
      <div className="p-3 border-b border-[#111] space-y-3 bg-[#0A0A0A]">
        <div className="flex justify-between items-center gap-1">
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141414] rounded-lg border border-[#1E1E1E] text-[11px] font-bold text-text-primary hover:border-[#333] transition-all">
              {symbol}
              <ChevronDown size={14} className="text-text-muted opacity-50" />
            </button>
          </div>
          <div className="flex gap-1">
            {expiries.map((exp: string, i: number) => (
              <button 
                key={exp}
                onClick={() => setExpiryIdx(i)}
                className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-all ${expiryIdx === i ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-transparent border-[#222] text-text-muted hover:border-[#444]'}`}
              >
                {new Date(exp).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-2 relative min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} layout="vertical" margin={{ left: -30, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#111" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="strike" type="category" stroke="#444" fontSize={9} />
            <Tooltip 
               contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #1E1E1E', fontSize: '10px' }}
               itemStyle={{ padding: '2px 0' }}
            />
            {/* Split Bar Chart */}
            <Bar dataKey="ceOI" fill="#EF4444" opacity={0.5} radius={[0, 4, 4, 0]} barSize={8} />
            <Bar dataKey="peOI" fill="#10B981" opacity={0.5} radius={[0, 4, 4, 0]} barSize={8} />
            
            <ReferenceLine y={maxPain} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1.5} label={{ position: 'right', value: 'PAIN', fill: '#F59E0B', fontSize: 8, fontWeight: 'bold' }} />
            <ReferenceLine y={currentPrice} stroke="#FFF" strokeWidth={1} label={{ position: 'right', value: 'LTP', fill: '#FFF', fontSize: 8, fontWeight: 'bold' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#0A0A0A] border-t border-[#111] grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-text-muted tracking-widest uppercase mb-1">Max Pain Strike</span>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-amber-500" />
            <span className="text-sm font-black text-white tabular-nums">{maxPain.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-text-muted tracking-widest uppercase mb-1">Distance</span>
          <div className={`flex items-center gap-1.5 ${diffPoints >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <span className="text-sm font-black tabular-nums">{diffPoints > 0 ? '+' : ''}{diffPoints.toFixed(1)}</span>
            <span className="text-[10px] bg-[#111] px-1.5 py-0.5 rounded-full font-bold tabular-nums">({diffPct.toFixed(2)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaxPainCalculator;
