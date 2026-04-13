import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Badge } from '../../ds/components/Badge';
import { Button } from '../../ds/components/Button';
import { Search, Filter, Zap, TrendingUp, X } from 'lucide-react';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';

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

const CATEGORY_COLORS: Record<NewsItem['category'], string> = {
  RESULTS: COLOR.semantic.info,
  REGULATORY: COLOR.semantic.info,
  MANAGEMENT: COLOR.semantic.info,
  MACRO: COLOR.semantic.warning,
  RATING: COLOR.semantic.down,
};

const toCategory = (value: unknown): NewsItem['category'] => {
  const str = String(value || '').toUpperCase();
  if (str === 'RESULTS' || str === 'REGULATORY' || str === 'MANAGEMENT' || str === 'MACRO' || str === 'RATING') return str;
  return 'MACRO';
};

const toSentiment = (value: unknown): NewsItem['sentiment'] => {
  const str = String(value || '').toLowerCase();
  if (str === 'positive' || str === 'negative' || str === 'neutral') return str;
  return 'neutral';
};

const normaliseNews = (payload: any): NewsItem[] => {
  const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return raw.map((item: any, idx: number) => ({
    id: String(item.id || item.uuid || `${idx}`),
    headline: String(item.headline || item.title || '').trim(),
    body: String(item.body || item.summary || '').trim(),
    source: String(item.source || 'UNKNOWN').trim(),
    time: String(item.time || item.publishedAt || '--'),
    tickers: Array.isArray(item.tickers) ? item.tickers.map((t: any) => String(t).toUpperCase()) : [],
    category: toCategory(item.category),
    sentiment: toSentiment(item.sentiment),
  })).filter((item: NewsItem) => item.headline.length > 0);
};

export const NewsWidget: React.FC = () => {
  const { selectedSymbol: globalSymbol } = useSelectionStore();
  const [localSymbol, setLocalSymbol] = useState<any>(null);
  const activeSymbol = localSymbol || globalSymbol;
  const { prices } = useUpstoxStore();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'LINKED'>('LINKED');

  const allNews = useMemo<NewsItem[]>(() => [], []);

  const filteredNews = useMemo(() => {
    if (filterMode === 'LINKED' && activeSymbol) {
      return allNews.filter((n) => n.tickers.includes(activeSymbol.ticker));
    }
    return allNews;
  }, [allNews, filterMode, activeSymbol]);

  const newsVelocity = useMemo(() => {
    if (filteredNews.length >= 8) return 'HIGH';
    if (filteredNews.length >= 3) return 'STABLE';
    return 'LOW';
  }, [filteredNews.length]);

  const niftyPct = Number(prices['NSE_INDEX|Nifty 50']?.pChange ?? 0);
  const sensexPct = Number(prices['BSE_INDEX|SENSEX']?.pChange ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.surface, overflow: 'hidden' }}>
      <div style={{ height: '32px', padding: '0 8px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: COLOR.bg.elevated }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.primary, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>NEWS_FEED</span>
          <div style={{ width: '1px', height: '12px', background: COLOR.bg.border }} />
          <button
            onClick={() => setFilterMode(filterMode === 'ALL' ? 'LINKED' : 'ALL')}
            style={{
              background: filterMode === 'LINKED' ? `${COLOR.semantic.info}22` : 'transparent',
              border: 'none',
              color: filterMode === 'LINKED' ? COLOR.semantic.info : COLOR.text.muted,
              fontSize: TYPE.size.xs,
              fontFamily: TYPE.family.mono,
              fontWeight: TYPE.weight.bold,
              padding: '2px 6px',
              cursor: 'pointer',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: TYPE.letterSpacing.caps
            }}
          >
            {filterMode === 'LINKED' ? <Zap size={10} /> : <Filter size={10} />}
            {filterMode === 'LINKED' ? `LINKED: ${activeSymbol?.ticker || 'NONE'}` : 'ALL_STORIES'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WidgetSymbolSearch onSelect={(res) => setLocalSymbol({ ticker: res.ticker })} placeholder="SEARCH..." />
          {localSymbol && (
             <button onClick={() => setLocalSymbol(null)} style={{ background: 'transparent', border: 'none', color: COLOR.semantic.down, cursor: 'pointer' }}><X size={12} /></button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
        {filteredNews.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.sm, fontFamily: TYPE.family.mono }}>
            NO NEWS DATA AVAILABLE
          </div>
        )}
        {filteredNews.map((item) => {
          const isExp = expanded === item.id;
          const sentimentColor = item.sentiment === 'positive' ? COLOR.semantic.up : item.sentiment === 'negative' ? COLOR.semantic.down : COLOR.text.muted;
          const categoryColor = CATEGORY_COLORS[item.category];
          return (
            <div
              key={item.id}
              onClick={() => setExpanded(isExp ? null : item.id)}
              style={{
                borderBottom: BORDER.standard,
                cursor: 'pointer',
                background: isExp ? COLOR.bg.overlay : 'transparent',
                borderLeft: `3px solid ${sentimentColor}`,
                transition: 'background 80ms linear',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', padding: '8px', gap: '10px' }}>
                <span style={{ width: '42px', fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, flexShrink: 0, fontWeight: TYPE.weight.bold }}>{item.time}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: TYPE.size.sm,
                        fontFamily: TYPE.family.mono,
                        fontWeight: isExp ? 'bold' : 'normal',
                        color: isExp ? COLOR.text.primary : COLOR.text.secondary,
                        lineHeight: 1.3,
                        
                      }}
                    >
                      {item.headline}
                    </span>
                    <span
                      style={{
                        fontSize: TYPE.size.xs,
                        fontFamily: TYPE.family.mono,
                        color: categoryColor,
                        border: `1px solid ${categoryColor}44`,
                        padding: '1px 6px',
                        flexShrink: 0,
                        letterSpacing: TYPE.letterSpacing.caps,
                        fontWeight: TYPE.weight.black,
                        borderRadius: '2px'
                      }}
                    >
                      {item.category}
                    </span>
                  </div>

                  {!isExp && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {item.tickers.map((t) => <span key={t} style={{ fontSize: TYPE.size.xs, color: COLOR.semantic.info, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>${t}</span>)}
                    </div>
                  )}
                </div>
              </div>

              {isExp && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ padding: '0 8px 12px 52px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0, fontSize: TYPE.size.sm, color: COLOR.text.secondary, fontFamily: TYPE.family.mono, lineHeight: 1.5, maxWidth: '500px' }}>{item.body || 'No article body provided.'}</p>

                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>MENTIONS</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {item.tickers.length === 0 ? <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>NONE</span> : item.tickers.map((t) => <Badge key={t} label={t} variant="info" />)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                    <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>SOURCE: {item.source}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button size="xs" variant="outline">RESEARCH_REPORT</Button>
                      <Button size="xs" variant="outline">ALERT</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height: '24px', background: COLOR.bg.elevated, borderTop: BORDER.standard, display: 'flex', alignItems: 'center', padding: '0 8px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <TrendingUp size={10} color={niftyPct >= 0 ? COLOR.semantic.up : COLOR.semantic.down} />
          <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>NIFTY {niftyPct >= 0 ? '+' : ''}{niftyPct.toFixed(2)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <TrendingUp size={10} color={sensexPct >= 0 ? COLOR.semantic.up : COLOR.semantic.down} />
          <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>SENSEX {sensexPct >= 0 ? '+' : ''}{sensexPct.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};
