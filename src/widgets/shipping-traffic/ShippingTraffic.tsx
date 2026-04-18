import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Ship, Anchor, Search, Shield, Users, Radio } from 'lucide-react';
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
  callsign: string;
  imo: number;
  draught: number;
  eta: string;
  length: number;
  beam: number;
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

const catColor = (category: string) =>
  category === 'MILITARY' ? COLOR.semantic.down : category === 'CIVILIAN' ? COLOR.semantic.info : COLOR.semantic.warning;

const getShipIcon = (course: number, category: string) => {
  const color = catColor(category);
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

const fmtEta = (eta: any): string => {
  if (!eta) return '---';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const { Month, Day, Hour, Minute } = eta;
  if (!Month || !Day || Month < 1 || Month > 12 || Day < 1) return '---';
  return `${months[Month - 1]} ${Day} ${String(Hour ?? 0).padStart(2, '0')}:${String(Minute ?? 0).padStart(2, '0')}`;
};

const BLANK_VESSEL_EXTRA = { callsign: '---', imo: 0, draught: 0, eta: '---', length: 0, beam: 0 };

const ShippingTraffic: React.FC = () => {
  const { aisStreamApiKey } = useSettingsStore();
  const [vessels, setVessels] = useState<Record<number, VesselState>>({});
  const [selectedVessel, setSelectedVessel] = useState<VesselState | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ MILITARY: true, CIVILIAN: true, OTHER: true });
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'LIVE' | 'NO DATA' | 'ERROR'>('IDLE');
  const [rawMsgCount, setRawMsgCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<Record<number, VesselState>>({});
  const lastSyncRef = useRef<number>(0);
  const rawMsgCountRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let connectTimeout: ReturnType<typeof setTimeout> | null = null;

    if (!aisStreamApiKey) {
      setStatus('IDLE');
      return;
    }

    const connect = () => {
      if (!isMounted) return;
      setStatus('CONNECTING');
      const wsUrl = 'wss://stream.aisstream.io/v0/stream';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[AIS] onopen, readyState:', ws.readyState, 'isMounted:', isMounted);
        if (!isMounted || ws.readyState !== WebSocket.OPEN) { ws.close(); return; }
        setStatus('LIVE');
        const sub = { APIKey: aisStreamApiKey, BoundingBoxes: [[[-10, 40], [30, 100]]] };
        console.log('[AIS] sending subscription:', JSON.stringify(sub));
        ws.send(JSON.stringify(sub));
        // If no messages arrive within 15s the key likely has no stream access
        const noDataTimer = setTimeout(() => {
          if (isMounted && rawMsgCountRef.current === 0) setStatus('NO DATA');
        }, 15000);
        ws.addEventListener('message', () => clearTimeout(noDataTimer), { once: true });
      };

      ws.onmessage = async (event) => {
        if (!isMounted) return;
        let messageData = event.data;
        if (messageData instanceof Blob) messageData = await messageData.text();
        rawMsgCountRef.current += 1;
        if (rawMsgCountRef.current <= 3) console.log('[AIS] raw msg:', messageData);
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
              ...(bufferRef.current[mmsi] || BLANK_VESSEL_EXTRA),
              mmsi,
              name: meta.ShipName?.trim() || bufferRef.current[mmsi]?.name || 'UNKNOWN',
              lat,
              lon,
              course: course === 511 ? (bufferRef.current[mmsi]?.course || 0) : course,
              speed,
              lastSeen: Date.now(),
              country: meta.Country || meta.country || 'N/A',
              destination: meta.Destination || bufferRef.current[mmsi]?.destination || '---',
              type: bufferRef.current[mmsi]?.type || 0,
              typeStr: bufferRef.current[mmsi]?.typeStr || 'OTHER',
              category: bufferRef.current[mmsi]?.category || 'OTHER',
              callsign: bufferRef.current[mmsi]?.callsign || '---',
              imo: bufferRef.current[mmsi]?.imo || 0,
              draught: bufferRef.current[mmsi]?.draught || 0,
              eta: bufferRef.current[mmsi]?.eta || '---',
              length: bufferRef.current[mmsi]?.length || 0,
              beam: bufferRef.current[mmsi]?.beam || 0,
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
              setRawMsgCount(rawMsgCountRef.current);
              lastSyncRef.current = now;
            }
          } else if (mType === 'ShipStaticData') {
            const stat = data.Message.ShipStaticData;
            const mmsi = data.MetaData.MMSI;
            const type = stat.Type ?? 0;
            const etaStr = fmtEta(stat.ETA);
            const length = (stat.Dimension?.A || 0) + (stat.Dimension?.B || 0);
            const beam = (stat.Dimension?.C || 0) + (stat.Dimension?.D || 0);

            const patch = {
              type,
              typeStr: getVesselTypeStr(type),
              category: getVesselCategory(type),
              callsign: stat.CallSign?.trim() || '---',
              imo: stat.ImoNumber || 0,
              draught: stat.MaximumStaticDraught || 0,
              eta: etaStr,
              length,
              beam,
              ...(stat.Name?.trim() ? { name: stat.Name.trim() } : {}),
              ...(stat.Destination?.trim() ? { destination: stat.Destination.trim() } : {}),
            };

            if (bufferRef.current[mmsi]) {
              Object.assign(bufferRef.current[mmsi], patch);
            }
          }
        } catch (err) {
          console.error('[AIS] parse error:', err, 'raw:', messageData);
        }
      };

      ws.onerror = (e) => {
        console.error('[AIS] ws error:', e);
        if (isMounted) setStatus('ERROR');
      };

      ws.onclose = (e) => {
        console.warn('[AIS] ws closed — code:', e.code, '| reason:', e.reason || '(none)', '| wasClean:', e.wasClean);
        if (isMounted && wsRef.current === ws) {
          setStatus('CONNECTING');
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };
    };

    connectTimeout = setTimeout(connect, 50);
    return () => {
      isMounted = false;
      if (connectTimeout) clearTimeout(connectTimeout);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [aisStreamApiKey]);

  const vesselList = useMemo(() => Object.values(vessels), [vessels]);

  const filteredVessels = useMemo(() =>
    vesselList.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.mmsi.toString().includes(search);
      return matchesSearch && filters[v.category];
    }),
    [vesselList, search, filters]
  );

  if (!aisStreamApiKey) {
    return (
      <WidgetShell>
        <EmptyState
          icon={<Anchor size={48} strokeWidth={1} />}
          message="CONFIG_REQUIRED"
          subMessage="Please configure your AISStream.io API key in the Connectivity Dashboard."
        />
      </WidgetShell>
    );
  }

  const statusDot = status === 'LIVE' ? COLOR.semantic.up : status === 'ERROR' || status === 'NO DATA' ? COLOR.semantic.danger : COLOR.semantic.warning;

  return (
    <WidgetShell>
      <WidgetShell.Toolbar>
        <WidgetShell.Toolbar.Left>
          <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>SHIPPING TRAFFIC</Text>
        </WidgetShell.Toolbar.Left>
        <WidgetShell.Toolbar.Right>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {rawMsgCount > 0 && <Text family="mono" size="xs" color="muted">MSGS: {rawMsgCount}</Text>}
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusDot, boxShadow: status === 'LIVE' ? `0 0 8px ${COLOR.semantic.up}` : 'none' }} />
            <Text family="mono" size="xs" weight="black" color="muted">{status}</Text>
          </div>
        </WidgetShell.Toolbar.Right>
      </WidgetShell.Toolbar>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ width: '280px', borderRight: BORDER.standard, display: 'flex', flexDirection: 'column', background: COLOR.bg.surface }}>
          <div style={{ padding: SPACE[3], background: COLOR.bg.elevated, borderBottom: BORDER.standard }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], background: COLOR.bg.surface, border: BORDER.standard, padding: '6px 10px', borderRadius: '2px', marginBottom: SPACE[3] }}>
              <Search size={13} color={COLOR.text.muted} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Vessel / MMSI..."
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
              <EmptyState
                icon={<Anchor size={48} strokeWidth={1} />}
                message="NO_AIS_TRACKS"
                subMessage="No transponder data received for the selected regions or filters."
              />
            ) : (
              filteredVessels.slice(0, 100).map(v => (
                <VesselRow key={v.mmsi} vessel={v} active={selectedVessel?.mmsi === v.mmsi} onClick={() => setSelectedVessel(v)} />
              ))
            )}
          </div>

          <div style={{ height: '32px', display: 'flex', alignItems: 'center', paddingLeft: '12px', borderTop: BORDER.standard, background: COLOR.bg.elevated }}>
            <Text size="xs" weight="black" color="muted">TRACKS: {filteredVessels.length}</Text>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', background: COLOR.bg.base }}>
          <MapContainer center={[18.9218, 72.8347]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© CARTO" />
            <ZoomControl position="bottomright" />
            <MapController center={selectedVessel ? [selectedVessel.lat, selectedVessel.lon] : undefined} />
            {filteredVessels.filter(v => v.lat !== 0 || v.lon !== 0).map(v => (
              <Marker key={v.mmsi} position={[v.lat, v.lon]} icon={getShipIcon(v.course, v.category)} eventHandlers={{ click: () => setSelectedVessel(v) }}>
                <Popup className="ship-popup" maxWidth={340}>
                  <VesselPopupContent vessel={v} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <style>{`
        .ship-popup .leaflet-popup-content-wrapper {
          background: ${COLOR.bg.base};
          border: 1px solid ${COLOR.bg.border};
          border-radius: 2px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.95);
          padding: 0;
          color: ${COLOR.text.primary};
        }
        .ship-popup .leaflet-popup-tip { background: ${COLOR.bg.border}; }
        .ship-popup .leaflet-popup-content { margin: 0; min-width: 300px; }
        .ship-popup .leaflet-popup-close-button { color: ${COLOR.text.muted} !important; font-size: 18px; top: 10px; right: 10px; z-index: 1; }
        .ship-popup .leaflet-popup-close-button:hover { color: ${COLOR.text.primary} !important; background: none; }
      `}</style>
    </WidgetShell>
  );
};

const FilterBtn: React.FC<{ icon: React.ReactNode; active: boolean; color: keyof typeof COLOR.semantic; onClick: () => void }> = ({ icon, active, color, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '28px', width: '28px', background: active ? `${COLOR.semantic[color]}15` : COLOR.bg.surface, border: `1px solid ${active ? COLOR.semantic[color] : COLOR.bg.border}`, color: active ? COLOR.semantic[color] : COLOR.text.muted, borderRadius: '2px', cursor: 'pointer' }}>
    {icon}
  </button>
);

const VesselRow: React.FC<{ vessel: VesselState; active: boolean; onClick: () => void }> = ({ vessel, active, onClick }) => {
  const color = catColor(vessel.category);
  return (
    <div onClick={onClick} style={{ padding: '10px 12px', borderBottom: BORDER.standard, cursor: 'pointer', background: active ? `${color}12` : 'transparent', borderLeft: `3px solid ${active ? color : 'transparent'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <Text weight="black" size="md" color={active ? 'primary' : 'secondary'}>{vessel.name}</Text>
        <Badge label={vessel.typeStr} variant="muted" />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Text family="mono" size="xs" color="muted">{vessel.speed.toFixed(1)} KN</Text>
        <Text family="mono" size="xs" color="muted">HDG {vessel.course}°</Text>
      </div>
    </div>
  );
};

const DataCell: React.FC<{ label: string; value: React.ReactNode; span?: boolean }> = ({ label, value, span }) => (
  <div style={{ gridColumn: span ? 'span 2' : undefined }}>
    <div style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono, marginBottom: '3px', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.primary, fontWeight: 600 }}>{value}</div>
  </div>
);

const VesselPopupContent: React.FC<{ vessel: VesselState }> = ({ vessel }) => {
  const color = catColor(vessel.category);
  const hasEta = vessel.eta && vessel.eta !== '---';
  const hasDimensions = vessel.length > 0 || vessel.beam > 0;

  return (
    <div style={{ background: COLOR.bg.base, color: COLOR.text.primary, minWidth: '300px', fontFamily: TYPE.family.mono }}>

      {/* Header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: BORDER.standard, background: COLOR.bg.elevated, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: TYPE.size.lg, fontWeight: 700, color }}>{vessel.name}</span>
            <span style={{ fontSize: '9px', padding: '2px 5px', border: `1px solid ${color}`, color, letterSpacing: '0.06em' }}>{vessel.category}</span>
          </div>
          <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted }}>MMSI {vessel.mmsi} · {vessel.country}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: TYPE.size.sm, fontWeight: 600, color: COLOR.text.secondary }}>{vessel.typeStr}</div>
          {vessel.callsign && vessel.callsign !== '---' && (
            <div style={{ fontSize: '11px', color: COLOR.text.muted, marginTop: '2px' }}>{vessel.callsign}</div>
          )}
        </div>
      </div>

      {/* Route */}
      <div style={{ padding: '12px 14px', borderBottom: BORDER.standard }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: TYPE.size.md, fontWeight: 700, color: COLOR.text.primary }}>{vessel.country || '---'}</div>
            <div style={{ fontSize: '10px', color: COLOR.text.muted, marginTop: '1px' }}>ORIGIN</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 12px', paddingTop: '2px' }}>
            <Ship size={12} color={COLOR.text.muted} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: TYPE.size.md, fontWeight: 700, color: COLOR.text.primary }}>
              {vessel.destination !== '---' ? vessel.destination : 'UNKNOWN'}
            </div>
            <div style={{ fontSize: '10px', color: COLOR.text.muted, marginTop: '1px' }}>DESTINATION</div>
          </div>
        </div>
        {hasEta && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: COLOR.semantic.info, fontWeight: 600, letterSpacing: '0.05em' }}>ETA {vessel.eta}</span>
          </div>
        )}
      </div>

      {/* Telemetry */}
      <div style={{ padding: '10px 14px', borderBottom: BORDER.standard, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        <DataCell label="SPEED" value={`${vessel.speed.toFixed(1)} KN`} />
        <DataCell label="HEADING" value={`${vessel.course}°`} />
        <DataCell label="DRAUGHT" value={vessel.draught > 0 ? `${vessel.draught.toFixed(1)} M` : '---'} />
        <DataCell label="IMO" value={vessel.imo > 0 ? String(vessel.imo) : '---'} />
      </div>

      {/* Dimensions */}
      {hasDimensions && (
        <div style={{ padding: '10px 14px', borderBottom: BORDER.standard, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: COLOR.text.muted, letterSpacing: '0.05em', marginBottom: '6px' }}>DIMENSIONS</div>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>LENGTH</div>
                <div style={{ fontSize: TYPE.size.xs, fontWeight: 600 }}>{vessel.length > 0 ? `${vessel.length} M` : '---'}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>BEAM</div>
                <div style={{ fontSize: TYPE.size.xs, fontWeight: 600 }}>{vessel.beam > 0 ? `${vessel.beam} M` : '---'}</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: COLOR.text.muted, letterSpacing: '0.05em', marginBottom: '6px' }}>POSITION</div>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>LAT</div>
                <div style={{ fontSize: TYPE.size.xs, fontWeight: 600 }}>{vessel.lat.toFixed(4)}°</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px' }}>LON</div>
                <div style={{ fontSize: TYPE.size.xs, fontWeight: 600 }}>{vessel.lon.toFixed(4)}°</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '8px 14px', background: COLOR.bg.elevated }}>
        <div style={{ fontSize: '9px', color: COLOR.text.muted, marginBottom: '2px', letterSpacing: '0.05em' }}>MMSI</div>
        <div style={{ fontSize: '10px', color: COLOR.text.muted }}>{vessel.mmsi}</div>
      </div>
    </div>
  );
};

export default ShippingTraffic;
