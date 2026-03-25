import React, { useState, useEffect, useMemo } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { useGlobalStore } from '../../store/globalStore';
import { useAlertStore } from '../../store/alertStore';
import { ListFilter, Zap } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

const BlockDealFeed: React.FC = () => {
  const { watchlist } = useGlobalStore();
  const { addAlert } = useAlertStore();
  const [filter, setFilter] = useState<'ALL' | 'WATCHLIST' | 'BUY' | 'SELL'>('ALL');
  const [threshold, setThreshold] = useState(10); 

  const { data: nseBlockDeals, isLoading: nseBlockLoading } = useNSEData<any>('/api/block-deal', {
    pollingInterval: 60 * 1000,
  });

  const processedDeals = useMemo(() => {
    if (!nseBlockDeals?.data) return [];
    
    return nseBlockDeals.data.map((d: any) => {
      const q = d.quantity || d.qty || 0;
      const p = d.price || 0;
      return {
        symbol: d.symbol || 'UNKNOWN',
        clientName: d.clientName || 'UNKNOWN_CLIENT',
        type: (d.buySell === 'Buy' || d.type === 'BUY' || d.type === 'B') ? 'BUY' : 'SELL',
        quantity: q,
        price: p,
        value: (q * p) / 10000000, 
        timestamp: d.time || d.timestamp || new Date().toISOString(),
      };
    }).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [nseBlockDeals]);

  useEffect(() => {
    if (processedDeals.length > 0) {
      const topDeal = processedDeals[0];
      const inWatchlist = watchlist.includes(topDeal.symbol);
      
      if (inWatchlist && topDeal.value > threshold) {
        addAlert({
          symbol: topDeal.symbol,
          type: 'event',
          condition: 'Block Deal',
          value: topDeal.value,
          priority: 'high',
          message: `${topDeal.symbol}: Block deal of ₹${topDeal.value.toFixed(1)}cr by ${topDeal.clientName}`,
        });
      }
    }
  }, [processedDeals, watchlist, threshold, addAlert]);

  const filteredDeals = processedDeals.filter((deal: any) => {
    if (deal.value < threshold) return false;
    if (filter === 'WATCHLIST' && !watchlist.includes(deal.symbol)) return false;
    if (filter === 'BUY' && deal.type !== 'BUY') return false;
    if (filter === 'SELL' && deal.type !== 'SELL') return false;
    return true;
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, fontFamily: TYPE.family.mono }}>
      {/* Top Controls */}
      <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', flexDirection: 'column', gap: '8px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: COLOR.bg.elevated, border: BORDER.standard }}>
              {['ALL', 'WATCHLIST', 'BUY', 'SELL'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f as any)}
                  style={{ 
                      padding: '2px 8px', 
                      fontSize: '9px', 
                      fontWeight: TYPE.weight.bold, 
                      background: filter === f ? COLOR.interactive.selected : 'transparent',
                      color: filter === f ? COLOR.semantic.info : COLOR.text.muted,
                      border: 'none',
                      borderRight: f !== 'SELL' ? BORDER.standard : 'none',
                      cursor: 'pointer'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: COLOR.text.muted }}>
            <ListFilter size={10} />
            <span>THRESHOLD:</span>
            <input 
              type="number" 
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              style={{ background: COLOR.bg.base, border: BORDER.standard, color: COLOR.text.primary, padding: '2px 4px', width: '40px', fontSize: '9px', outline: 'none', fontFamily: TYPE.family.mono }}
            />
            <span>CR_INR</span>
         </div>
      </div>

      {/* List Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
        {nseBlockLoading && filteredDeals.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: COLOR.text.muted }}>POLLING_FEED...</div>
        ) : filteredDeals.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: COLOR.text.muted }}>NO_ACTIVE_FLOWS_DETECTED</div>
        ) : filteredDeals.map((deal: any, idx: number) => {
          const inWatchlist = watchlist.includes(deal.symbol);
          return (
          <div 
            key={idx} 
            style={{ 
                padding: '10px 12px', 
                borderBottom: BORDER.standard, 
                background: inWatchlist ? `${COLOR.semantic.warning}05` : COLOR.bg.base,
                position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                    fontSize: '9px', 
                    fontWeight: TYPE.weight.bold, 
                    color: inWatchlist ? COLOR.semantic.warning : COLOR.semantic.info,
                    border: `1px solid ${inWatchlist ? COLOR.semantic.warning : COLOR.semantic.info}40`,
                    padding: '1px 6px',
                    background: COLOR.bg.surface
                }}>
                  {deal.symbol}
                </span>
                <span style={{ 
                    fontSize: '8px', 
                    fontWeight: TYPE.weight.bold, 
                    color: deal.type === 'BUY' ? COLOR.semantic.up : COLOR.semantic.down,
                    textTransform: 'uppercase'
                }}>
                  {deal.type} Flow
                </span>
                {deal.value > 50 && <Zap size={10} style={{ color: COLOR.semantic.warning }} />}
              </div>
              <span style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary, fontVariantNumeric: 'tabular-nums' }}>
                  ₹{deal.value.toFixed(1)}CR
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: COLOR.text.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {deal.clientName}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: COLOR.text.muted, fontSize: '9px' }}>
                <span>QTY: <span style={{ color: COLOR.text.secondary, fontVariantNumeric: 'tabular-nums' }}>{deal.quantity.toLocaleString()}</span></span>
                <span>PRICE: <span style={{ color: COLOR.text.secondary, fontVariantNumeric: 'tabular-nums' }}>{deal.price.toFixed(2)}</span></span>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlockDealFeed;
