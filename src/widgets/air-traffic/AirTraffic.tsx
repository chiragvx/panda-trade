import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Plane, Search, RefreshCw, Target, AlertCircle, MapPin, Loader2, Radar, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { COLOR, TYPE, BORDER, SPACE, Text, Badge, WidgetShell, Tooltip, SegmentedControl, EmptyState } from '../../ds';
import { useSettingsStore } from '../../store/useSettingsStore';
import axios from 'axios';

interface AircraftState {
  fa_flight_id: string;
  ident: string;
  operator: string;
  aircraft_type: string;
  longitude: number;
  latitude: number;
  altitude: number;
  groundspeed: number;
  heading: number;
  origin: string;
  destination: string;
  status: string;
  category: 'MILITARY' | 'CIVILIAN' | 'OTHER';
}

interface MapBounds { latMin: number; latMax: number; lonMin: number; lonMax: number; }

const classifyAircraft = (ident: string, operator: string): 'MILITARY' | 'CIVILIAN' | 'OTHER' => {
  const id = (ident || '').toUpperCase();
  const op = (operator || '').toUpperCase();
  const MIL_PREFIXES = ['IAF', 'ICG', 'NVY', 'RCM', 'RSF', 'ASY', 'CFC', 'PAT', 'SAM', 'HVK', 'RCH', 'CNV', 'DUKE', 'MOOSE', 'SWORD', 'VIPER', 'RCHF', 'MMR'];
  if (MIL_PREFIXES.some(p => id.startsWith(p) || op.includes(p))) return 'MILITARY';
  if (/^[A-Z]{3}\d/.test(id)) return 'CIVILIAN'; 
  return 'OTHER';
};

const getPlaneIcon = (course: number, category: string) => {
  let color = category === 'MILITARY' ? COLOR.semantic.down : category === 'CIVILIAN' ? COLOR.semantic.info : COLOR.semantic.warning;
  return L.divIcon({
    className: '',
    html: `<div style="transform:rotate(${course}deg);color:${color};display:flex;align-items:center;justify-content:center">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"/></svg>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const BoundsReporter: React.FC<{ onBoundsChange: (b: MapBounds) => void }> = ({ onBoundsChange }) => {
  const map = useMap();
  useEffect(() => {
    const report = () => {
      const b = map.getBounds();
      onBoundsChange({ latMin: b.getSouth(), latMax: b.getNorth(), lonMin: b.getWest(), lonMax: b.getEast() });
    };
    report();
    map.on('moveend zoomend', report);
    return () => { map.off('moveend zoomend', report); };
  }, [map, onBoundsChange]);
  return null;
};

const AirTraffic: React.FC = () => {
  const { flightAwareApiKey } = useSettingsStore();
  const [flights, setFlights] = useState<AircraftState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<AircraftState | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'AIR' | 'GND' | 'ALL'>('AIR');
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const isFetchingRef = useRef(false);

  const fetchFlights = useCallback(async (bounds: MapBounds, filterStatus: string) => {
    const key = (flightAwareApiKey || '').trim();
    if (!key || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    const { latMin, latMax, lonMin, lonMax } = bounds;
    
    // AeroAPI V4 standard query operators
    let query = `-latlong "${latMax.toFixed(4)} ${lonMin.toFixed(4)} ${latMin.toFixed(4)} ${lonMax.toFixed(4)}"`;
    if (filterStatus === 'AIR') query += ` -inAir 1`;
    else if (filterStatus === 'GND') query += ` -inAir 0`;
    
    const url = `/api/flightaware/flights/search?query=${encodeURIComponent(query)}&max_pages=1`;

    try {
      const r = await axios.get(url, { 
        headers: { 'x-apikey': key, 'Accept': 'application/json' },
        timeout: 15000 
      });

      if (r.data?.flights) {
        const mapped: AircraftState[] = r.data.flights.map((f: any) => {
            const pos = f.last_position || f;
            return {
              fa_flight_id: f.fa_flight_id || f.faFlightId,
              ident: f.ident || 'UNK',
              operator: f.operator || 'UNKNOWN',
              aircraft_type: f.aircraft_type || 'TBD',
              longitude: pos.longitude || pos.lon || 0,
              latitude: pos.latitude || pos.lat || 0,
              altitude: (pos.altitude || pos.alt || 0) * (pos.altitude < 1000 ? 100 : 1),
              groundspeed: pos.groundspeed || pos.gs || 0,
              heading: pos.heading || 0,
              origin: f.origin?.code || f.origin || 'N/A',
              destination: f.destination?.code || f.destination || 'N/A',
              status: f.status || 'ACTIVE',
              category: classifyAircraft(f.ident || '', f.operator || ''),
            };
          }).filter(f => f.latitude !== 0);

        setFlights(mapped);
        setLastUpdate(new Date());
      } else {
          setFlights([]);
      }
    } catch (err: any) {
      console.error('[AeroAPI] REQ_FAILED:', err);
      const msg = err.response?.data?.error || err.message;
      setError(msg);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [flightAwareApiKey]);

  useEffect(() => {
    if (flightAwareApiKey && mapBounds) {
        const timer = setTimeout(() => fetchFlights(mapBounds, statusFilter), 800);
        return () => clearTimeout(timer);
    }
  }, [flightAwareApiKey, mapBounds, statusFilter, fetchFlights]);

  const filteredFlights = useMemo(() =>
    flights.filter(f => f.ident.toLowerCase().includes(search.toLowerCase())),
    [flights, search]);

  if (!flightAwareApiKey) {
      return (
          <WidgetShell>
              <EmptyState 
                icon={<Radar size={48} strokeWidth={1} />} 
                message="CONFIG_REQUIRED"
                subMessage="Please provide an AeroAPI key in settings to enable global airspace surveillance."
              />
          </WidgetShell>
      );
  }

  return (
    <WidgetShell>
      <WidgetShell.Toolbar>
        <WidgetShell.Toolbar.Left>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>AIR TRAFFIC</Text>
            </div>
        </WidgetShell.Toolbar.Left>
        <WidgetShell.Toolbar.Right>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Text family="mono" size="xs" color="muted">{lastUpdate.toLocaleTimeString()}</Text>
             <button onClick={() => mapBounds && fetchFlights(mapBounds, statusFilter)} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }}>
                <RefreshCw size={12} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
             </button>
          </div>
        </WidgetShell.Toolbar.Right>
      </WidgetShell.Toolbar>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ width: '280px', borderRight: BORDER.standard, display: 'flex', flexDirection: 'column', background: COLOR.bg.surface }}>
          <div style={{ padding: SPACE[3], background: COLOR.bg.elevated, borderBottom: BORDER.standard, display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], background: COLOR.bg.surface, border: BORDER.standard, padding: '6px 10px', borderRadius: '2px' }}>
              <Search size={13} color={COLOR.text.muted} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ident Filter..." style={{ background: 'transparent', border: 'none', outline: 'none', color: COLOR.text.primary, fontSize: TYPE.size.xs, width: '100%', fontFamily: TYPE.family.mono }} />
            </div>
            <SegmentedControl 
                options={[
                    { label: 'Airborne', value: 'AIR' },
                    { label: 'Ground', value: 'GND' },
                    { label: 'Global', value: 'ALL' }
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as any)}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
            {error ? (
                <EmptyState 
                    icon={<ShieldAlert size={48} color={COLOR.semantic.down} strokeWidth={1} />} 
                    message="API_REJECTION"
                    subMessage={error}
                />
            ) : loading && flights.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
                    <Loader2 size={24} className="spin" style={{ margin: '0 auto 12px' }} />
                    <Text size="xs" weight="black">ACQUIRING_DATA...</Text>
                </div>
            ) : filteredFlights.length === 0 ? (
                <EmptyState 
                    icon={<Radar size={48} strokeWidth={1} />} 
                    message="NO_CONTACTS"
                    subMessage="Scanning airspace for live transponder signals in this region."
                />
            ) : (
              filteredFlights.map(f => <FlightRow key={f.fa_flight_id} flight={f} active={selectedFlight?.fa_flight_id === f.fa_flight_id} onClick={() => setSelectedFlight(f)} />)
            )}
          </div>
          <div style={{ height: '32px', display: 'flex', alignItems: 'center', paddingLeft: '12px', borderTop: BORDER.standard }}>
             <Text size="xs" weight="black" color="muted">TRACKS: {filteredFlights.length}</Text>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer center={[20, 78]} zoom={4} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© CARTO" />
            <ZoomControl position="bottomright" />
            <BoundsReporter onBoundsChange={setMapBounds} />
            {filteredFlights.map(f => (
              <Marker key={f.fa_flight_id} position={[f.latitude, f.longitude]} icon={getPlaneIcon(f.heading, f.category)} eventHandlers={{ click: () => setSelectedFlight(f) }}>
                <Popup className="dark-popup"><PopupContent flight={f} /></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </WidgetShell>
  );
};

const FlightRow: React.FC<{ flight: AircraftState; active: boolean; onClick: () => void }> = ({ flight, active, onClick }) => {
  const semantic = flight.category === 'MILITARY' ? 'down' : flight.category === 'CIVILIAN' ? 'info' : 'warning';
  return (
    <div onClick={onClick} style={{ padding: '10px 12px', borderBottom: BORDER.standard, cursor: 'pointer', background: active ? `${COLOR.semantic[semantic]}15` : 'transparent', borderLeft: `3px solid ${active ? COLOR.semantic[semantic] : 'transparent'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <Text weight="black" size="md" color={active ? 'primary' : 'secondary'}>{flight.ident}</Text>
        <Badge label={flight.aircraft_type} variant="muted" />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Text family="mono" size="xs" color="muted">{Math.round(flight.altitude).toLocaleString()} FT</Text>
        <Text family="mono" size="xs" color="muted">{Math.round(flight.groundspeed)} KT</Text>
      </div>
    </div>
  );
};

const PopupContent: React.FC<{ flight: AircraftState }> = ({ flight }) => {
  return (
    <div style={{ background: COLOR.bg.base, color: COLOR.text.primary, padding: SPACE[3], minWidth: '240px' }}>
      <div style={{ borderBottom: BORDER.standard, paddingBottom: SPACE[2], marginBottom: SPACE[3] }}>
        <Text size="lg" weight="black" block>{flight.ident}</Text>
        <Text size="xs" color="muted" weight="bold" block>{flight.operator}</Text>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[3] }}>
        <div style={{ gridColumn: 'span 2', background: COLOR.bg.elevated, padding: '12px', border: BORDER.standard }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text weight="black" size="lg">{flight.origin}</Text>
                <Plane size={14} color={COLOR.text.muted} />
                <Text weight="black" size="lg">{flight.destination}</Text>
            </div>
            <div style={{ marginTop: '8px', textAlign: 'center' }}><Text size="xs" color="info" weight="black">{flight.status.toUpperCase()}</Text></div>
        </div>
        <div><Text size="xs" color="muted" block>ALTIMETER</Text><Text family="mono" weight="black" size="sm">{Math.round(flight.altitude).toLocaleString()} FT</Text></div>
        <div><Text size="xs" color="muted" block>GS_KT</Text><Text family="mono" weight="black" size="sm">{Math.round(flight.groundspeed)} KT</Text></div>
        <div style={{ gridColumn: 'span 2' }}><Text size="xs" color="muted" block>ID</Text><Text family="mono" size="xs" color="secondary">{flight.fa_flight_id}</Text></div>
      </div>
    </div>
  );
};

export default AirTraffic;
