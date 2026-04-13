import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Ship, Anchor, Search, Filter, Shield, Users, Radio, Info, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { 
  COLOR, 
  TYPE, 
  BORDER, 
  SPACE, 
  Text, 
  Badge, 
  WidgetShell,
  EmptyState,
  Tooltip 
} from '../../ds';
import { useSettingsStore } from '../../store/useSettingsStore';

// AIS Message Structure
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
            setStatus('LIVE');
            ws.send(JSON.stringify({
                APIKey: aisStreamApiKey,
                BoundingBoxes: [[[-10, 40], [30, 100]]] 
            }));
        };

        ws.onmessage = async (event) => {
            let messageData = event.data;
            if (messageData instanceof Blob) messageData = await messageData.text();
            
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

                    const now = Date.now();
                    if (now - lastSyncRef.current > 1500) {
                        setVessels(prev => {
                            const next = { ...prev, ...bufferRef.current };
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
            } catch (err) {}
        };

        ws.onerror = () => setStatus('ERROR');
        ws.onclose = () => {
            if (status !== 'IDLE') setTimeout(connect, 5000);
        };
    };

    connect();
    return () => { if (wsRef.current) wsRef.current.close(); };
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
            message="AIS_STREAM_API_REQUIRED"
            subMessage="Please configure your AISStream.io API key in the Connectivity Dashboard."
          />
      );
  }

  return (
    <WidgetShell>
        <WidgetShell.Toolbar>
            <WidgetShell.Toolbar.Left>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Anchor size={14} color={COLOR.semantic.info} />
                    <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                        MARINE_TRACKER_LIVE [AIS]
                    </Text>
                </div>
            </WidgetShell.Toolbar.Left>
            <WidgetShell.Toolbar.Right>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: status === 'LIVE' ? COLOR.semantic.up : (status === 'ERROR' ? COLOR.semantic.danger : COLOR.semantic.warning), 
                        boxShadow: status === 'LIVE' ? `0 0 8px ${COLOR.semantic.up}` : 'none' 
                    }} />
                    <Text size="xs" weight="black" color="muted">{status}</Text>
                </div>
            </WidgetShell.Toolbar.Right>
        </WidgetShell.Toolbar>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <div style={{ width: '280px', borderRight: BORDER.standard, display: 'flex', flexDirection: 'column', background: COLOR.bg.surface }}>
                <div style={{ padding: SPACE[3], background: COLOR.bg.elevated, borderBottom: BORDER.standard }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], background: COLOR.bg.surface, border: BORDER.standard, padding: '6px 10px', borderRadius: '2px', marginBottom: SPACE[3] }}>
                        <Search size={14} color={COLOR.text.muted} />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="FIND_VESSEL..."
                            style={{ background: 'transparent', border: 'none', outline: 'none', color: COLOR.text.primary, fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                        <Tooltip content="MILITARY_ASSETS" position="bottom">
                            <FilterBtn icon={<Shield size={12} />} active={filters.MILITARY} color="down" onClick={() => setFilters(f => ({ ...f, MILITARY: !f.MILITARY }))} />
                        </Tooltip>
                        <Tooltip content="CIVILIAN_VESSELS" position="bottom">
                            <FilterBtn icon={<Users size={12} />} active={filters.CIVILIAN} color="info" onClick={() => setFilters(f => ({ ...f, CIVILIAN: !f.CIVILIAN }))} />
                        </Tooltip>
                        <Tooltip content="OTHER_TRACKS" position="bottom">
                            <FilterBtn icon={<Radio size={12} />} active={filters.OTHER} color="warning" onClick={() => setFilters(f => ({ ...f, OTHER: !f.OTHER }))} />
                        </Tooltip>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {filteredVessels.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.3 }}>
                            <Anchor size={32} color={COLOR.text.muted} style={{ margin: '0 auto 16px' }} />
                            <Text size="xs" weight="black">NO VESSELS DETECTED</Text>
                        </div>
                    ) : (
                        filteredVessels.slice(0, 100).map(v => (
                            <VesselRow key={v.mmsi} vessel={v} active={selectedVessel?.mmsi === v.mmsi} onClick={() => setSelectedVessel(v)} />
                        ))
                    )}
                </div>

                <div style={{ height: '32px', display: 'flex', alignItems: 'center', padding: '0 12px', borderTop: BORDER.standard, background: COLOR.bg.elevated }}>
                    <Text size="xs" weight="black" color="muted">TRACKING: {filteredVessels.length} TARGETS</Text>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', background: COLOR.bg.base }}>
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

const FilterBtn: React.FC<{ icon: React.ReactNode, active: boolean, color: keyof typeof COLOR.semantic, onClick: () => void }> = ({ icon, active, color, onClick }) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '28px', width: '28px', background: active ? `${COLOR.semantic[color]}15` : COLOR.bg.surface, border: `1px solid ${active ? COLOR.semantic[color] : COLOR.bg.border}`, color: active ? COLOR.semantic[color] : COLOR.text.muted, borderRadius: '2px', cursor: 'pointer' }}>
        {icon}
    </button>
);

const VesselRow: React.FC<{ vessel: VesselState, active: boolean, onClick: () => void }> = ({ vessel, active, onClick }) => {
    let semantic: keyof typeof COLOR.semantic = 'muted';
    if (vessel.category === 'MILITARY') semantic = 'down';
    if (vessel.category === 'CIVILIAN') semantic = 'info';
    if (vessel.category === 'OTHER') semantic = 'warning';

    return (
        <div onClick={onClick} style={{ padding: '10px 12px', borderBottom: BORDER.standard, cursor: 'pointer', background: active ? `${COLOR.semantic[semantic]}15` : 'transparent', borderLeft: `2px solid ${active ? COLOR.semantic[semantic] : 'transparent'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <Text weight="black" size="md" color={active ? 'primary' : 'secondary'}>{vessel.name}</Text>
                <Badge label={vessel.typeStr} variant={semantic as any} />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Text family="mono" size="xs" color="muted" weight="bold">{vessel.speed.toFixed(1)} KN</Text>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: COLOR.bg.border }} />
                <Text family="mono" size="xs" color="muted" weight="bold">HDG {vessel.course}°</Text>
                <Text family="mono" size="xs" color="muted" weight="black" style={{ marginLeft: 'auto' }}>#{vessel.mmsi}</Text>
            </div>
        </div>
    );
};

const VesselPopupContent: React.FC<{ vessel: VesselState }> = ({ vessel }) => {
    let semantic: keyof typeof COLOR.semantic = 'muted';
    if (vessel.category === 'MILITARY') semantic = 'down';
    if (vessel.category === 'CIVILIAN') semantic = 'info';
    if (vessel.category === 'OTHER') semantic = 'warning';

    return (
        <div style={{ background: COLOR.bg.base, color: COLOR.text.primary, padding: SPACE[3], minWidth: '180px' }}>
            <div style={{ borderBottom: `1px solid ${COLOR.semantic[semantic]}`, paddingBottom: SPACE[2], marginBottom: SPACE[3] }}>
                <Text size="lg" weight="black" color="primary" block>{vessel.name}</Text>
                <Text size="xs" color="muted" weight="bold" block>#{vessel.mmsi} • {vessel.country}</Text>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[3] }}>
                <div>
                    <Text variant="label" size="xs" color="muted" block>SPEED</Text>
                    <Text family="mono" weight="black" size="sm">{vessel.speed.toFixed(1)} KN</Text>
                </div>
                <div>
                    <Text variant="label" size="xs" color="muted" block>HEADING</Text>
                    <Text family="mono" weight="black" size="sm">{vessel.course}°</Text>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <Text variant="label" size="xs" color="muted" block>IDENT_CAT</Text>
                    <Text weight="black" size="sm" color={semantic}>{vessel.category} ({vessel.typeStr})</Text>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <Text variant="label" size="xs" color="muted" block>DESTINATION</Text>
                    <Text weight="black" size="xs">{vessel.destination}</Text>
                </div>
            </div>
        </div>
    );
};

export default MarineMap;
