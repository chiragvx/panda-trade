import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Ship, TrendingUp, Map as MapIcon, Table } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

const PORTS = [
  { name: 'JNPT_(NHAVA_SHEVA)', lat: 18.9480, lon: 72.9440, vessels: 42, type: 'CONTAINERS', stocks: ['ADANIPORTS', 'CONCOR'] },
  { name: 'MUNDRA_PORT', lat: 22.7333, lon: 69.7167, vessels: 38, type: 'COAL/DRY_BULK', stocks: ['COALINDIA', 'ADANIPORTS'] },
  { name: 'VIZAG_PORT', lat: 17.6868, lon: 83.2185, vessels: 24, type: 'STEEL/BULK', stocks: ['SAIL', 'JSPL'] },
  { name: 'CHENNAI_PORT', lat: 13.0836, lon: 80.2957, vessels: 18, type: 'AUTO/BULK', stocks: ['MARUTI', 'ASHOKLEY'] },
  { name: 'PARADIP_PORT', lat: 20.2961, lon: 86.6833, vessels: 31, type: 'CRUDE/COAL', stocks: ['BPCL', 'IOC', 'COALINDIA'] },
];

const PortMonitor: React.FC = () => {
  const [selectedPort, setSelectedPort] = useState<typeof PORTS[0] | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('table');

  const trendData = Array.from({ length: 7 }, (_, i) => ({ day: i, count: 25 + Math.random() * 20 }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, fontFamily: TYPE.family.mono }}>
      {/* Top Controls */}
      <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: COLOR.bg.elevated, border: BORDER.standard }}>
            <button 
              onClick={() => setViewMode('map')}
              style={{ 
                  padding: '4px 12px', 
                  fontSize: '9px', 
                  fontWeight: TYPE.weight.bold, 
                  background: viewMode === 'map' ? COLOR.interactive.selected : 'transparent',
                  color: viewMode === 'map' ? COLOR.semantic.info : COLOR.text.muted,
                  border: 'none',
                  cursor: 'pointer'
              }}
            >
                <MapIcon size={10} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> MAP_VISUAL
            </button>
            <button 
              onClick={() => setViewMode('table')}
              style={{ 
                  padding: '4px 12px', 
                  fontSize: '9px', 
                  fontWeight: TYPE.weight.bold, 
                  background: viewMode === 'table' ? COLOR.interactive.selected : 'transparent',
                  color: viewMode === 'table' ? COLOR.semantic.info : COLOR.text.muted,
                  borderLeft: BORDER.standard,
                  cursor: 'pointer'
              }}
            >
                <Table size={10} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> CORRELATION_MATRIX
            </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
            <Ship size={12} style={{ color: COLOR.semantic.info }} />
            <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase' }}>AIS_LIVE_FEED:ACTIVE</span>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
         {/* Details Panel Overlay */}
         {selectedPort && (
            <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 100, width: '240px', background: COLOR.bg.surface, border: BORDER.standard, padding: '12px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                     <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{selectedPort.name}</div>
                     <div style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', marginTop: '2px' }}>{selectedPort.type}</div>
                  </div>
                  <button onClick={() => setSelectedPort(null)} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer', fontSize: '14px' }}>×</button>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '16px' }}>
                  <div>
                     <span style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', display: 'block' }}>VESSEL_COUNT</span>
                     <span style={{ fontSize: '18px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary, fontVariantNumeric: 'tabular-nums' }}>{selectedPort.vessels}</span>
                  </div>
                  <div style={{ height: '32px', width: '80px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                       <AreaChart data={trendData}>
                          <Area type="monotone" dataKey="count" stroke={COLOR.semantic.info} strokeWidth={1} fill={`${COLOR.semantic.info}10`} isAnimationActive={false} />
                       </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', marginBottom: '4px' }}>CORRELATED_EQUITIES</span>
                  {selectedPort.stocks.map(stock => (
                     <div key={stock} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: COLOR.bg.elevated, border: BORDER.standard, alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{stock}</span>
                        <div style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.up, fontVariantNumeric: 'tabular-nums' }}>+1.2%</div>
                     </div>
                  ))}
               </div>
            </div>
         )}

          {viewMode === 'map' ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.bg.base, color: COLOR.text.muted, fontSize: '9px', fontWeight: TYPE.weight.bold, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>
                MAP_ENGINE_OFFLINE_FOR_MAINTENANCE
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                     <tr style={{ background: COLOR.bg.surface, borderBottom: BORDER.standard }}>
                        <th style={{ padding: '8px 12px', fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase' }}>PRIMARY_PORT</th>
                        <th style={{ padding: '8px 12px', fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', textAlign: 'right' }}>ACTIVITY_7D_CHG</th>
                        <th style={{ padding: '8px 12px', fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', textAlign: 'right' }}>PROXY_RETURN</th>
                        <th style={{ padding: '8px 12px', fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', textAlign: 'right' }}>CORRELATION_RANK</th>
                     </tr>
                  </thead>
                  <tbody>
                     {PORTS.map((port, i) => (
                        <tr key={i} style={{ borderBottom: BORDER.standard }} className="hover:bg-interactive-hover transition-colors">
                           <td style={{ padding: '12px' }}>
                              <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{port.name.replace(/_/g, ' ')}</div>
                              <div style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase' }}>{port.type}</div>
                           </td>
                           <td style={{ padding: '12px', textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.info, fontVariantNumeric: 'tabular-nums' }}>+{Math.floor(Math.random() * 15)}%</div>
                              <div style={{ fontSize: '8px', color: COLOR.text.muted }}>1.2X ROLLING_AVG</div>
                           </td>
                           <td style={{ padding: '12px', textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.up, fontVariantNumeric: 'tabular-nums' }}>+2.45%</span>
                           </td>
                           <td style={{ padding: '12px', textAlign: 'right' }}>
                              <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.semantic.up, border: `1px solid ${COLOR.semantic.up}40`, padding: '2px 6px', background: `${COLOR.semantic.up}10`, textTransform: 'uppercase' }}>
                                 HIGH_CORRELATION
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}
      </div>
    </div>
  );
};

export default PortMonitor;
