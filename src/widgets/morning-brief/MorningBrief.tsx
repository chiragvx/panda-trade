import React, { useState, useEffect } from 'react';
import { useAnthropicAPI } from '../../hooks/useAnthropicAPI';
import { useGlobalStore } from '../../store/globalStore';
import { RefreshCcw, Clipboard, Sparkles, Target } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

const MorningBrief: React.FC = () => {
  const { watchlist } = useGlobalStore();
  const { callClaude, loading } = useAnthropicAPI();
  const [brief, setBrief] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  const generateBrief = async () => {
    const prompt = `Write a pro pre-market brief. Global Tone, Nifty Outlook, Watchlist Highlights (${watchlist.join(", ")}), Trade Idea, Key Events. Respond in plain text with **HEADERS**.`;
    const result = await callClaude(prompt);
    if (result) {
      setBrief(result);
      setTimestamp(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  useEffect(() => {
    if (!brief && !loading) {
      setTimestamp('');
    }
  }, [brief, loading]);

  const copyToClipboard = () => brief && navigator.clipboard.writeText(brief);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, fontFamily: TYPE.family.mono }}>
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <Sparkles size={12} style={{ color: COLOR.semantic.warning }} />
           <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>DAILY_INTELLIGENCE_BRIEF</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '9px', color: COLOR.text.muted }}>{timestamp}</span>
            <button onClick={generateBrief} disabled={loading} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }} className="hover:text-text-primary active:opacity-50">
                <RefreshCcw size={12} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={copyToClipboard} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }} className="hover:text-text-primary active:opacity-50">
                <Clipboard size={12} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: SPACE[6], overflowY: 'auto' }} className="custom-scrollbar">
        {loading ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', opacity: 0.5 }}>
             <div style={{ width: '64px', height: '2px', background: COLOR.bg.elevated, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: COLOR.semantic.warning }} className="animate-[loading_1s_infinite]" />
             </div>
             <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>SYNTHESIZING_DATA</span>
          </div>
        ) : brief ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[6] }}>
            {brief.split('**').map((part, index) => {
               if (index % 2 === 1) { // Header
                  return (
                    <div key={index} style={{ borderBottom: BORDER.standard, paddingBottom: '4px', marginTop: index > 1 ? SPACE[6] : 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.warning, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>
                            {part}
                        </span>
                    </div>
                  );
               }
               return (
                  <div key={index} style={{ fontSize: '12px', color: COLOR.text.primary, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                     {part.trim()}
                  </div>
               );
            })}
            
            {/* Actionable Setup Block */}
            <div style={{ padding: SPACE[4], background: COLOR.bg.elevated, border: BORDER.standard, borderLeft: `3px solid ${COLOR.semantic.info}`, marginTop: SPACE[6] }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: SPACE[3] }}>
                  <Target size={14} style={{ color: COLOR.semantic.info }} />
                  <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>ACTIONABLE_SETUP</span>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[4] }}>
                  <div>
                      <div style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', marginBottom: '2px' }}>CONVICTION_ASSET</div>
                      <div style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>N/A <span style={{ color: COLOR.semantic.up }}>LONG</span></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', marginBottom: '2px' }}>TARGET_EXIT</div>
                      <div style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.semantic.info }}>N/A</div>
                  </div>
               </div>
               <div style={{ marginTop: SPACE[3], display: 'flex', gap: '2px', background: COLOR.bg.border }}>
                  <div style={{ flex: 1, background: COLOR.bg.base, padding: '6px', fontSize: '9px', color: COLOR.text.muted }}>
                     ENTRY: <span style={{ color: COLOR.text.primary, fontWeight: TYPE.weight.bold }}>CONFIRMED+</span>
                  </div>
                  <div style={{ flex: 1, background: COLOR.bg.base, padding: '6px', fontSize: '9px', color: COLOR.text.muted }}>
                     STOP_LOSS: <span style={{ color: COLOR.semantic.down, fontWeight: TYPE.weight.bold }}>DYNAMIC</span>
                  </div>
               </div>
            </div>
          </div>
        ) : null}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}} />
    </div>
  );
};

export default MorningBrief;
