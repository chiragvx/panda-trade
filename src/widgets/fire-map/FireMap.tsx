import React, { useMemo, useState, useEffect } from 'react';
import { Flame, MapPin, Search, Filter, Eye, EyeOff, Shield, Radio, Activity, AlertTriangle, Layers, Target, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
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
    if (frp > 100) return '#ff0000'; // Extreme
    if (frp > 50) return '#ff7700';  // High
    if (frp > 10) return '#ffaa00';  // Moderate
    return '#ffee00';               // Low
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
            setStatus('ERROR');
            return;
        }

        // Return from cache if valid
        if (!force && memoryCache_fires && (Date.now() - memoryCache_lastFetch < CACHE_TTL)) {
            setFires(memoryCache_fires);
            setLoading(false);
            setStatus('LIVE');
            return;
        }

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

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Flame size={12} color={COLOR.semantic.down} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: COLOR.text.secondary, textTransform: 'uppercase' }}>
                        NASA_FIRMS_THERMAL_SCANNER
                    </span>
                    <div style={{ 
                        fontSize: '8px', 
                        padding: '1px 6px', 
                        background: '#ff000020', 
                        color: '#ff3333', 
                        borderRadius: '2px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <Activity size={8} /> LIVE
                    </div>
                </div>
                <div style={{ fontSize: '9px', color: COLOR.text.muted, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>E_FIRE: {stats.extreme}</span>
                    <span>GLOBAL_HITS: {stats.total}</span>
                    <button onClick={() => fetchFires(true)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <Info size={12} />
                    </button>
                </div>
            </WidgetShell.Toolbar>

            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                {/* Control Panel */}
                <div style={{ width: '280px', borderRight: BORDER.standard, background: COLOR.bg.surface, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: BORDER.standard, background: COLOR.bg.elevated }}>
                            {nasaApiKey ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: COLOR.bg.surface, border: BORDER.standard, padding: '8px 12px', borderRadius: '4px', marginBottom: '20px' }}>
                                    <Search size={14} color={COLOR.text.muted} />
                                    <input 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="LOCATE_COORDS..."
                                        style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '11px', fontFamily: TYPE.family.mono, width: '100%' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ padding: '12px', background: '#ff000010', border: '1px solid #ff000040', borderRadius: '4px', marginBottom: '20px', textAlign: 'center' }}>
                                    <AlertTriangle size={20} color={COLOR.semantic.down} style={{ margin: '0 auto 8px' }} />
                                    <div style={{ fontSize: '10px', color: COLOR.semantic.down, fontWeight: 'bold' }}>API_KEY_REQUIRED</div>
                                    <div style={{ fontSize: '9px', color: COLOR.text.muted, marginTop: '4px' }}>Add NASA FIRMS Map Key in API Dashboard</div>
                                </div>
                            )}

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: '9px', fontWeight: 'bold', color: '#666' }}>FRP_THRESHOLD (MW)</label>
                                <span style={{ fontSize: '10px', color: COLOR.semantic.down, fontWeight: 'bold' }}>{frpThreshold}MW+</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="300" 
                                value={frpThreshold}
                                onChange={e => setFrpThreshold(Number(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer', accentColor: COLOR.semantic.down }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#444', marginTop: '4px' }}>
                                <span>ALL_PULSES</span>
                                <span>MAJOR_INFERNO</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <StatBox label="EXTREME" value={stats.extreme} color="#ff0000" />
                            <StatBox label="FILTERED" value={filteredFires.length} color="#ff7700" />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        {filteredFires.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.3 }}>
                                <AlertTriangle size={32} style={{ margin: '0 auto 12px' }} />
                                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>NO ANOMALIES FILTERED</div>
                            </div>
                        ) : (
                            filteredFires.slice(0, 50).map((f, i) => (
                                <FireRow key={`${f.latitude}-${i}`} fire={f} onClick={() => setSelectedFire(f)} />
                            ))
                        )}
                    </div>
                </div>

                {/* Map View */}
                <div style={{ flex: 1, background: '#050505', position: 'relative' }}>
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
    <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '10px', borderRadius: '4px' }}>
        <div style={{ fontSize: '8px', color: '#666', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: color }}>{value}</div>
    </div>
);

const FireRow: React.FC<{ fire: FirePoint, onClick: () => void }> = ({ fire, onClick }) => (
    <div 
        onClick={onClick}
        style={{ padding: '12px', borderBottom: '1px solid #111', cursor: 'pointer' }}
        onMouseOver={e => (e.currentTarget.style.background = '#111')}
        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{fire.frp} MW POWER</span>
            <span style={{ fontSize: '9px', padding: '1px 5px', background: `${getFireColor(fire.frp)}20`, color: getFireColor(fire.frp), fontWeight: 'bold' }}>
                {fire.daynight === 'D' ? 'DAY' : 'NIGHT'}
            </span>
        </div>
        <div style={{ fontSize: '9px', color: '#555', fontFamily: TYPE.family.mono }}>
            LAT: {fire.latitude.toFixed(4)} LON: {fire.longitude.toFixed(4)}
        </div>
    </div>
);

const FirePopup: React.FC<{ fire: FirePoint }> = ({ fire }) => (
    <div style={{ background: '#000', color: '#fff', padding: '4px', fontSize: '11px' }}>
        <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={14} color={getFireColor(fire.frp)} />
            <div style={{ fontWeight: 'bold' }}>THERMAL_SCAN_REPORT</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
                <div style={{ fontSize: '7px', color: '#666' }}>RADIATIVE_POWER</div>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: getFireColor(fire.frp) }}>{fire.frp} MW</div>
            </div>
            <div>
                <div style={{ fontSize: '7px', color: '#666' }}>SAT_BRIGHTNESS</div>
                <div style={{ fontWeight: 'bold' }}>{fire.bright_ti4} K</div>
            </div>
            <div>
                <div style={{ fontSize: '7px', color: '#666' }}>ACQ_TIME</div>
                <div style={{ fontWeight: 'bold' }}>{fire.acq_date} {fire.acq_time}</div>
            </div>
            <div>
                <div style={{ fontSize: '7px', color: '#666' }}>LAT/LON</div>
                <div style={{ fontWeight: 'bold' }}>{fire.latitude.toFixed(3)}, {fire.longitude.toFixed(3)}</div>
            </div>
        </div>
    </div>
);

export default FireMap;
