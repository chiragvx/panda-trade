import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Ship, Anchor, Search, Filter, Eye, EyeOff, Shield, Users, Radio, Map as MapIcon, Table, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { useSettingsStore } from '../../store/useSettingsStore';
import { EmptyState } from '../../ds/components/EmptyState';

// AIS Message Structure (Simplified)
interface VesselState {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  course: number;
  speed: number;
  type: number;
  typeStr: string;
  category: 'MILITARY' | 'CIVILIAN' | 'OTHER';
  lastSeen: number;
  country: string;
  destination: string;
}

const getVesselCategory = (type: number): 'MILITARY' | 'CIVILIAN' | 'OTHER' => {
    if (type === 35) return 'MILITARY';
    if ((type >= 60 && type <= 69) || (type >= 70 && type <= 89)) return 'CIVILIAN';
    return 'OTHER';
};

const getVesselTypeStr = (type: number): string => {
    if (type === 35) return 'MILITARY';
    if (type >= 60 && type <= 69) return 'PASSENGER';
    if (type >= 70 && type <= 79) return 'CARGO';
    if (type >= 80 && type <= 89) return 'TANKER';
    if (type === 30) return 'FISHING';
    if (type === 52) return 'TUG';
    if (type === 51) return 'SAR';
    return 'OTHER';
};

const getShipIcon = (course: number, category: string) => {
  let color: string = COLOR.text.muted;
  if (category === 'MILITARY') color = COLOR.semantic.down;
  if (category === 'CIVILIAN') color = COLOR.semantic.info;
  if (category === 'OTHER') color = COLOR.semantic.warning;
  
  const shadow = category === 'MILITARY' ? `filter: drop-shadow(0 0 4px ${COLOR.semantic.down});` : '';
  
  // Custom ship shape icon (pointy at one end)
  return L.divIcon({
    className: 'custom-ship-icon',
    html: `<div style="transform: rotate(${course}deg); color: ${color}; ${shadow} display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/>
            </svg>
          </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const MapController: React.FC<{ center?: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 9);
    }, [center, map]);
    return null;
};

const MarineMap: React.FC = () => {
  const { aisStreamApiKey } = useSettingsStore();
  const [vessels, setVessels] = useState<Record<number, VesselState>>({});
  const [selectedVessel, setSelectedVessel] = useState<VesselState | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ MILITARY: true, CIVILIAN: true, OTHER: true });
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'LIVE' | 'ERROR'>('IDLE');
  
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<Record<number, VesselState>>({});
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!aisStreamApiKey) {
        setStatus('IDLE');
        return;
    }

    const connect = () => {
        setStatus('CONNECTING');
        const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
        wsRef.current = ws;

        ws.onopen = () => {
            if (ws.readyState !== WebSocket.OPEN) return;
            console.log('AISStream Connected');
            setStatus('LIVE');
            
            // Regional Subscription (Indian Ocean / SE Asia) to prevent global overload
            // Format: [[[lat_min, lon_min], [lat_max, lon_max]]]
            ws.send(JSON.stringify({
                APIKey: aisStreamApiKey,
                BoundingBoxes: [[[-10, 40], [30, 100]]] 
            }));
        };

        ws.onmessage = async (event) => {
            let messageData = event.data;
            if (messageData instanceof Blob) {
                messageData = await messageData.text();
            }
            
            try {
                const data = JSON.parse(messageData);
                const mType = data.MessageType;
                
                if (['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport', 'StandardSearchAndRescueAircraftReport'].includes(mType)) {
                    const pos = data.Message[mType];
                    const meta = data.MetaData;
                    const mmsi = meta.MMSI;
                    
                    const lat = pos.Latitude ?? pos.latitude;
                    const lon = pos.Longitude ?? pos.longitude;
                    const course = pos.TrueHeading ?? pos.Cog ?? pos.cog ?? 0;
                    const speed = pos.Sog ?? pos.sog ?? 0;

                    if (lat === undefined || lon === undefined) return;

                    // Buffer update instead of immediate state set
                    bufferRef.current[mmsi] = {
                        ...(bufferRef.current[mmsi] || {}),
                        mmsi,
                        name: meta.ShipName?.trim() || bufferRef.current[mmsi]?.name || 'UNKNOWN',
                        lat,
                        lon,
                        course: (course === 511) ? (bufferRef.current[mmsi]?.course || 0) : course,
                        speed,
                        lastSeen: Date.now(),
                        country: meta.Country || meta.country || 'N/A',
                        destination: meta.Destination || bufferRef.current[mmsi]?.destination || '---',
                        type: bufferRef.current[mmsi]?.type || 0,
                        typeStr: bufferRef.current[mmsi]?.typeStr || 'UNKNOWN',
                        category: bufferRef.current[mmsi]?.category || 'OTHER',
                    };

                    // Sync buffer to state every 1.5 seconds to keep UI smooth
                    const now = Date.now();
                    if (now - lastSyncRef.current > 1500) {
                        setVessels(prev => {
                            const next = { ...prev, ...bufferRef.current };
                            // Cleanup: Remove vessels not seen in 10 minutes to prevent memory leaks
                            const expiry = now - 600000;
                            Object.keys(next).forEach(key => {
                                if (next[Number(key)].lastSeen < expiry) {
                                    delete next[Number(key)];
                                    delete bufferRef.current[Number(key)];
                                }
                            });
                            return next;
                        });
                        lastSyncRef.current = now;
                    }
                } else if (mType === 'ShipStaticData') {
                    const stat = data.Message.ShipStaticData;
                    const mmsi = data.MetaData.MMSI;
                    const type = stat.Type;
                    
                    if (bufferRef.current[mmsi]) {
                        bufferRef.current[mmsi].type = type;
                        bufferRef.current[mmsi].typeStr = getVesselTypeStr(type);
                        bufferRef.current[mmsi].category = getVesselCategory(type);
                    }
                }
            } catch (err) {
                // Ignore parsing errors
            }
        };

        ws.onerror = () => setStatus('ERROR');
        ws.onclose = () => {
            if (status !== 'IDLE') setTimeout(connect, 5000);
        };
    };

    connect();
    return () => {
        if (wsRef.current) wsRef.current.close();
    };
  }, [aisStreamApiKey]);

  const vesselList = useMemo(() => Object.values(vessels), [vessels]);

  const filteredVessels = useMemo(() => {
    return vesselList.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                             v.mmsi.toString().includes(search);
        
        if (!matchesSearch) return false;
        if (!filters[v.category]) return false;
        
        return true;
    });
  }, [vesselList, search, filters]);

  if (!aisStreamApiKey) {
      return (
          <EmptyState 
            icon={<Anchor size={48} color={COLOR.semantic.info} />}
            message="AISSTREAM_API_REQUIRED"
            subMessage="Please configure your AISStream.io API key in the Connectivity Dashboard to enable live Marine tracking."
          />
      );
  }

  return (
    <WidgetShell>
        <WidgetShell.Toolbar>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Anchor size={12} color={COLOR.semantic.info} />
                <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>
                    MARINE_MAP_LIVE
                </span>
            </div>
            <div style={{ fontSize: '9px', color: COLOR.text.muted, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: status === 'LIVE' ? COLOR.semantic.up : (status === 'ERROR' ? COLOR.semantic.down : COLOR.semantic.warning), 
                    animation: status === 'LIVE' ? 'pulse 2s infinite' : 'none' 
                }} />
                <span>{status}</span>
            </div>
        </WidgetShell.Toolbar>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <div style={{ width: '280px', borderRight: BORDER.standard, display: 'flex', flexDirection: 'column', background: COLOR.bg.surface }}>
                <div style={{ padding: '12px', background: COLOR.bg.elevated, borderBottom: BORDER.standard }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: COLOR.bg.surface, border: BORDER.standard, padding: '6px 10px', borderRadius: '2px', marginBottom: '12px' }}>
                        <Search size={12} color={COLOR.text.muted} />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="FIND_VESSEL/MMSI..."
                            style={{ background: 'transparent', border: 'none', outline: 'none', color: COLOR.text.primary, fontSize: '10px', fontFamily: TYPE.family.mono, width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <FilterBtn label="MILITARY" icon={<Shield size={10} />} active={filters.MILITARY} color={COLOR.semantic.down} onClick={() => setFilters(f => ({ ...f, MILITARY: !f.MILITARY }))} />
                        <FilterBtn label="CIVILIAN" icon={<Users size={10} />} active={filters.CIVILIAN} color={COLOR.semantic.info} onClick={() => setFilters(f => ({ ...f, CIVILIAN: !f.CIVILIAN }))} />
                        <FilterBtn label="OTHER" icon={<Radio size={10} />} active={filters.OTHER} color={COLOR.semantic.warning} onClick={() => setFilters(f => ({ ...f, OTHER: !f.OTHER }))} />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {filteredVessels.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.3 }}>
                            <Anchor size={32} style={{ margin: '0 auto 16px' }} />
                            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>NO VESSELS DETECTED</div>
                        </div>
                    ) : (
                        filteredVessels.slice(0, 100).map(v => (
                            <VesselRow key={v.mmsi} vessel={v} active={selectedVessel?.mmsi === v.mmsi} onClick={() => setSelectedVessel(v)} />
                        ))
                    )}
                </div>

                <div style={{ padding: '8px 12px', borderTop: BORDER.standard, fontSize: '8px', color: COLOR.text.muted, background: COLOR.bg.elevated }}>
                    TRACKING: {filteredVessels.length} VESSELS IN REGION
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', background: '#050505' }}>
                <MapContainer center={[18.9218, 72.8347]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                    <ZoomControl position="bottomright" />
                    <MapController center={selectedVessel ? [selectedVessel.lat, selectedVessel.lon] : undefined} />
                    
                    {filteredVessels.map(v => (
                        <Marker key={v.mmsi} position={[v.lat, v.lon]} icon={getShipIcon(v.course, v.category)} eventHandlers={{ click: () => setSelectedVessel(v) }}>
                            <Popup className="dark-popup">
                                <VesselPopupContent vessel={v} />
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    </WidgetShell>
  );
};

const FilterBtn: React.FC<{ label: string, icon: React.ReactNode, active: boolean, color: string, onClick: () => void }> = ({ label, icon, active, color, onClick }) => (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '6px 4px', background: active ? `${color}15` : COLOR.bg.surface, border: `1px solid ${active ? color : BORDER.standard}`, color: active ? color : COLOR.text.muted, borderRadius: '2px', cursor: 'pointer', transition: 'all 0.1s linear' }}>
        {icon}
        <span style={{ fontSize: '7px', fontWeight: 'bold' }}>{label}</span>
    </button>
);

const VesselRow: React.FC<{ vessel: VesselState, active: boolean, onClick: () => void }> = ({ vessel, active, onClick }) => {
    let accent: string = COLOR.text.muted;
    if (vessel.category === 'MILITARY') accent = COLOR.semantic.down;
    if (vessel.category === 'CIVILIAN') accent = COLOR.semantic.info;
    if (vessel.category === 'OTHER') accent = COLOR.semantic.warning;

    return (
        <div onClick={onClick} style={{ padding: '10px 12px', borderBottom: '1px solid #111', cursor: 'pointer', background: active ? `${accent}15` : 'transparent', borderLeft: `2px solid ${active ? accent : 'transparent'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: active ? COLOR.text.primary : COLOR.text.secondary, fontSize: '11px' }}>{vessel.name}</span>
                <span style={{ fontSize: '8px', color: accent, fontWeight: 'bold', background: `${accent}20`, padding: '1px 4px' }}>{vessel.typeStr}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '9px', color: COLOR.text.muted }}>
                <span>{vessel.speed.toFixed(1)} KN</span>
                <span>|</span>
                <span>HDG {vessel.course}°</span>
                <span style={{ marginLeft: 'auto' }}>MMSI: {vessel.mmsi}</span>
            </div>
        </div>
    );
};

const VesselPopupContent: React.FC<{ vessel: VesselState }> = ({ vessel }) => {
    let accent: string = COLOR.text.muted;
    if (vessel.category === 'MILITARY') accent = COLOR.semantic.down;
    if (vessel.category === 'CIVILIAN') accent = COLOR.semantic.info;
    if (vessel.category === 'OTHER') accent = COLOR.semantic.warning;

    return (
        <div style={{ background: '#000', color: '#fff', padding: '2px', fontSize: '11px', minWidth: '160px' }}>
            <div style={{ borderBottom: `1px solid ${accent}`, paddingBottom: '6px', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: accent }}>{vessel.name}</div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted }}>MMSI: {vessel.mmsi} • {vessel.country}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>SPEED</div>
                    <div style={{ fontWeight: 'bold' }}>{vessel.speed.toFixed(1)} kn</div>
                </div>
                <div>
                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>HEADING</div>
                    <div style={{ fontWeight: 'bold' }}>{vessel.course}°</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>STATUS_CATEGORY</div>
                    <div style={{ fontWeight: 'bold', color: accent }}>{vessel.category} ({vessel.typeStr})</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>DESTINATION</div>
                    <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{vessel.destination}</div>
                </div>
            </div>
        </div>
    );
};

export default MarineMap;
