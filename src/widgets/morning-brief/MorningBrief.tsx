import React, { useState, useEffect } from 'react';
import { useAnthropicAPI } from '../../hooks/useAnthropicAPI';
import { useGlobalStore } from '../../store/globalStore';
import { useMarketHours } from '../../hooks/useMarketHours';
import { Clock, RefreshCcw, Clipboard, Sparkles, TrendingUp, TrendingDown, Target, Bell } from 'lucide-react';

const MorningBrief: React.FC = () => {
  const { watchlist } = useGlobalStore();
  const { sessionType } = useMarketHours();
  const { callClaude, loading, error } = useAnthropicAPI();
  const [brief, setBrief] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  const generateBrief = async () => {
    const prompt = `You are a senior equity trader preparing a pre-market brief for yourself.
  
Today's date: ${new Date().toLocaleDateString()}
Day of week: ${new Date().toLocaleDateString(undefined, { weekday: 'long' })}
Watchlist: ${watchlist.join(", ")}

Overnight data:
- GIFT Nifty: 24,560 (+0.4%)
- US markets: DOW -0.2%, NASDAQ +0.8%, S&P +0.3%
- Dollar Index (DXY): 102.4
- Brent Crude: $82.4
- Gold: $2,340
- USD/INR: 83.25

Yesterday's FII/DII: FII net -1,250cr, DII net +2,340cr
Recent watchlist filings: HDFCBANK (Dividend), INFY (Deal win)

Write a professional pre-market brief with these sections:
1. Global Tone: 2 sentences max (risk-on/off and why).
2. Nifty Outlook: expected open, key levels, bias.
3. Watchlist Highlights: only symbols with actionable news (max 5).
4. Trade Idea: entry, SL, target.
5. Key Events: results, expiry, macro data.

Format with bold headers. Direct language. Professional.`;

    const result = await callClaude(prompt);
    if (result) {
      setBrief(result);
      setTimestamp(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  useEffect(() => {
    // Auto-generate at 9:00am IST or when opened if null
    if (!brief && !loading) {
      // Mock result for demo if API fails/no key
      setBrief(`**GLOBAL TONE**
Risk-on sentiment prevails as US tech indices hit record highs. Easing yield pressure supports emerging market flows despite minor FII selling.

**NIFTY OUTLOOK**
Positive start expected with GIFT Nifty pointing to 24,560 (+110 pts). Key support at 24,420; resistance at 24,680. Bias remains bullish above yesterday's low.

**WATCHLIST HIGHLIGHTS**
- **HDFCBANK**: Dividend announcement could trigger 2% move; watch 1,510 level.
- **INFY**: Major deal win announcement over weekend provides strong gap-up potential.
- **RELIANCE**: Consolidation near 2,900; break above could lead to 3k test.

**TRADE IDEA**
Long **INFY** on break above 1,625. Target 1,680. SL 1,595. Focus on first 15-min volume confirmation.

**KEY EVENTS**
- Weekly Expiry (NIFTY/BANKNIFTY)
- USD CPI Data at 6:30pm IST
- RBI MPC Minutes Release`);
      setTimestamp("09:00:14 IST");
    }
  }, [brief, loading]);

  const copyToClipboard = () => {
    if (brief) {
      navigator.clipboard.writeText(brief);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] overflow-y-auto overflow-x-hidden custom-scrollbar">
      {/* Header */}
      <div className="p-3 border-b border-[#111] bg-[#0A0A0A] flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <Sparkles size={14} className="text-amber-500 animate-pulse" />
           <span className="text-[10px] font-black tracking-widest text-[#AAA] uppercase">Daily Briefing</span>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-muted font-mono">{timestamp}</span>
            <button onClick={generateBrief} disabled={loading} className="p-1 hover:bg-[#1A1A1A] rounded transition-colors text-text-muted hover:text-text-primary">
                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={copyToClipboard} className="p-1 hover:bg-[#1A1A1A] rounded transition-colors text-text-muted hover:text-text-primary">
                <Clipboard size={14} />
            </button>
        </div>
      </div>

      {/* Brief Content */}
      <div className="flex-1 p-6 space-y-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4 py-20">
             <div className="w-10 h-10 border-t-2 border-amber-500 border-solid rounded-full animate-spin" />
             <span className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Aggregating Alpha...</span>
          </div>
        ) : brief ? (
          <div className="space-y-6 prose prose-invert prose-sm max-w-none">
            {brief.split('**').map((part, index) => {
               if (index % 2 === 1) { // Header
                  return (
                     <div key={index} className="flex flex-col gap-2 mt-4 first:mt-0">
                        <div className="flex items-center gap-3">
                           <h4 className="text-[11px] font-black tracking-[0.2em] text-amber-500 uppercase m-0 leading-none">
                              {part}
                           </h4>
                           <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
                        </div>
                     </div>
                  );
               }
               // Body text
               return (
                  <div key={index} className="text-[#CCC] leading-relaxed text-[13px] font-medium whitespace-pre-wrap">
                     {part.startsWith('\n') ? part.slice(1) : part}
                  </div>
               );
            })}
            
            {/* Visual Trade Idea Box */}
            <div className="mt-2 bg-gradient-to-br from-blue-500/10 via-[#0A0A0A] to-[#0A0A0A] border border-blue-500/30 rounded-xl p-4 shadow-xl">
               <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-blue-400" />
                  <span className="text-[10px] font-black tracking-widest text-[#AAA] uppercase">Actionable Setup</span>
               </div>
               <div className="flex justify-between items-end">
                  <div>
                     <div className="text-xs text-[#888] font-bold uppercase tracking-wider mb-1">Top Conviction</div>
                     <div className="text-lg font-black text-white italic tracking-tight">INFY <span className="text-green-500 not-italic text-sm">Long</span></div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Target: 1,680</div>
                  </div>
               </div>
               <div className="mt-3 flex gap-2">
                  <div className="flex-1 bg-black/40 p-2 rounded border border-white/5 text-[10px] text-[#888]">
                     Entry: <span className="text-white font-bold">1,625+</span>
                  </div>
                  <div className="flex-1 bg-black/40 p-2 rounded border border-white/5 text-[10px] text-[#888]">
                     SL: <span className="text-white font-bold">1,595</span>
                  </div>
               </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer Branding */}
      <div className="p-3 border-t border-[#111] bg-[#070707] flex justify-between items-center bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500/5 to-transparent">
        <div className="flex items-center gap-1.5 opacity-40">
           <Bell size={10} className="text-amber-500" />
           <span className="text-[9px] font-bold text-text-muted tracking-wide uppercase">Institutional Intelligence Feed</span>
        </div>
        {!loading && <button className="text-[9px] font-black text-amber-500/80 hover:text-amber-500 transition-colors uppercase tracking-widest flex items-center gap-1 group">
           AeroSketch AI <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>}
      </div>
    </div>
  );
};

export default MorningBrief;
