import React, { useState } from 'react';
import { useAnthropicAPI } from '../../hooks/useAnthropicAPI';
import { Search, History, Sparkles, Filter, ChevronRight, CornerDownRight } from 'lucide-react';

interface ScreenerFilter {
  field: string;
  operator: string;
  value: any;
}

interface ScreenerSpec {
  filters: ScreenerFilter[];
  limit: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  interpretation: string;
}

const NLScreener: React.FC = () => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [spec, setSpec] = useState<ScreenerSpec | null>(null);
  const { callClaude, loading } = useAnthropicAPI();

  const suggestedQueries = [
    "F&O stocks near 52w high",
    "High delivery small caps today",
    "Up more than 5% with rising volumes"
  ];

  const handleSearch = async (q: string = query) => {
    if (!q.trim()) return;
    
    // Add to history
    setHistory(prev => [q, ...prev.slice(0, 9)]);
    
    const prompt = `Convert this stock screener query into a JSON filter specification.

Available fields: price, change1d, change5d, volume, avgVolume20d, deliveryPct, high52w, low52w, distFromHigh52w

Query: "${q}"

Respond only with JSON:
{
  "filters": [{ "field": "string", "operator": ">|<|=", "value": number|string }],
  "limit": 20,
  "sortBy": "string",
  "sortDirection": "desc|asc",
  "interpretation": "friendly sentence describing the scan"
}`;

    const result = await callClaude(prompt);
    if (result) {
      try {
        const parsed = JSON.parse(result);
        setSpec(parsed);
      } catch (e) {
        console.error("Failed to parse AI response", e);
      }
    }
  };

  // Mock results for demonstration
  const mockResults = [
    { symbol: 'HDFCBANK', sector: 'Banks', price: 1540.2, change: 2.4, delivery: 68.2 },
    { symbol: 'RELIANCE', sector: 'Energy', price: 2940.5, change: 1.8, delivery: 72.1 },
    { symbol: 'INFY', sector: 'IT', price: 1620.0, change: 4.2, delivery: 65.4 },
    { symbol: 'ICICIBANK', sector: 'Banks', price: 1040.2, change: 0.8, delivery: 61.2 },
  ];

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      {/* Search Bar Area */}
      <div className="p-4 border-b border-[#111] bg-[#0A0A0A] space-y-3">
        <div className="relative flex items-center group">
          <Search className="absolute left-3 text-text-muted group-focus-within:text-accent-info transition-colors" size={16} />
          <input 
            type="text"
            className="w-full bg-[#111] border border-[#222] rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-white placeholder:text-[#444] focus:ring-1 focus:ring-accent-info focus:border-accent-info transition-all outline-none"
            placeholder="Type your screen query (e.g. 'delivery above 65%')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={() => handleSearch()}
            disabled={loading}
            className="absolute right-2 px-3 py-1.5 bg-accent-info text-white text-[10px] font-black rounded-lg hover:bg-accent-info/80 transition-all opacity-0 group-focus-within:opacity-100 disabled:opacity-50"
          >
            {loading ? 'SCREEEING...' : 'RUN'}
          </button>
        </div>

        {/* Interpretation */}
        {spec && (
          <div className="flex items-center gap-2 px-1">
             <CornerDownRight size={12} className="text-text-muted" />
             <span className="text-[10px] text-accent-info font-bold italic tracking-wide">
                "{spec.interpretation}"
             </span>
          </div>
        )}

        {/* Quick Pills */}
        {!spec && !loading && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {suggestedQueries.map((q, i) => (
              <button 
                key={i}
                onClick={() => { setQuery(q); handleSearch(q); }}
                className="whitespace-nowrap px-3 py-1.5 bg-[#141414] border border-[#222] rounded-full text-[10px] font-bold text-text-muted hover:text-white hover:border-[#444] transition-all flex items-center gap-1.5"
              >
                <Sparkles size={10} className="text-amber-500/50" />
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results / Empty State */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-40">
             <div className="w-8 h-1 bg-[#111] rounded-full overflow-hidden">
                <div className="h-full bg-accent-info animate-[loading_1s_infinite]" />
             </div>
             <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Neural Processing...</span>
          </div>
        ) : spec ? (
          <div className="p-0">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-[#0A0A0A] border-b border-[#111]">
                     <th className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Symbol</th>
                     <th className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Price</th>
                     <th className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">% Chg</th>
                     <th className="px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest text-right">Delivery</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#111]">
                  {mockResults.map((row, i) => (
                    <tr key={i} className="hover:bg-[#0A0A0A] transition-colors group cursor-pointer">
                       <td className="px-4 py-3">
                          <div className="flex flex-col">
                             <span className="text-xs font-black text-white group-hover:text-accent-info transition-colors">{row.symbol}</span>
                             <span className="text-[9px] text-text-muted font-medium">{row.sector}</span>
                          </div>
                       </td>
                       <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-[#EEE]">
                          {row.price.toLocaleString()}
                       </td>
                       <td className={`px-4 py-3 text-right text-xs font-black tabular-nums ${row.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {row.change > 0 ? '+' : ''}{row.change}%
                       </td>
                       <td className="px-4 py-3 text-right">
                          <span className="text-xs font-bold tabular-nums text-text-primary bg-[#111] px-2 py-0.5 rounded border border-[#222]">
                            {row.delivery}%
                          </span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        ) : history.length > 0 ? (
          <div className="p-4 space-y-4">
             <div className="flex items-center gap-2 text-text-muted">
                <History size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Recent Queries</span>
             </div>
             <div className="space-y-2">
                {history.map((h, i) => (
                  <button 
                    key={i}
                    onClick={() => { setQuery(h); handleSearch(h); }}
                    className="w-full text-left p-2.5 rounded-lg border border-[#111] bg-[#0A0A0A] hover:bg-[#141414] hover:border-[#333] transition-all text-[11px] font-medium text-text-secondary flex justify-between items-center group"
                  >
                    {h}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
             <div className="p-4 bg-accent-info/5 rounded-full ring-1 ring-accent-info/10">
                <Sparkles size={24} className="text-accent-info opacity-40" />
             </div>
             <div className="space-y-2">
                <h5 className="text-sm font-black text-white">Ask the Market Anything</h5>
                <p className="text-[11px] text-text-muted leading-relaxed max-w-[240px]">
                   Describe the pattern you're looking for and our AI will convert it to a scan.
                </p>
             </div>
          </div>
        )}
      </div>

      {/* Styled animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}} />
    </div>
  );
};

export default NLScreener;
