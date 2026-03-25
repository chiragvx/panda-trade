import React, { useState } from 'react';
import { useAnthropicAPI } from '../../hooks/useAnthropicAPI';
import { Search, History, Sparkles, ChevronRight, CornerDownRight } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, fontFamily: TYPE.family.mono, overflow: 'hidden' }}>
      {/* Search Section */}
      <div style={{ padding: SPACE[4], borderBottom: BORDER.standard, background: COLOR.bg.surface }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: SPACE[3] }}>
          <Search style={{ position: 'absolute', left: '12px', color: COLOR.text.muted }} size={14} />
          <input 
            type="text"
            style={{ 
                width: '100%', 
                background: COLOR.bg.elevated, 
                border: BORDER.standard, 
                padding: '10px 10px 10px 36px',
                fontSize: TYPE.size.xs,
                color: COLOR.text.primary,
                outline: 'none',
                fontFamily: TYPE.family.mono
            }}
            placeholder="TYPE_QUERY_E.G._DELIVERY_>_65%..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={() => handleSearch()}
            disabled={loading}
            style={{ 
                position: 'absolute', 
                right: '8px', 
                padding: '4px 12px', 
                background: COLOR.semantic.info,
                color: COLOR.text.inverse,
                border: 'none',
                fontSize: '9px',
                fontWeight: TYPE.weight.bold,
                cursor: 'pointer'
            }}
            className="hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : 'EXECUTE'}
          </button>
        </div>

        {spec && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
             <CornerDownRight size={10} style={{ color: COLOR.text.muted }} />
             <span style={{ fontSize: '9px', color: COLOR.semantic.info, fontWeight: TYPE.weight.bold, fontStyle: 'italic' }}>
                "{spec.interpretation.toUpperCase()}"
             </span>
          </div>
        )}

        {!spec && !loading && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }} className="no-scrollbar">
            {suggestedQueries.map((q, i) => (
              <button 
                key={i}
                onClick={() => { setQuery(q); handleSearch(q); }}
                style={{ 
                    whiteSpace: 'nowrap',
                    padding: '4px 8px',
                    background: COLOR.bg.elevated,
                    border: BORDER.standard,
                    fontSize: '9px',
                    color: COLOR.text.secondary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
                className="hover:text-text-primary"
              >
                <Sparkles size={8} style={{ color: COLOR.semantic.warning }} />
                {q.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results / List */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
        {loading ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.5 }}>
             <div style={{ width: '64px', height: '2px', background: COLOR.bg.elevated, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: COLOR.semantic.info }} className="animate-[loading_1s_infinite]" />
             </div>
             <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>NEURAL_SCAN_IN_PROGRESS</span>
          </div>
        ) : spec ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: TYPE.size.sm }}>
             <thead>
                <tr style={{ background: COLOR.bg.surface, borderBottom: BORDER.standard }}>
                   <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase' }}>SYMBOL</th>
                   <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase' }}>PRICE</th>
                   <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase' }}>%_CHG</th>
                   <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase' }}>DELV_PTS</th>
                </tr>
             </thead>
             <tbody style={{ color: COLOR.text.primary }}>
                {mockResults.map((row, i) => (
                  <tr key={i} style={{ borderBottom: BORDER.standard }} className="hover:bg-bg-elevated transition-colors cursor-pointer">
                     <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold }}>{row.symbol}</span>
                           <span style={{ fontSize: '9px', color: COLOR.text.muted }}>{row.sector}</span>
                        </div>
                     </td>
                     <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.price.toLocaleString()}
                     </td>
                     <td style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        fontWeight: TYPE.weight.bold,
                        fontVariantNumeric: 'tabular-nums',
                        color: row.change >= 0 ? COLOR.semantic.up : COLOR.semantic.down 
                     }}>
                        {row.change > 0 ? '+' : ''}{row.change}%
                     </td>
                     <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', fontWeight: TYPE.weight.bold, fontVariantNumeric: 'tabular-nums', background: COLOR.bg.elevated, padding: '2px 6px', border: BORDER.standard }}>
                          {row.delivery}%
                        </span>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
        ) : history.length > 0 ? (
          <div style={{ padding: SPACE[4], display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLOR.text.muted }}>
                <History size={12} />
                <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>HISTORICAL_QUERIES</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {history.map((h, i) => (
                  <button 
                    key={i}
                    onClick={() => { setQuery(h); handleSearch(h); }}
                    style={{ 
                        width: '100%', 
                        textAlign: 'left', 
                        padding: '8px 12px', 
                        background: COLOR.bg.surface, 
                        border: BORDER.standard,
                        color: COLOR.text.secondary,
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                    className="hover:border-text-muted hover:text-text-primary transition-colors"
                  >
                    {h.toUpperCase()}
                    <ChevronRight size={12} />
                  </button>
                ))}
             </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
             <div style={{ marginBottom: SPACE[6], opacity: 0.2 }}>
                <Sparkles size={32} style={{ color: COLOR.semantic.info }} />
             </div>
             <div>
                <h5 style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary, textTransform: 'uppercase', marginBottom: '8px' }}>MARKET_COGNITION_READY</h5>
                <p style={{ fontSize: '10px', color: COLOR.text.muted, lineHeight: '1.5', maxWidth: '200px', margin: '0 auto' }}>
                   Describe pattern requirements to execute neural-assisted scan.
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
