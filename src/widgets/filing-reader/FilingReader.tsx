import React, { useState, useMemo } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { useAnthropicAPI } from '../../hooks/useAnthropicAPI';
import { useGlobalStore } from '../../store/globalStore';
import { FileText, AlertCircle, ChevronDown, ChevronUp, Clock, Filter, Sparkles } from 'lucide-react';

interface Filing {
  symbol: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  headline: string;
  keyNumber: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: string;
  fullText: string;
}

const FilingReader: React.FC = () => {
  const { watchlist } = useGlobalStore();
  const { callClaude, loading: aiLoading } = useAnthropicAPI();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Mocking NSE Filing Data as NSE API for announcements is complex to parse via proxy
  const mockFilings: Filing[] = [
    {
      symbol: 'HDFCBANK',
      category: 'dividend',
      priority: 'medium',
      headline: 'Board recommends final dividend of ₹19.50 per equity share for FY24',
      keyNumber: '₹19.50',
      sentiment: 'positive',
      timestamp: '10:45 AM',
      fullText: 'Pursuant to Regulation 30 of SEBI (LODR) Regulations, 2015, we wish to inform that the Board of Directors at its meeting held today has recommended a dividend...'
    },
    {
      symbol: 'INFY',
      category: 'merger_acquisition',
      priority: 'high',
      headline: 'Infosys to acquire leading semiconductor design firm for $340M',
      keyNumber: '$340M',
      sentiment: 'positive',
      timestamp: '09:15 AM',
      fullText: 'Infosys today announced a definitive agreement to acquire InSemi, a leading semiconductor design and embedded services provider...'
    },
    {
      symbol: 'RELIANCE',
      category: 'results',
      priority: 'high',
      headline: 'Q4 Net Profit up 12% YoY, exceeds analyst estimates',
      keyNumber: '12%',
      sentiment: 'positive',
      timestamp: 'Yesterday',
      fullText: 'Reliance Industries Limited today reported its financial results for the quarter and year ended March 31, 2024...'
    },
    {
      symbol: 'TCS',
      category: 'management_change',
      priority: 'medium',
      headline: 'Appointment of New Chief Operating Officer effective June 1st',
      keyNumber: null,
      sentiment: 'neutral',
      timestamp: 'Yesterday',
      fullText: 'Tata Consultancy Services announced the appointment of Mr. Abhinav Kumar as the new COO...'
    }
  ];

  const categories = ['results', 'insider_trade', 'pledging', 'management_change', 'regulatory', 'merger_acquisition', 'dividend', 'other'];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'results': return 'bg-blue-500/10 text-blue-400 ring-blue-500/20';
      case 'insider_trade': return 'bg-amber-500/10 text-amber-400 ring-amber-500/20';
      case 'pledging': return 'bg-red-500/10 text-red-400 ring-red-500/20';
      case 'management_change': return 'bg-orange-500/10 text-orange-400 ring-orange-500/20';
      case 'merger_acquisition': return 'bg-purple-500/10 text-purple-400 ring-purple-500/20';
      case 'dividend': return 'bg-green-500/10 text-green-400 ring-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 ring-gray-500/20';
    }
  };

  const filteredFilings = useMemo(() => {
    return mockFilings.filter(f => 
      (filterCategory === 'all' || f.category === filterCategory) &&
      (watchlist.includes(f.symbol))
    );
  }, [filterCategory, watchlist]);

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      {/* Filters */}
      <div className="p-3 border-b border-[#111] bg-[#0A0A0A] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
            <Filter size={12} className="text-text-muted" />
            <select 
              className="bg-transparent border-none text-[10px] font-bold text-text-secondary focus:ring-0 p-0 cursor-pointer uppercase tracking-widest"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
                <option value="all">ALL FILINGS</option>
                {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
            </select>
        </div>
        <div className="flex items-center gap-1.5 opacity-60">
            <Sparkles size={10} className="text-amber-500" />
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">AI Summary Active</span>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {filteredFilings.map((filing, idx) => (
          <div 
            key={idx} 
            className={`group rounded-lg border transition-all overflow-hidden ${filing.priority === 'high' ? 'border-amber-500/20 bg-[#0C0B0A]' : 'border-[#1A1A1A] bg-[#0A0A0A]'}`}
          >
            {/* Header / Summary row */}
            <div 
              className="p-3 cursor-pointer select-none"
              onClick={() => setExpandedId(expandedId === idx ? null : idx)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ${getCategoryColor(filing.category)}`}>
                    {filing.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[10px] font-black text-white bg-[#141414] px-1.5 py-0.5 rounded border border-[#222]">
                    {filing.symbol}
                  </span>
                  {filing.priority === 'high' && <AlertCircle size={12} className="text-amber-500 animate-pulse" />}
                </div>
                <span className="text-[9px] font-medium text-text-muted">{filing.timestamp}</span>
              </div>
              
              <div className="flex gap-4 items-center">
                <div className="flex-1 text-xs font-bold text-[#EEE] leading-relaxed group-hover:text-white transition-colors">
                  {filing.headline}
                </div>
                {filing.keyNumber && (
                   <div className={`text-sm font-black italic tracking-tight ${filing.sentiment === 'positive' ? 'text-green-500' : filing.sentiment === 'negative' ? 'text-red-500' : 'text-blue-400'}`}>
                      {filing.keyNumber}
                   </div>
                )}
                <div>
                   {expandedId === idx ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedId === idx && (
              <div className="px-3 pb-3 pt-0 border-t border-[#1A1A1A] bg-[#050505]/50 mt-1">
                 <div className="text-[11px] text-text-secondary leading-relaxed pt-3 font-medium">
                    {filing.fullText}
                 </div>
                 <button className="mt-3 text-[10px] font-bold text-accent-info hover:underline flex items-center gap-1 group/btn">
                    View full exchange document
                    <ChevronDown size={10} className="-rotate-90 group-hover/btn:translate-x-0.5 transition-transform" />
                 </button>
              </div>
            )}
          </div>
        ))}

        {filteredFilings.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
              <FileText size={40} className="mb-4 text-text-muted" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">No matching filings</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default FilingReader;
