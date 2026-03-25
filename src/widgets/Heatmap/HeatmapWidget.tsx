import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { COLOR, TYPE } from '../../ds/tokens';
import { motion } from 'framer-motion';

export const HeatmapWidget: React.FC = () => {
  const { holdings } = useUpstoxStore();
  const { openHoldingDetails, openOrderModal } = useLayoutStore();
  const { setSelectedSymbol } = useSelectionStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];
    return holdings.map(h => {
        const qty = Number(h.quantity || 0);
        const avg = Number(h.average_price || 0);
        const ltp = Number(h.last_price || 0);
        const investment = qty * avg;
        const pnl = Number(h.pnl || 0);
        const pnlPct = investment > 0 ? (pnl / investment) * 100 : 0;
        return { ...h, investment, pnlPct };
    }).sort((a, b) => b.investment - a.investment);
  }, [holdings]);

  const treemapData = useMemo(() => {
    if (data.length === 0 || dimensions.width === 0 || dimensions.height === 0) return [];

    const sumValue = data.reduce((s, i) => s + i.investment, 0);
    const totalArea = dimensions.width * dimensions.height;
    const items = data.map(d => ({ ...d, area: (d.investment / sumValue) * totalArea }));
    const results: any[] = [];

    const getWorstRatio = (row: any[], length: number) => {
      if (row.length === 0) return Infinity;
      const rowArea = row.reduce((s, i) => s + i.area, 0);
      const minArea = Math.min(...row.map(i => i.area));
      const maxArea = Math.max(...row.map(i => i.area));
      return Math.max((length ** 2 * maxArea) / (rowArea ** 2), (rowArea ** 2) / (length ** 2 * minArea));
    };

    const layoutRow = (row: any[], rx: number, ry: number, rw: number, rh: number) => {
      const rowArea = row.reduce((s, i) => s + i.area, 0);
      const isVertical = rw < rh;
      const length = isVertical ? rw : rh;
      const thickness = rowArea / length;
      let offset = 0;

      row.forEach(item => {
        const span = item.area / thickness;
        if (isVertical) {
          results.push({ ...item, x: rx + offset, y: ry, w: span, h: thickness });
        } else {
          results.push({ ...item, x: rx, y: ry + offset, w: thickness, h: span });
        }
        offset += span;
      });
      return thickness;
    };

    let remaining = [...items];
    let rx = 0, ry = 0, rw = dimensions.width, rh = dimensions.height;

    while (remaining.length > 0) {
      const length = Math.min(rw, rh);
      let row: any[] = [];
      while (remaining.length > 0) {
        const item = remaining[0];
        const nextRow = [...row, item];
        if (getWorstRatio(nextRow, length) <= getWorstRatio(row, length)) {
          row.push(remaining.shift());
        } else {
          break;
        }
      }
      const thickness = layoutRow(row, rx, ry, rw, rh);
      if (rw < rh) { ry += thickness; rh -= thickness; } else { rx += thickness; rw -= thickness; }
    }
    return results;
  }, [data, dimensions]);

  const getHeatColor = (pct: number) => {
    if (pct === 0) return '#09090b';
    const absPct = Math.abs(pct);
    const opacity = Math.min(0.2 + (absPct / 20), 0.7); 
    return pct > 0 ? `rgba(52, 211, 153, ${opacity})` : `rgba(248, 113, 113, ${opacity})`;
  };

  return (
    <div style={{ height: '100%', background: '#000', padding: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '0 4px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: COLOR.text.primary, letterSpacing: '0.15em', textTransform: 'uppercase' }}>PORTFOLIO HEATMAP</span>
                <span style={{ fontSize: '8px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>SIZE = INVESTMENT VALUE | COLOR = UNREALIZED P&L%</span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'rgba(52, 211, 153, 0.6)', border: '1px solid #34d399' }} />
                    <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: 'bold' }}>PROFIT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'rgba(248, 113, 113, 0.6)', border: '1px solid #f87171' }} />
                    <span style={{ fontSize: '8px', color: COLOR.text.muted, fontWeight: 'bold' }}>LOSS</span>
                </div>
            </div>
       </div>

       <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#050505', border: '1px solid #111' }}>
            {treemapData.map((h, i) => {
                const color = getHeatColor(h.pnlPct);
                const isLoss = h.pnl < 0;
                const showDetails = h.w > 45 && h.h > 35;
                return (
                    <motion.div
                        key={h.instrument_token || i}
                        initial={false}
                        animate={{ left: h.x, top: h.y, width: h.w - 1, height: h.h - 1 }}
                        whileHover={{ zIndex: 10, outline: `1px solid ${isLoss ? '#f87171' : '#34d399'}`, filter: 'brightness(1.2)' }}
                        onClick={() => openHoldingDetails(h)}
                        style={{
                            position: 'absolute', background: color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', overflow: 'hidden', border: '0.2px solid rgba(0,0,0,1)'
                        }}
                    >
                        {showDetails && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <span style={{ 
                                    fontSize: Math.min(h.w / 5.5, 14), fontWeight: TYPE.weight.medium, color: COLOR.text.primary, 
                                    fontFamily: TYPE.family.mono, letterSpacing: '-0.02em', lineHeight: '1.1' 
                                }}>
                                    {h.trading_symbol}
                                </span>
                                <span style={{ 
                                    fontSize: Math.min(h.w / 11, 9), fontWeight: TYPE.weight.regular, color: 'rgba(255,255,255,0.8)', 
                                    fontFamily: TYPE.family.mono, marginTop: '2px', letterSpacing: '0.05em' 
                                }}>
                                    {h.pnlPct > 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                                </span>
                            </div>
                        )}
                    </motion.div>
                );
            })}
       </div>
    </div>
  );
};
