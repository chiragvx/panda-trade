import React, { useMemo, useState, useEffect } from 'react';
import { Plane, MapPin, Navigation, History, CornerDownRight, ShieldAlert, Zap, Layers, Maximize2, Crosshair, Search, Filter, Eye, EyeOff, Shield, Users, Radio } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { useSettingsStore } from '../../store/useSettingsStore';
import axios from 'axios';

// Aircraft interface matching OpenSky state vector format
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

// Heuristic Classification
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
  if (category === 'MILITARY') color = COLOR.semantic.down; // Red for military
  if (category === 'CIVILIAN') color = COLOR.semantic.info; // Cyan/Blue for civilian
  if (category === 'OTHER') color = COLOR.semantic.warning; // Orange for other/private
  
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
  const { openSkyUsername, openSkyPassword } = useSettingsStore();
  const [flights, setFlights] = useState<AircraftState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState<AircraftState | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
      MILITARY: true,
      CIVILIAN: true,
      OTHER: true
  });

  const fetchFlights = async () => {
    try {
      const config: any = {};
      if (openSkyUsername && openSkyPassword) {
        config.auth = {
          username: openSkyUsername,
          password: openSkyPassword
        };
      }

      const response = await axios.get('https://opensky-network.org/api/states/all?lamin=8.0&lomin=68.0&lamax=37.0&lomax=97.0', config);
      if (response.data && response.data.states) {
        const mapped: AircraftState[] = response.data.states.map((s: any[]) => {
          const callsign = (s[1]?.trim() || '').toUpperCase();
          return {
            icao24: s[0],
            callsign,
            origin_country: s[2],
            time_position: s[3],
            last_contact: s[4],
            longitude: s[5],
            latitude: s[6],
            baro_altitude: s[7],
            on_ground: s[8],
            velocity: s[9],
            true_track: s[10] || 0,
            vertical_rate: s[11],
            geo_altitude: s[13],
            squawk: s[14],
            category: classifyAircraft(callsign)
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

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <WidgetShell>
        <WidgetShell.Toolbar>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Plane size={12} color={COLOR.semantic.info} />
                <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>
                    PUBLIC_ADSB_RADAR
                </span>
                <div style={{ 
                    fontSize: '8px', 
                    padding: '1px 6px', 
                    background: '#00ffff10', 
                    color: COLOR.semantic.info, 
                    borderRadius: '2px', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <Radio size={8} /> PUBLIC_FEED
                </div>
            </div>
            <div style={{ fontSize: '9px', color: COLOR.text.muted, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLOR.semantic.up, animation: 'pulse 2s infinite' }} />
                <span>UPDATED: {lastUpdate.toLocaleTimeString()}</span>
            </div>
        </WidgetShell.Toolbar>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            {/* Sidebar Controls */}
            <div style={{ width: '280px', borderRight: BORDER.standard, display: 'flex', flexDirection: 'column', background: COLOR.bg.surface }}>
                <div style={{ padding: '12px', background: COLOR.bg.elevated, borderBottom: BORDER.standard }}>
                    {/* Search Strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: COLOR.bg.surface, border: BORDER.standard, padding: '6px 10px', borderRadius: '2px', marginBottom: '12px' }}>
                        <Search size={12} color={COLOR.text.muted} />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="FIND_CALLSIGN/ICAO..."
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                outline: 'none', 
                                color: COLOR.text.primary, 
                                fontSize: '10px', 
                                fontFamily: TYPE.family.mono,
                                width: '100%'
                            }}
                        />
                    </div>

                    {/* Filter Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                        <FilterBtn 
                            label="MILITARY" 
                            icon={<Shield size={10} />} 
                            active={filters.MILITARY} 
                            color={COLOR.semantic.down}
                            onClick={() => toggleFilter('MILITARY')} 
                        />
                        <FilterBtn 
                            label="CIVILIAN" 
                            icon={<Users size={10} />} 
                            active={filters.CIVILIAN} 
                            color={COLOR.semantic.info}
                            onClick={() => toggleFilter('CIVILIAN')} 
                        />
                        <FilterBtn 
                            label="OTHER" 
                            icon={<Radio size={10} />} 
                            active={filters.OTHER} 
                            color={COLOR.semantic.warning}
                            onClick={() => toggleFilter('OTHER')} 
                        />
                    </div>
                </div>

                {/* List Container */}
                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {filteredFlights.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.3 }}>
                            <Plane size={32} style={{ margin: '0 auto 16px' }} />
                            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>NO ASSETS DETECTED</div>
                            <div style={{ fontSize: '9px', marginTop: '4px' }}>Adjust filters or search query</div>
                        </div>
                    ) : (
                        filteredFlights.slice(0, 100).map(f => (
                            <FlightRow 
                                key={f.icao24} 
                                flight={f} 
                                active={selectedFlight?.icao24 === f.icao24} 
                                onClick={() => setSelectedFlight(f)} 
                            />
                        ))
                    )}
                </div>

                <div style={{ padding: '8px 12px', borderTop: BORDER.standard, fontSize: '8px', color: COLOR.text.muted, display: 'flex', justifyContent: 'space-between', background: COLOR.bg.elevated }}>
                    <span>VISIBLE: {filteredFlights.length} / {flights.length}</span>
                    <span style={{ color: COLOR.semantic.up }}>FEED_ACTIVE</span>
                </div>
            </div>

            {/* Map Frame */}
            <div style={{ flex: 1, position: 'relative', background: '#050505' }}>
                <MapContainer 
                    center={[20.5937, 78.9629]} 
                    zoom={5} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <ZoomControl position="bottomright" />
                    <MapController center={selectedFlight ? [selectedFlight.latitude!, selectedFlight.longitude!] : undefined} />
                    
                    {filteredFlights.map(f => (
                        <Marker 
                            key={f.icao24} 
                            position={[f.latitude!, f.longitude!]} 
                            icon={getPlaneIcon(f.true_track || 0, f.category)}
                            eventHandlers={{
                                click: () => setSelectedFlight(f)
                            }}
                        >
                            <Popup className="dark-popup">
                                <PopupContent flight={f} />
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                <style>{`
                    .leaflet-container { background: #000; border: none; }
                    .leaflet-popup-content-wrapper { background: #000; color: #fff; border: 1px solid #333; border-radius: 0; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }
                    .leaflet-popup-tip { background: #333; }
                    .custom-plane-icon { transition: transform 0.8s linear; }
                    @keyframes pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.1); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `}</style>
            </div>
        </div>
    </WidgetShell>
  );
};

const FilterBtn: React.FC<{ label: string, icon: React.ReactNode, active: boolean, color: string, onClick: () => void }> = ({ label, icon, active, color, onClick }) => (
    <button 
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 4px',
            background: active ? `${color}15` : COLOR.bg.surface,
            border: `1px solid ${active ? color : BORDER.standard}`,
            color: active ? color : COLOR.text.muted,
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'all 0.1s linear'
        }}
    >
        {icon}
        <span style={{ fontSize: '7px', fontWeight: 'bold', letterSpacing: '0.05em' }}>{label}</span>
    </button>
);

const FlightRow: React.FC<{ flight: AircraftState, active: boolean, onClick: () => void }> = ({ flight, active, onClick }) => {
    let accent: string = COLOR.text.muted;
    if (flight.category === 'MILITARY') accent = COLOR.semantic.down;
    if (flight.category === 'CIVILIAN') accent = COLOR.semantic.info;
    if (flight.category === 'OTHER') accent = COLOR.semantic.warning;

    return (
        <div 
            onClick={onClick}
            style={{ 
                padding: '10px 12px', 
                borderBottom: '1px solid #111', 
                cursor: 'pointer',
                background: active ? `${accent}10` : 'transparent',
                borderLeft: `2px solid ${active ? accent : 'transparent'}`,
                transition: 'background 0.1s linear'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: active ? COLOR.text.primary : COLOR.text.secondary, fontSize: '11px' }}>
                    {flight.callsign || 'N/A'}
                </span>
                <span style={{ fontSize: '9px', color: accent, fontWeight: 'bold' }}>{flight.category}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '9px', color: COLOR.text.muted }}>
                <span>{Math.round((flight.baro_altitude || 0) * 3.28084).toLocaleString()} FT</span>
                <span>|</span>
                <span>{flight.velocity ? Math.round(flight.velocity * 1.94384) : 0} KT</span>
                <span>|</span>
                <span style={{ color: COLOR.text.secondary }}>{flight.icao24.toUpperCase()}</span>
            </div>
        </div>
    );
};

const PopupContent: React.FC<{ flight: AircraftState }> = ({ flight }) => {
    let accent: string = COLOR.text.muted;
    if (flight.category === 'MILITARY') accent = COLOR.semantic.down;
    if (flight.category === 'CIVILIAN') accent = COLOR.semantic.info;
    if (flight.category === 'OTHER') accent = COLOR.semantic.warning;

    return (
        <div style={{ background: '#000', color: '#fff', padding: '2px', fontSize: '11px', minWidth: '160px' }}>
            <div style={{ borderBottom: `1px solid ${accent}`, paddingBottom: '6px', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: accent }}>{flight.callsign || 'UNKNOWN_CALL'}</div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted }}>{flight.origin_country.toUpperCase()} • {flight.icao24.toUpperCase()}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>ALTITUDE</div>
                    <div style={{ fontWeight: 'bold' }}>{Math.round((flight.baro_altitude || 0) * 3.28084).toLocaleString()} ft</div>
                </div>
                <div>
                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>SPEED</div>
                    <div style={{ fontWeight: 'bold' }}>{flight.velocity ? Math.round(flight.velocity * 1.94384) : 0} kt</div>
                </div>
                <div>
                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>HEADING</div>
                    <div style={{ fontWeight: 'bold' }}>{Math.round(flight.true_track || 0)}°</div>
                </div>
                <div>
                    <div style={{ fontSize: '8px', color: COLOR.text.muted }}>SQUAWK</div>
                    <div style={{ fontWeight: 'bold', color: flight.squawk === '7700' ? COLOR.semantic.down : '#fff' }}>{flight.squawk || '----'}</div>
                </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '8px', color: COLOR.text.muted, borderTop: '1px solid #111', paddingTop: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                CATEGORY: {flight.category}
            </div>
        </div>
    );
};

export default FlightMap;
