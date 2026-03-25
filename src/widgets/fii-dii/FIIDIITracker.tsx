import React, { useState, useEffect } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { useMarketHours } from '../../hooks/useMarketHours';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

interface FIIDIIEntry {
  category: string;
  buyValue: number;
  sellValue: number;
  netValue: number;
  date: string;
}

const FIIDIITracker: React.FC = () => {
  const { isMarketOpen } = useMarketHours();
  const { data, isLoading, error, isPlaceholderData } = useNSEData<FIIDIIEntry[]>('/api/fiidiiTradeReact', {
    pollingInterval: 5 * 60 * 1000, 
    enabled: true, // Should be true always to show last session data if closed
  });

  const [flashAmber, setFlashAmber] = useState(false);
  const [lastFiiNet, setLastFiiNet] = useState<number | null>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const fii = data.find(d => d.category === 'FII/FPI');
      if (fii) {
        if (lastFiiNet !== null && lastFiiNet > 0 && fii.netValue < 0) {
          // Cross from positive to negative
          setFlashAmber(true);
          const timer = setTimeout(() => setFlashAmber(false), 5000);
          return () => clearTimeout(timer);
        }
        setLastFiiNet(fii.netValue);
      }
    }
  }, [data, lastFiiNet]);

  if (isLoading && !data) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A0A] text-text-muted">
        <Clock className="animate-pulse mr-2" size={16} />
        Loading FII/DII...
      </div>
    );
  }

  const fii = data?.find(d => d.category === 'FII/FPI') || { buyValue: 0, sellValue: 0, netValue: 0 };
  const dii = data?.find(d => d.category === 'DII') || { buyValue: 0, sellValue: 0, netValue: 0 };

  const formatCr = (val: number) => `₹${(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })} cr`;

  const DataRow = ({ label, buy, sell, net }: any) => {
    const isNetPositive = net >= 0;
    return (
      <div className="flex flex-col gap-1 mb-4 p-2 rounded hover:bg-[#1A1A1A] transition-colors border border-transparent hover:border-[#333]">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-bold text-text-muted tracking-widest">{label}</span>
          <span className={`text-xs font-bold ${isNetPositive ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
            {isNetPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {formatCr(net)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-[10px] text-text-muted">
          <div className="flex justify-between border-r border-[#222] pr-2">
            <span>Buy</span>
            <span className="text-text-primary">{formatCr(buy)}</span>
          </div>
          <div className="flex justify-between pl-2">
            <span>Sell</span>
            <span className="text-text-primary">{formatCr(sell)}</span>
          </div>
        </div>
        {/* Mini horizontal bar showing net direction */}
        <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden mt-2 relative">
           <div 
             className={`absolute top-0 h-full ${isNetPositive ? 'bg-green-500' : 'bg-red-500'}`}
             style={{ 
               width: `${Math.min(Math.abs(net) / (Math.max(buy, sell) || 1) * 100, 100)}%`,
               left: isNetPositive ? '50%' : 'auto',
               right: !isNetPositive ? '50%' : 'auto'
             }}
           />
           <div className="absolute left-1/2 top-0 w-[1px] h-full bg-[#444]" />
        </div>
      </div>
    );
  };

  // Mock chart data for now since we need intraday line
  const mockChartData = Array.from({ length: 40 }, (_, i) => ({
    time: `${9 + Math.floor(i / 6)}:${(i % 6) * 10}`,
    nifty: 24000 + (Math.sin(i / 5) * 200) + (i * 20),
    fiiNet: (Math.cos(i / 4) * 500) - 200,
  }));

  return (
    <div className={`p-4 flex flex-col h-full transition-colors duration-500 ${flashAmber ? 'bg-amber-500/10 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]' : 'bg-transparent'}`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[10px] text-text-muted flex items-center gap-2">
          {isMarketOpen ? <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> : <Clock size={12}/>}
          {isMarketOpen ? 'LIVE MARKET' : 'PRIOR SESSION'} — {fii.date || 'DATELINE'}
        </h4>
        {error && (
            <div className="text-[10px] text-accent-danger flex items-center gap-1">
                <AlertTriangle size={10} />
                <span>Stale — {new Date().toLocaleTimeString()}</span>
            </div>
        )}
      </div>

      <DataRow label="FOREIGN INSTITUTIONS" buy={fii.buyValue} sell={fii.sellValue} net={fii.netValue} />
      <DataRow label="DOMESTIC INSTITUTIONS" buy={dii.buyValue} sell={dii.sellValue} net={dii.netValue} />

      <div className="flex-1 mt-4 min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false}/>
            <XAxis dataKey="time" hide />
            <YAxis yAxisId="left" hide orientation="left" />
            <YAxis yAxisId="right" hide orientation="right" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A', fontSize: '10px' }}
              labelStyle={{ color: '#888' }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Bar yAxisId="right" dataKey="fiiNet" fill="#3B82F6" opacity={0.3} radius={[2, 2, 0, 0]} />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="nifty" 
              stroke="#FFF" 
              strokeWidth={1.5} 
              dot={false} 
              activeDot={{ r: 4 }}
            />
            <ReferenceLine yAxisId="right" y={0} stroke="#444" strokeWidth={0.5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FIIDIITracker;
