import React, { useState, useMemo } from 'react';
import { useGlobalStore } from '../../store/globalStore';
import { useNSEData } from '../../hooks/useNSEData';
import { Filter, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';

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

const toPriority = (value: unknown): Filing['priority'] => {
  const str = String(value || '').toLowerCase();
  if (str === 'high' || str === 'medium' || str === 'low') return str;
  return 'low';
};

const toSentiment = (value: unknown): Filing['sentiment'] => {
  const str = String(value || '').toLowerCase();
  if (str === 'positive' || str === 'negative' || str === 'neutral') return str;
  return 'neutral';
};

const parseFilings = (payload: any): Filing[] => {
  const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return raw.map((item: any) => ({
    symbol: String(item.symbol || item.ticker || '').toUpperCase(),
    category: String(item.category || 'OTHER').toUpperCase(),
    priority: toPriority(item.priority),
    headline: String(item.headline || item.title || '').trim(),
    keyNumber: item.keyNumber ? String(item.keyNumber) : null,
    sentiment: toSentiment(item.sentiment),
    timestamp: String(item.timestamp || item.time || '--'),
    fullText: String(item.fullText || item.body || item.summary || ''),
  })).filter((item: Filing) => item.headline.length > 0);
};

const FilingReader: React.FC = () => {
  const { watchlist } = useGlobalStore();
  const { data } = useNSEData<any>('/api/corporate-announcements', { pollingInterval: 60 * 1000 });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filings = useMemo(() => parseFilings(data), [data]);

  const categories = ['RESULTS', 'INSIDER_TRADE', 'PLEDGING', 'MANAGEMENT_CHANGE', 'REGULATORY', 'MERGER_ACQUISITION', 'DIVIDEND', 'OTHER'];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'RESULTS':
        return COLOR.semantic.info;
      case 'DIVIDEND':
        return COLOR.semantic.up;
      case 'MERGER_ACQUISITION':
        return COLOR.semantic.purple;
      case 'HIGH':
        return COLOR.semantic.warning;
      default:
        return COLOR.text.muted;
    }
  };

  const filteredFilings = useMemo(
    () =>
      filings
        .filter((f) => (filterCategory === 'all' || f.category === filterCategory))
        .filter((f) => watchlist.length === 0 || watchlist.includes(f.symbol))
        .sort((a, b) => (a.priority === 'high' ? -1 : 1)),
    [filings, filterCategory, watchlist]
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, fontFamily: TYPE.family.mono }}>
      <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={12} style={{ color: COLOR.text.muted }} />
          <select
            style={{ background: 'none', border: 'none', color: COLOR.text.secondary, fontSize: '9px', fontWeight: TYPE.weight.bold, outline: 'none', cursor: 'pointer', fontFamily: TYPE.family.mono }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">ALL_FILINGS</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
          <Sparkles size={10} style={{ color: COLOR.semantic.warning }} />
          <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase' }}>LIVE_EXTRACTION</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
        {filteredFilings.map((filing, idx) => (
          <div
            key={idx}
            style={{
              borderBottom: BORDER.standard,
              background: filing.priority === 'high' ? `${COLOR.semantic.warning}05` : COLOR.bg.base,
              position: 'relative',
            }}
          >
            <div style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === idx ? null : idx)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: getCategoryColor(filing.category), border: `1px solid ${getCategoryColor(filing.category)}40`, padding: '1px 4px', background: COLOR.bg.surface }}>{filing.category}</span>
                  <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{filing.symbol || '--'}</span>
                  {filing.priority === 'high' && <AlertCircle size={10} style={{ color: COLOR.semantic.warning }} />}
                </div>
                <span style={{ fontSize: '8px', color: COLOR.text.muted }}>{filing.timestamp}</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div style={{ flex: 1, fontSize: '11px', fontWeight: TYPE.weight.medium, color: COLOR.text.primary, lineHeight: '1.4' }}>{filing.headline}</div>
                {filing.keyNumber && (
                  <span style={{ fontSize: '12px', fontWeight: TYPE.weight.bold, color: filing.sentiment === 'positive' ? COLOR.semantic.up : COLOR.semantic.down, fontVariantNumeric: 'tabular-nums' }}>
                    {filing.keyNumber}
                  </span>
                )}
                <div style={{ color: COLOR.text.muted }}>{expandedId === idx ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</div>
              </div>
            </div>

            {expandedId === idx && (
              <div style={{ padding: '0 12px 12px 12px', background: COLOR.bg.surface, borderTop: BORDER.standard }}>
                <div style={{ fontSize: '10px', color: COLOR.text.secondary, lineHeight: '1.6', paddingTop: '10px' }}>{filing.fullText || 'No full filing text available.'}</div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
                  <button style={{ background: 'none', border: 'none', color: COLOR.semantic.info, fontSize: '9px', fontWeight: TYPE.weight.bold, padding: 0, cursor: 'pointer' }} className="hover:underline">
                    VIEW_EXCHANGE_SOURCE
                  </button>
                  <button style={{ background: 'none', border: 'none', color: COLOR.text.muted, fontSize: '9px', fontWeight: TYPE.weight.bold, padding: 0, cursor: 'pointer' }} className="hover:underline">
                    SENTIMENT_ANALYSIS
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredFilings.length === 0 && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', opacity: 0.3 }}>
            <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>NO_ACTIVE_FILINGS</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilingReader;
