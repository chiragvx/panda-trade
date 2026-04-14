import React, { useMemo, useState, useEffect } from 'react';
import { Flame, MapPin, Search, Filter, Eye, EyeOff, Shield, Radio, Activity, AlertTriangle, Layers, Target, Info, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { COLOR, TYPE, BORDER, SPACE, WidgetShell, EmptyState, Text } from '../../ds';
import axios from 'axios';
import { useSettingsStore } from '../../store/useSettingsStore';

// NASA FIRMS Data Structure
interface FirePoint {
  latitude: number;
  longitude: number;
  bright_ti4: number; // Brightness Temp
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: string;
  confidence: string;
  version: string;
  bright_ti5: number;
  frp: number; // Fire Radiative Power (MW)
  daynight: string;
}

const getFireColor = (frp: number): string => {
    if (frp > 100) return COLOR.semantic.down; // Extreme
    if (frp > 50) return COLOR.semantic.warning;  // High
    if (frp > 10) return COLOR.semantic.info;  // Moderate
    return COLOR.text.muted;               // Low
};

// Global memory cache to prevent spamming the API on unmounts/remounts
let memoryCache_fires: FirePoint[] | null = null;
let memoryCache_lastFetch = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes rate limit

const FireMap: React.FC = () => {
    const { nasaApiKey } = useSettingsStore();
    const [fires, setFires] = useState<FirePoint[]>(memoryCache_fires || []);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'LIVE' | 'ERROR'>('IDLE');
    const [selectedFire, setSelectedFire] = useState<FirePoint | null>(null);
    const [frpThreshold, setFrpThreshold] = useState(100); // Default threshold for Power
    const [searchQuery, setSearchQuery] = useState('');

    const fetchFires = async (force = false) => {
        if (!nasaApiKey) {
            setStatus('IDLE');
            setLoading(false);
            return;
        }

        // Return from cache if valid
        if (!force && memoryCache_fires && (Date.now() - memoryCache_lastFetch < CACHE_TTL)) {
            setFires(memoryCache_fires);
            setLoading(false);
            setStatus('LIVE');
            return;
        }

        setLoading(true);
        setStatus('LOADING');
        try {
            // Official NASA endpoint requiring Map Key (Global Area: -180,-90,180,90 for 1 Day)
            const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${nasaApiKey}/VIIRS_SNPP_NRT/-180,-90,180,90/1`;
            const response = await axios.get(url);
            
            const lines = response.data.split('\n');
            const headers = lines[0].split(',');
            
            const data: FirePoint[] = lines.slice(1).map((line: string) => {
                const values = line.split(',');
                if (values.length < 10) return null;
                
                const obj: any = {};
                headers.forEach((h: string, i: number) => {
                    const key = h.trim();
                    const val = values[i]?.trim();
                    obj[key] = isNaN(Number(val)) ? val : Number(val);
                });
                return obj as FirePoint;
            });
            
            // Filter out invalid data
            const cleanData = data.filter((f: any) => f !== null && !isNaN(f.latitude));

            // Save to memory cache
            memoryCache_fires = cleanData;
            memoryCache_lastFetch = Date.now();

            setFires(cleanData);
            setLoading(false);
            setStatus('LIVE');
        } catch (err) {
            console.error('NASA FIRMS API Error:', err);
            setStatus('ERROR');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFires();
        const interval = setInterval(() => fetchFires(true), CACHE_TTL); // Refresh when TTL expires
        return () => clearInterval(interval);
    }, [nasaApiKey]);

    const filteredFires = useMemo(() => {
        return fires.filter(f => {
            const matchesFrp = f.frp >= frpThreshold;
            const matchesSearch = searchQuery === '' || 
                                 f.latitude.toString().includes(searchQuery) || 
                                 f.longitude.toString().includes(searchQuery);
            return matchesFrp && matchesSearch;
        });
    }, [fires, frpThreshold, searchQuery]);

    const stats = useMemo(() => {
        const extreme = fires.filter(f => f.frp > 100).length;
        const total = fires.length;
        return { extreme, total };
    }, [fires]);

    if (!nasaApiKey) {
        return (
            <WidgetShell>
                <EmptyState 
                    icon={<Flame size={48} strokeWidth={1} />} 
                    message="CONFIG_REQUIRED"
                    subMessage="NASA FIRMS Map Key is required for thermal anomaly detection."
                />
            </WidgetShell>
        );
    }

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Text size="xs" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }}>THERMAL FIRE MAP</Text>
                    <div style={{ 
                        fontSize: TYPE.size.xs, 
                        padding: '1px 8px', 
                        background: `${COLOR.semantic.down}20`, 
                        color: COLOR.semantic.down, 
                        border: `1px solid ${COLOR.semantic.down}40`,
                        borderRadius: '2px', 
                        fontWeight: TYPE.weight.black,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        letterSpacing: TYPE.letterSpacing.caps
                    }}>
                        <Activity size={10} /> LIVE
                    </div>
                </div>
                <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono }}>
                    <span>EXTREME: {stats.extreme}</span>
                    <button onClick={() => fetchFires(true)} style={{ background: 'transparent', border: 'none', color: COLOR.text.muted, cursor: 'pointer', padding: '0 4px' }}>
                        <RefreshCw size={12} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </WidgetShell.Toolbar>

            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                {/* Control Panel */}
                <div style={{ width: '280px', borderRight: BORDER.standard, background: COLOR.bg.surface, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: BORDER.standard, background: COLOR.bg.elevated }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: COLOR.bg.surface, border: BORDER.standard, padding: '8px 12px', borderRadius: '2px', marginBottom: '20px' }}>
                            <Search size={14} color={COLOR.text.muted} />
                            <input 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="LOCATE_COORDS..."
                                style={{ background: 'transparent', border: 'none', outline: 'none', color: COLOR.text.primary, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, fontFamily: TYPE.family.mono, width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps }}>SCAN_THRESHOLD</label>
                                <span style={{ fontSize: TYPE.size.xs, color: COLOR.semantic.down, fontWeight: TYPE.weight.black }}>{frpThreshold}MW+</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="300" 
                                value={frpThreshold}
                                onChange={e => setFrpThreshold(Number(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer', accentColor: COLOR.semantic.down }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: TYPE.size.xs, color: COLOR.text.muted, marginTop: '4px', fontWeight: TYPE.weight.bold }}>
                                <span>FILTER_OFF</span>
                                <span>INFERNO_ONLY</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <StatBox label="EXTREME" value={stats.extreme} color={COLOR.semantic.down} />
                            <StatBox label="FILTERED" value={filteredFires.length} color={COLOR.semantic.warning} />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        {status === 'ERROR' ? (
                            <EmptyState 
                                icon={<ShieldAlert size={48} color={COLOR.semantic.down} strokeWidth={1} />} 
                                message="API_REJECTION"
                                subMessage="NASA FIRMS servers are currently unresponsive or rejecting the request."
                            />
                        ) : filteredFires.length === 0 ? (
                            <EmptyState 
                                icon={<Flame size={48} strokeWidth={1} />} 
                                message="NO_ANOMALIES"
                                subMessage="No thermal anomalies detected at the current threshold."
                            />
                        ) : (
                            filteredFires.slice(0, 50).map((f, i) => (
                                <FireRow key={`${f.latitude}-${i}`} fire={f} onClick={() => setSelectedFire(f)} />
                            ))
                        )}
                    </div>
                </div>

                {/* Map View */}
                <div style={{ flex: 1, background: COLOR.bg.base, position: 'relative' }}>
                    <MapContainer center={[20, 0]} zoom={3} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <ZoomControl position="bottomright" />
                        <MapController center={selectedFire ? [selectedFire.latitude, selectedFire.longitude] : undefined} />

                        {filteredFires.map((f, i) => (
                            <CircleMarker 
                                key={`m-${i}`} 
                                center={[f.latitude, f.longitude]} 
                                radius={f.frp / 20 + 2}
                                pathOptions={{ 
                                    fillColor: getFireColor(f.frp), 
                                    color: getFireColor(f.frp), 
                                    weight: 1, 
                                    fillOpacity: 0.6 
                                }}
                                eventHandlers={{ click: () => setSelectedFire(f) }}
                            >
                                <Popup className="dark-popup">
                                    <FirePopup fire={f} />
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </div>
            </div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </WidgetShell>
    );
};

const MapController: React.FC<{ center?: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 9);
    }, [center, map]);
    return null;
};

const StatBox: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
    <div style={{ background: COLOR.bg.surface, border: BORDER.standard, padding: '10px', borderRadius: '2px' }}>
        <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, marginBottom: '2px', fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>{label}</div>
        <div style={{ fontSize: '16px', fontWeight: TYPE.weight.black, color: color, fontFamily: TYPE.family.mono }}>{value}</div>
    </div>
);

const FireRow: React.FC<{ fire: FirePoint, onClick: () => void }> = ({ fire, onClick }) => (
    <div 
        onClick={onClick}
        style={{ padding: '12px', borderBottom: BORDER.standard, cursor: 'pointer', transition: 'background 0.1s linear' }}
        className="hover:bg-bg-elevated"
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary }}>{fire.frp} MW POWER</span>
            <span style={{ fontSize: TYPE.size.xs, padding: '1px 6px', background: `${getFireColor(fire.frp)}20`, border: `1px solid ${getFireColor(fire.frp)}40`, color: getFireColor(fire.frp), fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps, borderRadius: '2px' }}>
                {fire.daynight === 'D' ? 'DAY' : 'NIGHT'}
            </span>
        </div>
        <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>
            LAT: {fire.latitude.toFixed(4)} LON: {fire.longitude.toFixed(4)}
        </div>
    </div>
);

const FirePopup: React.FC<{ fire: FirePoint }> = ({ fire }) => (
    <div style={{ background: COLOR.bg.overlay, color: COLOR.text.primary, padding: '8px', fontSize: TYPE.size.xs }}>
        <div style={{ borderBottom: BORDER.standard, paddingBottom: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={14} color={getFireColor(fire.frp)} />
            <div style={{ fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>THERMAL_SCAN_REPORT</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
                <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>RADIATIVE_POWER</div>
                <div style={{ fontWeight: TYPE.weight.black, fontSize: '12px', color: getFireColor(fire.frp), fontFamily: TYPE.family.mono }}>{fire.frp} MW</div>
            </div>
            <div>
                <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>SAT_BRIGHTNESS</div>
                <div style={{ fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono }}>{fire.bright_ti4} K</div>
            </div>
            <div>
                <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>ACQ_TIME</div>
                <div style={{ fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono }}>{fire.acq_date} {fire.acq_time}</div>
            </div>
            <div>
                <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>LAT/LON</div>
                <div style={{ fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono }}>{fire.latitude.toFixed(3)}, {fire.longitude.toFixed(3)}</div>
            </div>
        </div>
    </div>
);

export default FireMap;
