import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Anchor, Ship, TrendingUp, TrendingDown, Info, ExternalLink, Map as MapIcon, Table } from 'lucide-react';

const PORTS = [
  { name: 'JNPT (Nhava Sheva)', lat: 18.9480, lon: 72.9440, vessels: 42, type: 'Containers', stocks: ['ADANIPORTS', 'CONCOR'] },
  { name: 'Mundra Port', lat: 22.7333, lon: 69.7167, vessels: 38, type: 'Coal/Dry Bulk', stocks: ['COALINDIA', 'ADANIPORTS'] },
  { name: 'Vizag Port', lat: 17.6868, lon: 83.2185, vessels: 24, type: 'Steel/Bulk', stocks: ['SAIL', 'JSPL'] },
  { name: 'Chennai Port', lat: 13.0836, lon: 80.2957, vessels: 18, type: 'Automobile/Bulk', stocks: ['MARUTI', 'ASHOKLEY'] },
  { name: 'Paradip Port', lat: 20.2961, lon: 86.6833, vessels: 31, type: 'Crude/Coal', stocks: ['BPCL', 'IOC', 'COALINDIA'] },
];

const PortMonitor: React.FC = () => {
  const [selectedPort, setSelectedPort] = useState<typeof PORTS[0] | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

  // Vessel trend mock
  const trendData = Array.from({ length: 7 }, (_, i) => ({ day: i, count: 25 + Math.random() * 20 }));

  return (
    <div className="h-full flex flex-col bg-[#050505] overflow-hidden">
      {/* Top Toggle */}
      <div className="p-3 border-b border-[#111] bg-[#0A0A0A] flex justify-between items-center">
        <div className="flex bg-[#141414] p-0.5 rounded-lg border border-[#1E1E1E]">
            <button 
              onClick={() => setViewMode('map')}
              className={`p-1.5 px-3 rounded-md text-[10px] font-black tracking-widest transition-all ${viewMode === 'map' ? 'bg-[#222] text-accent-info' : 'text-text-muted hover:text-white'}`}
            >
                <MapIcon size={12} className="inline mr-1.5" /> MAP
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 px-3 rounded-md text-[10px] font-black tracking-widest transition-all ${viewMode === 'table' ? 'bg-[#222] text-accent-info' : 'text-text-muted hover:text-white'}`}
            >
                <Table size={12} className="inline mr-1.5" /> CORRELATION
            </button>
        </div>
        <div className="flex items-center gap-1.5 opacity-50">
            <Ship size={12} className="text-blue-400" />
            <span className="text-[9px] font-bold text-text-muted uppercase">AIS LIVE FEED ACTIVE</span>
        </div>
      </div>

      <div className="flex-1 relative flex">
         {/* Sidebar for Port Details */}
         {selectedPort && (
            <div className="absolute top-4 left-4 z-[1000] w-64 bg-[#0A0A0A]/95 backdrop-blur border border-[#1E1E1E] rounded-xl shadow-2xl p-4 animate-in slide-in-from-left duration-300">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <h5 className="text-xs font-black text-white">{selectedPort.name}</h5>
                     <p className="text-[9px] text-text-muted font-bold tracking-wide uppercase mt-1">{selectedPort.type}</p>
                  </div>
                  <button onClick={() => setSelectedPort(null)} className="text-text-muted hover:text-white transition-colors">×</button>
               </div>

               <div className="flex justify-between items-end mb-4">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-bold text-text-muted uppercase">Vessel Count</span>
                     <span className="text-xl font-black text-white tabular-nums">{selectedPort.vessels}</span>
                  </div>
                  <div className="h-8 w-24">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                           <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={1.5} fill="transparent" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="space-y-2">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Related Equities</span>
                  {selectedPort.stocks.map(stock => (
                     <div key={stock} className="flex justify-between p-2 rounded bg-[#111] border border-white/5 items-center group/stock cursor-pointer">
                        <span className="text-[10px] font-black text-white group-hover/stock:text-accent-info transition-colors">{stock}</span>
                        <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold tabular-nums">
                           <TrendingUp size={10} /> +1.2%
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Leaflet Map */}
         {viewMode === 'map' ? (
           <MapContainer 
             center={[20.5937, 78.9629]} 
             zoom={4.5} 
             scrollWheelZoom={false}
             className="h-full w-full bg-[#050505] grayscale-[0.8] invert-[0.9] subpixel-antialiased"
             zoomControl={false}
           >
             <TileLayer 
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
               opacity={0.3}
             />
             {PORTS.map(port => (
               <CircleMarker 
                 key={port.name}
                 center={[port.lat, port.lon]}
                 radius={Math.sqrt(port.vessels) * 2}
                 fillColor="#3B82F6"
                 color="#3B82F6"
                 weight={1.5}
                 opacity={0.8}
                 fillOpacity={0.2}
                 eventHandlers={{
                    click: () => {
                      setSelectedPort(port);
                    }
                  }}
               >
                 <Popup closeButton={false} className="custom-popup">
                    <span className="text-[10px] font-bold">{port.name}: {port.vessels} vessels</span>
                 </Popup>
               </CircleMarker>
             ))}
           </MapContainer>
         ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[#050505]">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-[#0A0A0A] border-b border-[#111] sticky top-0 z-10">
                        <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Primary Port</th>
                        <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Activity (7d chg)</th>
                        <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Proxy Return</th>
                        <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Alpha Proxy</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111]">
                     {PORTS.map((port, i) => (
                        <tr key={i} className="hover:bg-[#0A0A0A] transition-colors group">
                           <td className="px-4 py-4">
                              <div className="flex flex-col gap-1">
                                 <span className="text-[11px] font-black text-white">{port.name.split(' (')[0]}</span>
                                 <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{port.type}</span>
                              </div>
                           </td>
                           <td className="px-4 py-4 text-right">
                              <div className="flex flex-col items-end gap-1">
                                 <span className="text-[11px] font-black text-blue-400">+{Math.floor(Math.random() * 15)}%</span>
                                 <span className="text-[9px] text-[#444] font-bold tabular-nums">1.2x Rolling Avg</span>
                              </div>
                           </td>
                           <td className="px-4 py-4 text-right">
                              <span className="text-[11px] font-black text-green-500 tabular-nums">+{Math.random() > 0.5 ? (Math.random()*4).toFixed(2) : -(Math.random()*2).toFixed(2)}%</span>
                           </td>
                           <td className="px-4 py-4 text-right">
                              <div className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 ring-1 ring-green-500/20 uppercase tracking-tighter">
                                 High Correlation
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { background: #050505 !important; }
        .custom-popup .leaflet-popup-content-wrapper { background: #0A0A0A; color: #FFF; border: 1px solid #1E1E1E; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .custom-popup .leaflet-popup-tip { background: #0A0A0A; border: 1px solid #1E1E1E; }
        .leaflet-bar a { background-color: #0A0A0A !important; color: #888 !important; border-bottom: 1px solid #141414 !important; }
      `}} />
    </div>
  );
};

export default PortMonitor;
