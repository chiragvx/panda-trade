import React, { useMemo, useState, useEffect } from 'react';
import { Plane, Radio, Search, Shield, Users, Info, RefreshCw } from 'lucide-react';
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
import axios from 'axios';

// Aircraft interface matching OpenSky/ADSB.lol state vector format
interface AircraftState {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  geo_altitude: number | null;
  squawk: string | null;
  category: 'MILITARY' | 'CIVILIAN' | 'OTHER';
}

const CLASSIFIERS = {
    CIVIL_PREFIXES: ['IGO', 'AIC', 'VTI', 'SEJ', 'GOW', 'AKJ', 'AXB', 'IAD', 'LLR', 'AF', 'BAW', 'DLH', 'UAE', 'QTR', 'ETD', 'SIA', 'THY', 'JAL', 'ANA', 'CCA', 'CES'],
    MIL_PREFIXES: ['IAF', 'ICG', 'NVY', 'RCM', 'RSF', 'GSTR', 'ASY', 'CFC', 'PAT', 'SAM', 'HVK', 'SDR'],
};

const classifyAircraft = (callsign: string): 'MILITARY' | 'CIVILIAN' | 'OTHER' => {
    const cs = callsign.toUpperCase();
    if (CLASSIFIERS.MIL_PREFIXES.some(p => cs.startsWith(p))) return 'MILITARY';
    if (CLASSIFIERS.CIVIL_PREFIXES.some(p => cs.startsWith(p))) return 'CIVILIAN';
    return 'OTHER';
};

const getPlaneIcon = (course: number, category: string) => {
  let color: string = COLOR.text.muted;
  if (category === 'MILITARY') color = COLOR.semantic.down;
  if (category === 'CIVILIAN') color = COLOR.semantic.info;
  if (category === 'OTHER') color = COLOR.semantic.warning;
  
  const shadow = category === 'MILITARY' ? `filter: drop-shadow(0 0 4px ${COLOR.semantic.down});` : '';
  
  return L.divIcon({
    className: 'custom-plane-icon',
    html: `<div style="transform: rotate(${course}deg); color: ${color}; ${shadow} display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"/>
            </svg>
          </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const MapController: React.FC<{ center?: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 8);
    }, [center, map]);
    return null;
};

const FlightMap: React.FC = () => {
  const [flights, setFlights] = useState<AircraftState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState<AircraftState | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ MILITARY: true, CIVILIAN: true, OTHER: true });

  const fetchFlights = async () => {
    try {
      const response = await axios.get('https://api.adsb.lol/v2/point/21/78/1500');
      if (response.data && response.data.ac) {
        const mapped: AircraftState[] = response.data.ac.map((s: any) => {
          const callsign = (s.flight?.trim() || 'N/A').toUpperCase();
          let cat = classifyAircraft(callsign);
          if (s.desc?.toUpperCase().includes('MILITARY') || s.mil === 1) cat = 'MILITARY';

          return {
            icao24: s.hex,
            callsign,
            origin_country: s.dbFlags === 1 ? 'REDACTED' : 'GLOBAL',
            time_position: Date.now() / 1000,
            last_contact: Date.now() / 1000,
            longitude: s.lon,
            latitude: s.lat,
            baro_altitude: (s.alt_baro || 0) / 3.28084,
            on_ground: s.alt_baro === 'ground',
            velocity: (s.gs || 0) / 1.94384,
            true_track: s.track || 0,
            vertical_rate: s.baro_rate || 0,
            geo_altitude: (s.alt_geo || 0) / 3.28084,
            squawk: s.squawk,
            category: cat
          };
        }).filter((f: AircraftState) => f.latitude !== null && f.longitude !== null);
        
        setFlights(mapped);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch flight data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
    const interval = setInterval(fetchFlights, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
        const matchesSearch = f.callsign.toLowerCase().includes(search.toLowerCase()) || 
                             f.icao24.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (!filters[f.category]) return false;
        return true;
    });
  }, [flights, search, filters]);

  return (
    <WidgetShell>
        <WidgetShell.Toolbar>
            <WidgetShell.Toolbar.Left>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plane size={14} color={COLOR.semantic.info} />
                    <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>
                        ADSB_LITE_RADAR [IND_SUB]
                    </Text>
                    <Badge label="PUBLIC_FEED" variant="info" />
                </div>
            </WidgetShell.Toolbar.Left>
            <WidgetShell.Toolbar.Right>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR.semantic.up, boxShadow: `0 0 8px ${COLOR.semantic.up}` }} />
                    <Text size="xs" color="muted" weight="bold">UPDATED: {lastUpdate.toLocaleTimeString()}</Text>
                    <button onClick={fetchFlights} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }} className={loading ? 'animate-spin' : ''}>
                        <RefreshCw size={14} />
                    </button>
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
                            placeholder="FIND_CALLSIGN/ICAO..."
                            style={{ background: 'transparent', border: 'none', outline: 'none', color: COLOR.text.primary, fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                        <Tooltip content="MILITARY_ASSETS" position="bottom">
                            <FilterBtn icon={<Shield size={12} />} active={filters.MILITARY} color="down" onClick={() => setFilters(f => ({ ...f, MILITARY: !f.MILITARY }))} />
                        </Tooltip>
                        <Tooltip content="CIVILIAN_AIRCRAFT" position="bottom">
                            <FilterBtn icon={<Users size={12} />} active={filters.CIVILIAN} color="info" onClick={() => setFilters(f => ({ ...f, CIVILIAN: !f.CIVILIAN }))} />
                        </Tooltip>
                        <Tooltip content="OTHER_VECTORS" position="bottom">
                            <FilterBtn icon={<Radio size={12} />} active={filters.OTHER} color="warning" onClick={() => setFilters(f => ({ ...f, OTHER: !f.OTHER }))} />
                        </Tooltip>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {filteredFlights.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.3 }}>
                            <Plane size={32} color={COLOR.text.muted} style={{ margin: '0 auto 16px' }} />
                            <Text size="xs" weight="black">NO ASSETS DETECTED</Text>
                        </div>
                    ) : (
                        filteredFlights.slice(0, 100).map(f => (
                            <FlightRow key={f.icao24} flight={f} active={selectedFlight?.icao24 === f.icao24} onClick={() => setSelectedFlight(f)} />
                        ))
                    )}
                </div>

                <div style={{ height: '32px', display: 'flex', alignItems: 'center', padding: '0 12px', borderTop: BORDER.standard, background: COLOR.bg.elevated }}>
                    <Text size="xs" weight="black" color="muted">RADAR_HITS: {filteredFlights.length} / {flights.length}</Text>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', background: COLOR.bg.base }}>
                <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                    <ZoomControl position="bottomright" />
                    <MapController center={selectedFlight ? [selectedFlight.latitude!, selectedFlight.longitude!] : undefined} />
                    
                    {filteredFlights.map(f => (
                        <Marker key={f.icao24} position={[f.latitude!, f.longitude!]} icon={getPlaneIcon(f.true_track || 0, f.category)} eventHandlers={{ click: () => setSelectedFlight(f) }}>
                            <Popup className="dark-popup">
                                <PopupContent flight={f} />
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

const FlightRow: React.FC<{ flight: AircraftState, active: boolean, onClick: () => void }> = ({ flight, active, onClick }) => {
    let semantic: keyof typeof COLOR.semantic = 'muted';
    if (flight.category === 'MILITARY') semantic = 'down';
    if (flight.category === 'CIVILIAN') semantic = 'info';
    if (flight.category === 'OTHER') semantic = 'warning';

    return (
        <div onClick={onClick} style={{ padding: '10px 12px', borderBottom: BORDER.standard, cursor: 'pointer', background: active ? `${COLOR.semantic[semantic]}15` : 'transparent', borderLeft: `2px solid ${active ? COLOR.semantic[semantic] : 'transparent'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <Text weight="black" size="md" color={active ? 'primary' : 'secondary'}>{flight.callsign || 'N/A'}</Text>
                <Badge label={flight.category} variant={semantic as any} />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Text family="mono" size="xs" color="muted" weight="bold">{(Math.round((flight.baro_altitude || 0) * 3.28084)).toLocaleString()} FT</Text>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: COLOR.border.strong }} />
                <Text family="mono" size="xs" color="muted" weight="bold">{flight.velocity ? Math.round(flight.velocity * 1.94384) : 0} KT</Text>
                <Text family="mono" size="xs" color="muted" weight="black" style={{ marginLeft: 'auto' }}>{flight.icao24.toUpperCase()}</Text>
            </div>
        </div>
    );
};

const PopupContent: React.FC<{ flight: AircraftState }> = ({ flight }) => {
    let semantic: keyof typeof COLOR.semantic = 'muted';
    if (flight.category === 'MILITARY') semantic = 'down';
    if (flight.category === 'CIVILIAN') semantic = 'info';
    if (flight.category === 'OTHER') semantic = 'warning';

    return (
        <div style={{ background: COLOR.bg.base, color: COLOR.text.primary, padding: SPACE[3], minWidth: '180px' }}>
            <div style={{ borderBottom: `1px solid ${COLOR.semantic[semantic]}`, paddingBottom: SPACE[2], marginBottom: SPACE[3] }}>
                <Text size="lg" weight="black" color="primary" block>{flight.callsign || 'UNKNOWN'}</Text>
                <Text size="xs" color="muted" weight="bold" block>{flight.origin_country} • {flight.icao24.toUpperCase()}</Text>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[3] }}>
                <div>
                    <Text variant="label" size="xs" color="muted" block>ALTITUDE</Text>
                    <Text family="mono" weight="black" size="sm">{(Math.round((flight.baro_altitude || 0) * 3.28084)).toLocaleString()} ft</Text>
                </div>
                <div>
                    <Text variant="label" size="xs" color="muted" block>SPEED</Text>
                    <Text family="mono" weight="black" size="sm">{flight.velocity ? Math.round(flight.velocity * 1.94384) : 0} kt</Text>
                </div>
                <div>
                    <Text variant="label" size="xs" color="muted" block>HEADING</Text>
                    <Text family="mono" weight="black" size="sm">{Math.round(flight.true_track || 0)}°</Text>
                </div>
                <div>
                    <Text variant="label" size="xs" color="muted" block>SQUAWK</Text>
                    <Text family="mono" weight="black" size="sm" color={flight.squawk === '7700' ? 'down' : 'primary'}>{flight.squawk || '----'}</Text>
                </div>
            </div>
            <div style={{ marginTop: SPACE[3], paddingTop: SPACE[2], borderTop: BORDER.standard, textAlign: 'center' }}>
                <Badge label={`SEC_LEVEL: ${flight.category === 'MILITARY' ? 'HIGH_INTENT' : 'STANDARD'}`} variant={semantic as any} />
            </div>
        </div>
    );
};

export default FlightMap;
