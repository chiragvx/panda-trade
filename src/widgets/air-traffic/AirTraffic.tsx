import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Plane, Search, RefreshCw, Loader2, Radar, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { COLOR, TYPE, BORDER, SPACE, Text, Badge, WidgetShell, SegmentedControl, EmptyState } from '../../ds';
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

interface FlightDetails {
  registration?: string;
  progress_percent?: number;
  altitude_change?: string; // 'C' climbing | 'D' descending | 'L' level
  squawk?: string;
  diverted?: boolean;
  cancelled?: boolean;
  scheduled_out?: string;
  estimated_out?: string;
  actual_out?: string;
  scheduled_in?: string;
  estimated_in?: string;
  actual_in?: string;
  route_distance?: number;
  filed_altitude?: number;
  origin_city?: string;
  destination_city?: string;
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

const catColor = (category: string) =>
  category === 'MILITARY' ? COLOR.semantic.down : category === 'CIVILIAN' ? COLOR.semantic.info : COLOR.semantic.warning;

const getPlaneIcon = (course: number, category: string) => {
  const color = catColor(category);
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
  const [flightDetails, setFlightDetails] = useState<FlightDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'AIR' | 'GND' | 'ALL'>('AIR');
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const isFetchingRef = useRef(false);
  const mapBoundsRef = useRef<MapBounds | null>(null);
  const statusFilterRef = useRef<'AIR' | 'GND' | 'ALL'>('AIR');
  const lastFetchTimeRef = useRef<number>(0);
  const retryDelayRef = useRef<number>(0);

  const fetchFlights = useCallback(async (bounds: MapBounds, filterStatus: string) => {
    const key = (flightAwareApiKey || '').trim();
    if (!key || isFetchingRef.current) return;
    const now = Date.now();
    if (retryDelayRef.current > 0 && now < retryDelayRef.current) return;
    if (now - lastFetchTimeRef.current < 25_000) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    const { latMin, latMax, lonMin, lonMax } = bounds;
    let query = `-latlong "${latMax.toFixed(4)} ${lonMin.toFixed(4)} ${latMin.toFixed(4)} ${lonMax.toFixed(4)}"`;
    if (filterStatus === 'AIR') query += ` -inAir 1`;
    else if (filterStatus === 'GND') query += ` -inAir 0`;
    const url = `/api/flightaware/flights/search?query=${encodeURIComponent(query)}&max_pages=3`;
    try {
      const r = await axios.get(url, { headers: { 'x-apikey': key, 'Accept': 'application/json' }, timeout: 15000 });
      if (r.data?.flights) {
        const mapped: AircraftState[] = r.data.flights.map((f: any) => {
          const pos = f.last_position || f;
          const rawAlt = pos.altitude ?? pos.alt ?? 0;
          return {
            fa_flight_id: f.fa_flight_id || f.faFlightId,
            ident: f.ident || 'UNK',
            operator: f.operator || 'UNKNOWN',
            aircraft_type: f.aircraft_type || 'TBD',
            longitude: pos.longitude || pos.lon || 0,
            latitude: pos.latitude || pos.lat || 0,
            altitude: rawAlt * (rawAlt < 1000 ? 100 : 1),
            groundspeed: pos.groundspeed || pos.gs || 0,
            heading: pos.heading || 0,
            origin: f.origin?.code || f.origin || 'N/A',
            destination: f.destination?.code || f.destination || 'N/A',
            status: f.status || 'ACTIVE',
            category: classifyAircraft(f.ident || '', f.operator || ''),
          };
        }).filter((f: AircraftState) => f.latitude !== 0);
        setFlights(mapped);
        setLastUpdate(new Date());
        lastFetchTimeRef.current = Date.now();
        retryDelayRef.current = 0;
      } else {
        setFlights([]);
        lastFetchTimeRef.current = Date.now();
      }
    } catch (err: any) {
      console.error('[AeroAPI] REQ_FAILED:', err);
      if (err.response?.status === 429) {
        const backoff = Math.min((retryDelayRef.current > 0 ? 120_000 : 60_000), 300_000);
        retryDelayRef.current = Date.now() + backoff;
        setError(`Rate limited — retry in ${Math.round(backoff / 1000)}s`);
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [flightAwareApiKey]);

  const fetchFlightDetails = useCallback(async (flightId: string) => {
    const key = (flightAwareApiKey || '').trim();
    if (!key) return;
    setDetailsLoading(true);
    setFlightDetails(null);
    try {
      const r = await axios.get(`/api/flightaware/flights/${encodeURIComponent(flightId)}`, {
        headers: { 'x-apikey': key, 'Accept': 'application/json' },
        timeout: 10000,
      });
      const d = r.data;
      const pos = d.last_position || {};
      setFlightDetails({
        registration: d.registration,
        progress_percent: d.progress_percent,
        altitude_change: pos.altitude_change,
        squawk: pos.squawk,
        diverted: d.diverted,
        cancelled: d.cancelled,
        scheduled_out: d.scheduled_out,
        estimated_out: d.estimated_out,
        actual_out: d.actual_out,
        scheduled_in: d.scheduled_in,
        estimated_in: d.estimated_in,
        actual_in: d.actual_in,
        route_distance: d.route_distance,
        filed_altitude: d.filed_altitude,
        origin_city: d.origin?.city,
        destination_city: d.destination?.city,
      });
    } catch (err) {
      console.error('[AeroAPI] Details fetch failed:', err);
    } finally {
      setDetailsLoading(false);
    }
  }, [flightAwareApiKey]);

  useEffect(() => { mapBoundsRef.current = mapBounds; }, [mapBounds]);
  useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);

  useEffect(() => {
    if (flightAwareApiKey && mapBounds) {
      const timer = setTimeout(() => fetchFlights(mapBounds, statusFilter), 3000);
      return () => clearTimeout(timer);
    }
  }, [flightAwareApiKey, mapBounds, statusFilter, fetchFlights]);

  useEffect(() => {
    if (!flightAwareApiKey) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && mapBoundsRef.current) {
        fetchFlights(mapBoundsRef.current, statusFilterRef.current);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [flightAwareApiKey, fetchFlights]);

  useEffect(() => {
    if (selectedFlight) fetchFlightDetails(selectedFlight.fa_flight_id);
    else setFlightDetails(null);
  }, [selectedFlight, fetchFlightDetails]);

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
          <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>AIR TRAFFIC</Text>
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
              options={[{ label: 'Airborne', value: 'AIR' }, { label: 'Ground', value: 'GND' }, { label: 'Global', value: 'ALL' }]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as any)}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
            {error ? (
              <EmptyState icon={<ShieldAlert size={48} color={COLOR.semantic.down} strokeWidth={1} />} message="API_REJECTION" subMessage={error} />
            ) : loading && flights.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
                <Loader2 size={24} className="spin" style={{ margin: '0 auto 12px' }} />
                <Text size="xs" weight="black">ACQUIRING_DATA...</Text>
              </div>
            ) : filteredFlights.length === 0 ? (
              <EmptyState icon={<Radar size={48} strokeWidth={1} />} message="NO_CONTACTS" subMessage="Scanning airspace for live transponder signals in this region." />
            ) : (
              filteredFlights.map(f => (
                <FlightRow key={f.fa_flight_id} flight={f} active={selectedFlight?.fa_flight_id === f.fa_flight_id} onClick={() => setSelectedFlight(f)} />
              ))
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
                <Popup className="at-popup" maxWidth={340}>
                  <PopupContent
                    flight={f}
                    details={selectedFlight?.fa_flight_id === f.fa_flight_id ? flightDetails : null}
                    loading={selectedFlight?.fa_flight_id === f.fa_flight_id ? detailsLoading : false}
                  />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .at-popup .leaflet-popup-content-wrapper {
          background: ${COLOR.bg.base};
          border: 1px solid ${COLOR.bg.border};
          border-radius: 2px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.95);
          padding: 0;
          color: ${COLOR.text.primary};
        }
        .at-popup .leaflet-popup-tip { background: ${COLOR.bg.border}; }
        .at-popup .leaflet-popup-content { margin: 0; min-width: 300px; }
        .at-popup .leaflet-popup-close-button { color: ${COLOR.text.muted} !important; font-size: 18px; top: 10px; right: 10px; z-index: 1; }
        .at-popup .leaflet-popup-close-button:hover { color: ${COLOR.text.primary} !important; background: none; }
      `}</style>
    </WidgetShell>
  );
};

const FlightRow: React.FC<{ flight: AircraftState; active: boolean; onClick: () => void }> = ({ flight, active, onClick }) => {
  const color = catColor(flight.category);
  return (
    <div onClick={onClick} style={{ padding: '10px 12px', borderBottom: BORDER.standard, cursor: 'pointer', background: active ? `${color}12` : 'transparent', borderLeft: `3px solid ${active ? color : 'transparent'}` }}>
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

const fmtTime = (iso?: string) => {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const AltArrow: React.FC<{ change?: string }> = ({ change }) => {
  if (change === 'C') return <span style={{ color: COLOR.semantic.up, fontSize: '10px', lineHeight: 1 }}>▲</span>;
  if (change === 'D') return <span style={{ color: COLOR.semantic.down, fontSize: '10px', lineHeight: 1 }}>▼</span>;
  if (change === 'L') return <span style={{ color: COLOR.text.muted, fontSize: '10px', lineHeight: 1 }}>━</span>;
  return null;
};

const DataCell: React.FC<{ label: string; value: React.ReactNode; span?: boolean }> = ({ label, value, span }) => (
  <div style={{ gridColumn: span ? 'span 2' : undefined }}>
    <div style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono, marginBottom: '3px', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.primary, fontWeight: 600 }}>{value}</div>
  </div>
);

const PopupContent: React.FC<{ flight: AircraftState; details: FlightDetails | null; loading: boolean }> = ({ flight, details, loading }) => {
  const color = catColor(flight.category);
  const progress = details?.progress_percent ?? null;

  const statusColor = flight.status?.toLowerCase().includes('cancel') ? COLOR.semantic.down
    : flight.status?.toLowerCase().includes('divert') ? COLOR.semantic.warning
    : COLOR.semantic.info;

  return (
    <div style={{ background: COLOR.bg.base, color: COLOR.text.primary, minWidth: '300px', fontFamily: TYPE.family.mono }}>

      {/* Header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: BORDER.standard, background: COLOR.bg.elevated, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: TYPE.size.lg, fontWeight: 700, color }}>{flight.ident}</span>
            <span style={{ fontSize: '9px', padding: '2px 5px', border: `1px solid ${color}`, color, letterSpacing: '0.06em' }}>{flight.category}</span>
            {(details?.diverted) && <span style={{ fontSize: '9px', padding: '2px 5px', border: `1px solid ${COLOR.semantic.warning}`, color: COLOR.semantic.warning }}>DIVERTED</span>}
            {(details?.cancelled) && <span style={{ fontSize: '9px', padding: '2px 5px', border: `1px solid ${COLOR.semantic.down}`, color: COLOR.semantic.down }}>CNCL</span>}
          </div>
          <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted }}>{flight.operator}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: TYPE.size.sm, fontWeight: 600, color: COLOR.text.secondary }}>{flight.aircraft_type}</div>
          {details?.registration && <div style={{ fontSize: '11px', color: COLOR.text.muted, marginTop: '2px' }}>{details.registration}</div>}
        </div>
      </div>

      {/* Route + Progress */}
      <div style={{ padding: '12px 14px', borderBottom: BORDER.standard }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: progress != null ? '10px' : 0 }}>
          <div>
            <div style={{ fontSize: TYPE.size.md, fontWeight: 700, color: COLOR.text.primary }}>{flight.origin}</div>
            {details?.origin_city && <div style={{ fontSize: '10px', color: COLOR.text.muted, marginTop: '1px' }}>{details.origin_city}</div>}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 12px', paddingTop: '2px' }}>
            <Plane size={12} color={COLOR.text.muted} />
            {progress != null && <div style={{ fontSize: '10px', color, marginTop: '2px', fontWeight: 600 }}>{progress}%</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: TYPE.size.md, fontWeight: 700, color: COLOR.text.primary }}>{flight.destination}</div>
            {details?.destination_city && <div style={{ fontSize: '10px', color: COLOR.text.muted, marginTop: '1px' }}>{details.destination_city}</div>}
          </div>
        </div>
        {progress != null && (
          <div style={{ height: '2px', background: COLOR.bg.elevated, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: color }} />
          </div>
        )}
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: statusColor, fontWeight: 600, letterSpacing: '0.05em' }}>{flight.status.toUpperCase()}</span>
          {details?.route_distance && (
            <span style={{ fontSize: '10px', color: COLOR.text.muted }}>· {details.route_distance.toLocaleString()} NM</span>
          )}
          {details?.filed_altitude && (
            <span style={{ fontSize: '10px', color: COLOR.text.muted }}>· FL{details.filed_altitude}</span>
          )}
        </div>
      </div>

      {/* Telemetry */}
      <div style={{ padding: '10px 14px', borderBottom: BORDER.standard, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        <DataCell label="ALTITUDE" value={
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AltArrow change={details?.altitude_change} />
            <span>{Math.round(flight.altitude).toLocaleString()} FT</span>
          </div>
        } />
        <DataCell label="GND SPD" value={`${Math.round(flight.groundspeed)} KT`} />
        <DataCell label="HEADING" value={`${Math.round(flight.heading)}°`} />
        <DataCell label="SQUAWK" value={
          <span style={{ color: details?.squawk === '7700' ? COLOR.semantic.down : details?.squawk === '7600' ? COLOR.semantic.warning : COLOR.text.primary }}>
            {details?.squawk || '----'}
          </span>
        } />
      </div>

      {/* Times */}
      {details && (details.scheduled_out || details.scheduled_in) && (
        <div style={{ padding: '10px 14px', borderBottom: BORDER.standard, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: COLOR.text.muted, letterSpacing: '0.05em', marginBottom: '6px' }}>DEPARTURE</div>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>SCH</div>
                <div style={{ fontSize: TYPE.size.xs, fontWeight: 600 }}>{fmtTime(details.scheduled_out)}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>ACT</div>
                <div style={{ fontSize: TYPE.size.xs, fontWeight: 600, color: details.actual_out ? COLOR.semantic.up : COLOR.text.muted }}>{fmtTime(details.actual_out || details.estimated_out)}</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: COLOR.text.muted, letterSpacing: '0.05em', marginBottom: '6px' }}>ARRIVAL</div>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>SCH</div>
                <div style={{ fontSize: TYPE.size.xs, fontWeight: 600 }}>{fmtTime(details.scheduled_in)}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>EST</div>
                <div style={{ fontSize: TYPE.size.xs, fontWeight: 600 }}>{fmtTime(details.actual_in || details.estimated_in)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details loading indicator */}
      {loading && (
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: BORDER.standard }}>
          <Loader2 size={11} style={{ animation: 'spin 1s linear infinite', color: COLOR.text.muted }} />
          <span style={{ fontSize: '10px', color: COLOR.text.muted, letterSpacing: '0.05em' }}>FETCHING DETAILS...</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 14px', background: COLOR.bg.elevated }}>
        <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px', letterSpacing: '0.05em' }}>FLIGHT ID</div>
        <div style={{ fontSize: '10px', color: COLOR.text.muted, wordBreak: 'break-all' }}>{flight.fa_flight_id}</div>
      </div>
    </div>
  );
};

export default AirTraffic;
