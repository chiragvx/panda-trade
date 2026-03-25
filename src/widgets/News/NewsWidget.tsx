import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { COLOR, TYPE, ROW_HEIGHT, BORDER } from '../../ds/tokens';
import { Badge } from '../../ds/components/Badge';
import { Button } from '../../ds/components/Button';
import { useSelectionStore } from '../../store/useStore';
import { Sparkline } from '../../ds/components/Sparkline';
import { Search, Filter, Bell, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface NewsItem {
  id: string;
  headline: string;
  body: string;
  source: string;
  time: string;
  tickers: string[];
  category: 'RESULTS' | 'REGULATORY' | 'MANAGEMENT' | 'MACRO' | 'RATING';
  sentiment: 'positive' | 'negative' | 'neutral';
}

const MOCK_NEWS: NewsItem[] = [
  { id: '1', headline: 'RELIANCE EYES GREEN ENERGY EXPANSION', body: 'Reliance Industries is set to deploy ₹75,000 Cr into solar and hydrogen manufacturing infrastructure by FY2027. Management indicates EBITDA margin expansion potential of 150-200bps.', source: 'BLOOMBERG', time: '2M', tickers: ['RELIANCE', 'ADANIGREEN'], category: 'MANAGEMENT', sentiment: 'positive' },
  { id: '2', headline: 'HDFC BANK FLAGS NIM COMPRESSION', body: 'HDFC Bank management warned of a 15bps compression in Net Interest Margins for Q1 FY25, citing higher cost of deposits post-merger. Analysts maintain Buy with revised TP.', source: 'REUTERS', time: '14M', tickers: ['HDFCBANK', 'ICICIBANK'], category: 'RESULTS', sentiment: 'negative' },
  { id: '3', headline: 'TCS SECURES $2B CLOUD TRANSFORMATION DEAL', body: 'Tata Consultancy Services has won a mega-deal from a major EU bank. The 7-year contract is expected to boost Order Book-to-Bill ratio to 1.4x.', source: 'CNBC', time: '42M', tickers: ['TCS', 'INFY'], category: 'RESULTS', sentiment: 'positive' },
  { id: '4', headline: 'RBI MONETARY POLICY: STATUS QUO UNCHANGED', body: 'The MPC voted 5-1 to maintain repo rate at 6.5%. Governor Das emphasized "withdrawal of accommodation" stance while flagging sticky pulse inflation.', source: 'RBI', time: '1H', tickers: ['SBIN', 'ICICIBANK', 'AXISBANK'], category: 'MACRO', sentiment: 'neutral' },
  { id: '5', headline: 'SEBI PROPOSES NEW ASSET CLASS FOR HNIS', body: 'Regulatory filing reveals SEBI proposal for a high-risk investment vehicle with ₹10L minimum ticket size. Aimed at bridge between MF and AIF.', source: 'SEBI', time: '3H', tickers: ['LICI', 'HDFCBANK'], category: 'REGULATORY', sentiment: 'neutral' },
  { id: '6', headline: 'INFY Q4 GUIDANCE TRIMMED AMID TECH COOLING', body: 'Infosys cut its revenue guidance to 4-7% from 5-8%. Cites delayed decision making in BFSI vertical across North American markets.', source: 'MINT', time: '5H', tickers: ['INFY', 'TCS'], category: 'RESULTS', sentiment: 'negative' },
];

const CATEGORY_COLORS: Record<string, string> = {
  RESULTS: COLOR.semantic.info,
  REGULATORY: '#A78BFA',
  MANAGEMENT: '#34D399',
  MACRO: '#FBBF24',
  RATING: '#F87171',
};

const NEWS_VELOCITY_DATA = [4, 8, 12, 10, 15, 20, 18, 25, 30, 22];

export const NewsWidget: React.FC = () => {
  const { selectedSymbol } = useSelectionStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'LINKED'>('LINKED');

  const filteredNews = useMemo(() => {
    if (filterMode === 'LINKED' && selectedSymbol) {
      return MOCK_NEWS.filter(n => n.tickers.includes(selectedSymbol.ticker));
    }
    return MOCK_NEWS;
  }, [filterMode, selectedSymbol]);

  const newsVelocity = useMemo(() => {
    return selectedSymbol ? (filteredNews.length > 2 ? 'HIGH' : 'STABLE') : 'STABLE';
  }, [filteredNews, selectedSymbol]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface, overflow: 'hidden' }}>
      
      {/* Dense Header */}
      <div style={{ height: '32px', padding: '0 8px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: COLOR.bg.elevated }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: TYPE.family.mono, fontSize: '10px', color: COLOR.text.primary, fontWeight: 'bold', letterSpacing: '0.1em' }}>NEWS FEED</span>
            <div style={{ width: '1px', height: '12px', background: COLOR.bg.border }} />
            <button 
                onClick={() => setFilterMode(filterMode === 'ALL' ? 'LINKED' : 'ALL')}
                style={{ 
                    background: filterMode === 'LINKED' ? COLOR.semantic.info + '22' : 'transparent',
                    border: 'none', color: filterMode === 'LINKED' ? COLOR.semantic.info : COLOR.text.muted,
                    fontSize: '9px', fontFamily: TYPE.family.mono, padding: '2px 6px', cursor: 'pointer',
                    borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '4px'
                }}
            >
                {filterMode === 'LINKED' ? <Zap size={10} /> : <Filter size={10} />}
                {filterMode === 'LINKED' ? `LINKED: ${selectedSymbol?.ticker || 'NONE'}` : 'ALL STORIES'}
            </button>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>VELOCITY:</span>
                <span style={{ fontSize: '9px', color: newsVelocity === 'HIGH' ? COLOR.semantic.up : COLOR.text.primary, fontFamily: TYPE.family.mono, fontWeight: 'bold' }}>{newsVelocity}</span>
            </div>
            <Search size={14} color={COLOR.text.muted} />
         </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
        {filteredNews.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.sm, fontFamily: TYPE.family.mono }}>
                NO RECENT NEWS FOR {selectedSymbol?.ticker}
            </div>
        )}
        {filteredNews.map(item => {
          const isExp = expanded === item.id;
          const sentimentColor = item.sentiment === 'positive' ? COLOR.semantic.up : item.sentiment === 'negative' ? COLOR.semantic.down : COLOR.text.muted;
          
          return (
            <div 
                key={item.id} 
                onClick={() => setExpanded(isExp ? null : item.id)}
                style={{ 
                    borderBottom: BORDER.standard, cursor: 'pointer',
                    background: isExp ? COLOR.bg.overlay : 'transparent',
                    borderLeft: `3px solid ${sentimentColor}`,
                    transition: 'background 80ms linear',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', padding: '8px', gap: '10px' }}>
                    <span style={{ width: '28px', fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono, flexShrink: 0 }}>{item.time}</span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ 
                                fontSize: TYPE.size.sm, fontFamily: TYPE.family.mono, fontWeight: isExp ? 'bold' : 'normal',
                                color: isExp ? COLOR.text.primary : COLOR.text.secondary,
                                lineHeight: 1.3, textTransform: 'uppercase'
                            }}>
                                {item.headline}
                            </span>
                             <span style={{ 
                                fontSize: '8px', fontFamily: TYPE.family.mono, color: CATEGORY_COLORS[item.category],
                                border: `1px solid ${CATEGORY_COLORS[item.category]}44`, padding: '1px 4px',
                                flexShrink: 0, letterSpacing: '0.05em'
                            }}>
                                {item.category}
                            </span>
                        </div>
                        
                        {!isExp && (
                             <div style={{ display: 'flex', gap: '4px' }}>
                                {item.tickers.map(t => <span key={t} style={{ fontSize: '9px', color: COLOR.semantic.info, fontFamily: TYPE.family.mono }}>${t}</span>)}
                            </div>
                        )}
                    </div>
                </div>

                {isExp && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        style={{ padding: '0 8px 12px 46px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                        <p style={{ margin: 0, fontSize: TYPE.size.sm, color: COLOR.text.secondary, fontFamily: TYPE.family.mono, lineHeight: 1.5, maxWidth: '500px' }}>
                            {item.body}
                        </p>

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>MENTIONS</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {item.tickers.map(t => <Badge key={t} label={t} variant="default" />)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>MARKET IMPACT</span>
                                <Sparkline data={NEWS_VELOCITY_DATA} width={60} height={12} color={sentimentColor} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                            <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>SOURCE: {item.source} WIRE</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button size="xs" variant="ghost">RESEARCH REPORT</Button>
                                <Button size="xs" variant="ghost">ALARM FOR TICKER</Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ height: '24px', background: COLOR.bg.elevated, borderTop: BORDER.standard, display: 'flex', alignItems: 'center', padding: '0 8px', gap: '12px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={10} color={COLOR.semantic.up} />
            <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>SENSEX +0.4%</span>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={10} color={COLOR.semantic.down} />
            <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>NIFTY -0.1%</span>
         </div>
      </div>
    </div>
  );
};
