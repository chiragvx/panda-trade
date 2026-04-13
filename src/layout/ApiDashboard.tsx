import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, Plus, AlertCircle, ChevronDown, Zap, Anchor, ShieldCheck, ShieldAlert, Key, Globe, MoreVertical, ExternalLink, Settings2, Power, Trash2, Activity, Server, Plane } from 'lucide-react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLOR, BORDER, TYPE, SPACE } from '../ds/tokens';
import { ApiConfigModal } from '../components/ApiConfigModal';

interface ConnectionMeta {
    id: string;
    type: 'BROKER' | 'DATA_FEED' | 'GENERIC';
    provider: string;
    displayName: string;
    description: string;
    icon: React.ReactNode;
    status: 'connected' | 'disconnected' | 'pending';
    lastActivity: string;
}

export const ApiDashboard: React.FC = () => {
    const { status: upstoxStatus, apiKey: upstoxKey, logout: upstoxLogout } = useUpstoxStore();
    const { 
        aisStreamApiKey, 
        nasaApiKey, 
        rapidApiKey,
        openSkyUsername, 
        setAisStreamApiKey, 
        setRapidApiKey,
        enabledConnections, 
        removeConnection 
    } = useSettingsStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONNECTED' | 'DISCONNECTED'>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'BROKER' | 'DATA_FEED'>('ALL');
    const [activeModal, setActiveModal] = useState<'UPSTOX' | 'AISSTREAM' | 'NASA' | 'OPENSKY' | 'RAPIDAPI' | 'SELECT' | null>(null);

    // Master manifest of supported backends
    const masterConnections: ConnectionMeta[] = useMemo(() => [
        {
            id: 'upstox-01',
            type: 'BROKER',
            provider: 'UPSTOX',
            displayName: 'Upstox Terminal Bridge',
            description: 'Primary trade execution and Nifty market data stream.',
            icon: <Zap size={18} />,
            status: upstoxStatus === 'connected' ? 'connected' : (upstoxKey ? 'pending' : 'disconnected'),
            lastActivity: upstoxStatus === 'connected' ? 'Live Now' : '2h ago'
        },
        {
            id: 'aisstream-01',
            type: 'DATA_FEED',
            provider: 'AISSTREAM',
            displayName: 'AISStream Marine Protocol',
            description: 'Live global AIS vessel positions and maritime intelligence.',
            icon: <Anchor size={18} />,
            status: aisStreamApiKey ? 'connected' : 'disconnected',
            lastActivity: aisStreamApiKey ? 'Live Now' : 'Never'
        },
        {
            id: 'nasa-01',
            type: 'DATA_FEED',
            provider: 'NASA',
            displayName: 'NASA FIRMS Protocol',
            description: 'Global live thermal anomaly and fire scanner via VIIRS S-NPP.',
            icon: <Activity size={18} />,
            status: nasaApiKey ? 'connected' : 'disconnected',
            lastActivity: nasaApiKey ? 'Live Now' : 'Never'
        },
        {
            id: 'opensky-01',
            type: 'DATA_FEED',
            provider: 'OPENSKY',
            displayName: 'OpenSky Network Protocol',
            description: 'High-fidelity global flight tracking and state vector data stream.',
            icon: <Plane size={18} />,
            status: openSkyUsername ? 'connected' : 'disconnected',
            lastActivity: openSkyUsername ? 'Live Now' : 'Never'
        },
        {
            id: 'rapidapi-01',
            type: 'DATA_FEED',
            provider: 'RAPIDAPI',
            displayName: 'RapidAPI Economic Intel',
            description: 'Live global economic calendar and macro-event data stream.',
            icon: <Globe size={18} />,
            status: rapidApiKey ? 'connected' : 'disconnected',
            lastActivity: rapidApiKey ? 'Live Now' : 'Never'
        }
    ], [upstoxStatus, upstoxKey, aisStreamApiKey, nasaApiKey, openSkyUsername, rapidApiKey]);

    // Derived list based on what user has "added"
    const connections = useMemo(() => 
        masterConnections.filter(c => enabledConnections.includes(c.id)),
    [masterConnections, enabledConnections]);

    const handleDelete = (id: string, provider: string) => {
        if (provider === 'UPSTOX') return; // Restriction
        
        removeConnection(id);
        if (provider === 'AISSTREAM') {
            setAisStreamApiKey('');
        } else if (provider === 'NASA') {
            useSettingsStore.getState().setNasaApiKey('');
        } else if (provider === 'OPENSKY') {
            useSettingsStore.getState().setOpenSkyCredentials('', '');
        } else if (provider === 'RAPIDAPI') {
            setRapidApiKey('');
        }
    };

    const filteredConnections = connections.filter(c => {
        const matchesSearch = c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             c.provider.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || 
                             (statusFilter === 'CONNECTED' && c.status === 'connected') ||
                             (statusFilter === 'DISCONNECTED' && c.status === 'disconnected');
                             
        const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });

    const hasAnyConnection = connections.some(c => c.status !== 'disconnected');

    return (
        <div style={{ height: '100%', width: '100%', background: '#080808', display: 'flex', flexDirection: 'column' }}>
            {/* Top Toolbar */}
            <div style={{ 
                height: '64px', 
                borderBottom: BORDER.standard, 
                background: '#0a0a0a', 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0 24px', 
                gap: '12px' 
            }}>
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    background: '#111', 
                    border: '1px solid #222', 
                    height: '34px',
                    borderRadius: '4px',
                    padding: '0 12px',
                    maxWidth: '400px'
                }}>
                    <Search size={14} color="#666" />
                    <input 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search for Connection"
                        style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '12px', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <ToolbarDropdown 
                        label="Status" 
                        options={['ALL', 'CONNECTED', 'DISCONNECTED']} 
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v as any)} 
                    />
                    <ToolbarDropdown 
                        label="Type" 
                        options={['ALL', 'BROKER', 'DATA_FEED']}
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(v as any)}
                    />
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                            setTypeFilter('ALL');
                        }}
                        style={{ 
                            width: '34px', 
                            height: '34px', 
                            background: '#111', 
                            border: '1px solid #222', 
                            borderRadius: '4px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button 
                        onClick={() => setActiveModal('SELECT')}
                        style={{ 
                            height: '34px', 
                            background: COLOR.semantic.info, 
                            border: 'none', 
                            borderRadius: '4px', 
                            padding: '0 16px',
                            color: COLOR.text.inverse,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        Connect Backend
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }} className="custom-scrollbar">
                {!hasAnyConnection && (searchQuery === '' && statusFilter === 'ALL' && typeFilter === 'ALL') ? (
                    <div style={{ 
                        width: '100%', 
                        maxWidth: '900px', 
                        margin: '0 auto',
                        background: '#111111', 
                        border: '1px solid #222', 
                        borderRadius: '4px', 
                        height: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        textAlign: 'center'
                    }}>
                        <AlertCircle size={40} color="#444" />
                        <div>
                            <h3 style={{ fontSize: '16px', color: '#fff', margin: '0 0 8px 0' }}>No connections added</h3>
                            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Please connect your first backend to start receiving data.</p>
                        </div>
                        <button 
                            onClick={() => setActiveModal('SELECT')}
                            style={{ 
                                background: 'transparent', 
                                border: '1px solid #333', 
                                color: '#fff', 
                                padding: '8px 20px', 
                                borderRadius: '4px', 
                                fontSize: '12px', 
                                cursor: 'pointer' 
                            }}
                        >
                            Connect Backend
                        </button>
                    </div>
                ) : (
                    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '14px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {filteredConnections.length} Active Cloud Infrastructure
                            </h2>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                            {filteredConnections.map(conn => (
                                <ConnectionCard 
                                    key={conn.id} 
                                    conn={conn} 
                                    onConfig={() => setActiveModal(conn.provider as any)}
                                    onDelete={() => handleDelete(conn.id, conn.provider)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Config Overlay (Simulated Modals) */}
            {activeModal && (
                <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
                    <div style={{ ...modalContentStyle, width: 'auto', maxWidth: 'none', background: 'transparent', border: 'none', boxShadow: 'none' }} onClick={e => e.stopPropagation()}>
                        {activeModal === 'SELECT' && (
                            <div style={{ 
                                display: 'flex',
                                width: '800px', 
                                height: '500px',
                                background: '#000', 
                                border: '1px solid #333',
                                boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
                                overflow: 'hidden'
                            }}>
                                {/* Left Image Column */}
                                <div style={{ 
                                    flex: 1.2, 
                                    borderRight: '1px solid #222', 
                                    background: '#050505',
                                    position: 'relative'
                                }}>
                                    <img 
                                        src="/cloud_infra_wide.png" 
                                        alt="Cloud Infra" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div style={{ position: 'absolute', bottom: 24, left: 24 }}>
                                        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '0.1em' }}>CLOUD_BACKEND</h1>
                                        <div style={{ height: '4px', width: '40px', background: COLOR.semantic.info, marginTop: '8px' }} />
                                    </div>
                                </div>

                                {/* Right Selection Column */}
                                <div style={{ flex: 2, padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div>
                                        <h2 style={{ color: '#fff', fontSize: '18px', margin: '0 0 4px 0', fontWeight: '900', letterSpacing: '0.05em' }}>SELECT INFRASTRUCTURE</h2>
                                        <p style={{ color: '#666', fontSize: '11px', margin: 0 }}>Choose a protocol to authorize with the terminal.</p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                                        {[
                                            { id: 'UPSTOX', title: 'Upstox Terminal Bridge', desc: 'Secure broker API for trade execution & live Nifty streams.', icon: <Zap size={18} />, color: COLOR.semantic.info },
                                            { id: 'AISSTREAM', title: 'AISStream Global Marine', desc: 'Real-time WebSocket feed for global maritime vessel tracking.', icon: <Anchor size={18} />, color: COLOR.semantic.info },
                                            { id: 'NASA', title: 'NASA FIRMS Protocol', desc: 'Thermal anomaly satellite data for global fire monitoring.', icon: <Activity size={18} />, color: COLOR.semantic.info },
                                            { id: 'OPENSKY', title: 'OpenSky Network Protocol', desc: 'Global high-precision flight tracking vectors and aircraft metadata.', icon: <Plane size={18} />, color: COLOR.semantic.info },
                                            { id: 'RAPIDAPI', title: 'RapidAPI Economic Intel', desc: 'Global economic events and macro-calendar data stream.', icon: <Globe size={18} />, color: COLOR.semantic.info }
                                        ].map(p => (
                                            <div 
                                                key={p.id}
                                                onClick={() => setActiveModal(p.id as any)}
                                                style={{ 
                                                    background: '#0a0a0a', 
                                                    border: '1px solid #1a1a1a', 
                                                    padding: '16px 20px', 
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.1s linear',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px'
                                                }}
                                                onMouseOver={e => {
                                                    e.currentTarget.style.borderColor = '#333';
                                                    e.currentTarget.style.background = '#0f0f0f';
                                                }}
                                                onMouseOut={e => {
                                                    e.currentTarget.style.borderColor = '#1a1a1a';
                                                    e.currentTarget.style.background = '#0a0a0a';
                                                }}
                                            >
                                                <div style={{ color: p.color }}>{p.icon}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>{p.title}</div>
                                                    <div style={{ color: '#666', fontSize: '10px' }}>{p.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => setActiveModal(null)}
                                        style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        RETURN_TO_DASHBOARD
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeModal === 'UPSTOX' && <ApiConfigModal provider="UPSTOX" onClose={() => setActiveModal(null)} />}
                        {activeModal === 'AISSTREAM' && <ApiConfigModal provider="AISSTREAM" onClose={() => setActiveModal(null)} />}
                        {activeModal === 'NASA' && <ApiConfigModal provider="NASA" onClose={() => setActiveModal(null)} />}
                        {activeModal === 'OPENSKY' && <ApiConfigModal provider="OPENSKY" onClose={() => setActiveModal(null)} />}
                        {activeModal === 'RAPIDAPI' && <ApiConfigModal provider="RAPIDAPI" onClose={() => setActiveModal(null)} />}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const ToolbarDropdown: React.FC<{ 
    label: string, 
    options: string[], 
    value: string, 
    onChange: (val: string) => void 
}> = ({ label, options, value, onChange }) => (
    <div style={{ position: 'relative' }}>
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ 
                height: '34px', 
                padding: '0 32px 0 12px', 
                background: '#111', 
                border: '1px solid #222', 
                borderRadius: '4px', 
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
                minWidth: '100px'
            }}
        >
            {options.map(opt => (
                <option key={opt} value={opt}>{opt === 'ALL' ? label : opt}</option>
            ))}
        </select>
        <ChevronDown size={12} color="#666" style={{ position: 'absolute', right: '12px', top: '11px', pointerEvents: 'none' }} />
    </div>
);

const ConnectionCard: React.FC<{ 
    conn: ConnectionMeta; 
    onConfig: () => void;
    onDelete: () => void;
}> = ({ conn, onConfig, onDelete }) => {
    const statusColor = {
        connected: COLOR.semantic.up,
        disconnected: '#444',
        pending: COLOR.semantic.warning
    }[conn.status];

    return (
        <div 
            style={{ 
                background: '#111', 
                border: '1px solid #222', 
                borderRadius: '8px', 
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                transition: 'all 0.2s linear',
                animation: 'fadeIn 0.3s ease-out'
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#444')}
            onMouseOut={e => (e.currentTarget.style.borderColor = '#222')}
        >
            <div style={{ 
                width: '48px', 
                height: '48px', 
                background: '#0a0a0a', 
                border: '1px solid #222', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: conn.status === 'connected' ? COLOR.semantic.info : '#666'
            }}>
                {conn.icon}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', color: '#fff', margin: 0, fontWeight: 'bold' }}>{conn.displayName}</h3>
                    <div style={{ 
                        fontSize: '9px', 
                        fontWeight: 'bold', 
                        padding: '2px 8px', 
                        background: '#000', 
                        border: `1px solid ${statusColor}40`,
                        color: statusColor,
                        borderRadius: '20px',
                        textTransform: 'uppercase'
                    }}>
                        {conn.status}
                    </div>
                </div>
                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{conn.description}</p>
            </div>

            <div style={{ width: '120px', textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#444', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>LAST ACTIVITY</span>
                <span style={{ fontSize: '11px', color: '#666' }}>{conn.lastActivity}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', borderLeft: '1px solid #222', paddingLeft: '20px', marginLeft: '10px' }}>
                <button 
                    onClick={onConfig}
                    style={{ 
                        background: '#1a1a1a', 
                        border: '1px solid #333', 
                        borderRadius: '4px', 
                        padding: '6px 12px',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Settings2 size={12} /> Configure
                </button>
                {conn.provider !== 'UPSTOX' && (
                    <button 
                        onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${conn.displayName}?`)) {
                                onDelete();
                            }
                        }}
                        style={{ 
                            background: 'transparent', 
                            border: '1px solid #333', 
                            borderRadius: '4px', 
                            width: '32px',
                            height: '28px',
                            color: COLOR.semantic.down,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(5px)'
};

const modalContentStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '500px',
    background: '#000',
    border: '1px solid #333',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    padding: '4px'
};
