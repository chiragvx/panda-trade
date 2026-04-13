import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, Plus, AlertCircle, ChevronDown, Zap, Anchor, ShieldCheck, ShieldAlert, Key, Globe, MoreVertical, ExternalLink, Settings2, Power, Trash2, Activity, Server, Plane, X } from 'lucide-react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { 
    COLOR, 
    BORDER, 
    TYPE, 
    SPACE, 
    Z, 
    LAYOUT, 
    ROW_HEIGHT,
    Text, 
    Button, 
    Input, 
    Select, 
    FilterRow, 
    Dot, 
    Tag,
    Tooltip 
} from '../ds';
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
            displayName: 'OpenSky Public Network',
            description: 'Free global flight tracking via OpenSky community vectors.',
            icon: <Plane size={18} />,
            status: enabledConnections.includes('opensky-01') ? 'connected' : 'disconnected',
            lastActivity: enabledConnections.includes('opensky-01') ? 'Live Now' : 'Never'
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
    ], [upstoxStatus, upstoxKey, aisStreamApiKey, nasaApiKey, openSkyUsername, rapidApiKey, enabledConnections]);

    const connections = useMemo(() => 
        masterConnections.filter(c => enabledConnections.includes(c.id)),
    [masterConnections, enabledConnections]);

    const handleDelete = (id: string, provider: string) => {
        if (provider === 'UPSTOX') return;
        
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
        <div style={{ height: '100%', width: '100%', background: COLOR.bg.base, display: 'flex', flexDirection: 'column' }}>
            {/* Top Toolbar */}
            <div style={{ 
                height: '48px', 
                borderBottom: BORDER.standard, 
                background: COLOR.bg.elevated, 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0 24px', 
                gap: '12px' 
            }}>
                <Input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search Infrastructure..."
                    style={{ maxWidth: '300px' }}
                    inputSize="md"
                    rightEl={<Search size={14} color={COLOR.text.muted} />}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                    <Select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        selectSize="md"
                        style={{ width: '120px' }}
                    >
                        <option value="ALL">ALL_STATUS</option>
                        <option value="CONNECTED">CONNECTED</option>
                        <option value="DISCONNECTED">DISCONNECTED</option>
                    </Select>
                    <Select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        selectSize="md"
                        style={{ width: '120px' }}
                    >
                        <option value="ALL">ALL_TYPES</option>
                        <option value="BROKER">BROKER</option>
                        <option value="DATA_FEED">DATA_FEED</option>
                    </Select>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button 
                        variant="ghost" 
                        size="md"
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                            setTypeFilter('ALL');
                        }}
                        style={{ padding: '0 8px' }}
                    >
                        <RotateCcw size={14} />
                    </Button>
                    <Button 
                        variant="filled" 
                        onClick={() => setActiveModal('SELECT')}
                        size="md"
                        style={{ background: COLOR.semantic.info, color: COLOR.text.inverse }}
                    >
                        <Plus size={14} style={{ marginRight: '6px' }} />
                        CONNECT_INFRASTRUCTURE
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }} className="custom-scrollbar">
                {!hasAnyConnection && (searchQuery === '' && statusFilter === 'ALL' && typeFilter === 'ALL') ? (
                    <div style={{ 
                        width: '100%', 
                        maxWidth: '800px', 
                        margin: '64px auto 0 auto',
                        background: COLOR.bg.overlay, 
                        border: BORDER.standard, 
                        borderRadius: 0, 
                        height: '240px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '24px',
                        textAlign: 'center'
                    }}>
                        <div style={{ opacity: 0.3 }}>
                            <Server size={48} color={COLOR.text.muted} />
                        </div>
                        <div>
                            <Text variant="heading" size="md">NO_ACTIVE_CONNECTIONS</Text>
                            <div style={{ marginTop: '8px' }}>
                                <Text size="sm" color="secondary">Authorize a protocol to integrate real-time market or alternative data feeds into the terminal.</Text>
                            </div>
                        </div>
                        <Button 
                            variant="filled" 
                            onClick={() => setActiveModal('SELECT')}
                            style={{ background: COLOR.semantic.info, color: COLOR.text.inverse }}
                        >
                            INITIATE_HANDSHAKE
                        </Button>
                    </div>
                ) : (
                    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                        <div style={{ marginBottom: '24px', borderBottom: BORDER.standard, paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text variant="heading" size="xs" color="muted">
                                {filteredConnections.length} ACTIVE_CLOUD_BACKENDS
                            </Text>
                            <Text size="xs" color="muted">INFRA_HEALTH: OPTIMAL</Text>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
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

            {/* Config Overlay */}
            {activeModal && (
                <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                        {activeModal === 'SELECT' && (
                            <div style={{ 
                                display: 'flex',
                                width: '840px', 
                                height: '540px',
                                background: COLOR.bg.base, 
                                border: BORDER.strong,
                                boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
                                overflow: 'hidden',
                                borderRadius: 0
                            }}>
                                {/* Left Brand Column */}
                                <div style={{ 
                                    flex: 1, 
                                    borderRight: BORDER.standard, 
                                    background: COLOR.bg.base,
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '32px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <Text weight="black" size="3xl" color="info">CLOUD</Text>
                                        <Text weight="black" size="3xl" color="primary">PROTOCOLS</Text>
                                        <div style={{ height: '2px', width: '32px', background: COLOR.semantic.info, marginTop: '12px' }} />
                                    </div>
                                    <div style={{ opacity: 0.1, position: 'absolute', bottom: -20, right: -20 }}>
                                        <Activity size={240} />
                                    </div>
                                    <div style={{ marginTop: 'auto' }}>
                                        <Text size="xs" color="muted">ST_INFRA_ENGINE_V4.6</Text>
                                    </div>
                                </div>

                                {/* Right Selection Column */}
                                <div style={{ flex: 1.8, padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div>
                                        <Text variant="heading" size="lg">SELECT_INFRASTRUCTURE</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            <Text size="sm" color="secondary">Choose a verified gateway to authorize with the terminal ecosystem.</Text>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                                        {[
                                            { id: 'UPSTOX', title: 'Upstox Bridge', desc: 'Secure broker API for trade execution & live Nifty streams.', icon: <Zap size={18} /> },
                                            { id: 'AISSTREAM', title: 'AIS Marine Feed', desc: 'Real-time WebSocket feed for global maritime vessel tracking.', icon: <Anchor size={18} /> },
                                            { id: 'NASA', title: 'NASA FIRMS Sat', desc: 'Thermal anomaly satellite data for global fire monitoring.', icon: <Activity size={18} /> },
                                            { id: 'OPENSKY', title: 'OpenSky Vectors', desc: 'Global high-precision flight tracking vectors and aircraft metadata.', icon: <Plane size={18} /> },
                                            { id: 'RAPIDAPI', title: 'RapidAPI Stream', desc: 'Global economic events and macro-calendar data stream.', icon: <Globe size={18} /> }
                                        ].map(p => (
                                            <div 
                                                key={p.id}
                                                onClick={() => setActiveModal(p.id as any)}
                                                style={{ 
                                                    background: COLOR.bg.overlay, 
                                                    border: BORDER.standard, 
                                                    padding: '16px 20px', 
                                                    borderRadius: 0,
                                                    cursor: 'pointer',
                                                    transition: 'all 60ms linear',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px'
                                                }}
                                                onMouseOver={e => {
                                                    e.currentTarget.style.borderColor = COLOR.semantic.info;
                                                    e.currentTarget.style.background = COLOR.bg.surface;
                                                }}
                                                onMouseOut={e => {
                                                    e.currentTarget.style.borderColor = COLOR.bg.border;
                                                    e.currentTarget.style.background = COLOR.bg.overlay;
                                                }}
                                            >
                                                <div style={{ color: COLOR.semantic.info }}>{p.icon}</div>
                                                <div style={{ flex: 1 }}>
                                                    <Text weight="bold" color="primary">{p.title}</Text>
                                                    <div style={{ marginTop: '2px' }}>
                                                        <Text size="xs" color="muted">{p.desc}</Text>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setActiveModal(null)}
                                        style={{ alignSelf: 'flex-start', padding: 0 }}
                                    >
                                        RETURN_TO_DASHBOARD
                                    </Button>
                                </div>
                            </div>
                        )}
                        {activeModal === 'UPSTOX' && <ApiConfigModal provider="UPSTOX" onClose={() => setActiveModal(null)} />}
                        {activeModal === 'AISSTREAM' && <ApiConfigModal provider="AISSTREAM" onClose={() => setActiveModal(null)} />}
                        {activeModal === 'NASA' && <ApiConfigModal provider="NASA" onClose={() => setActiveModal(null)} />}
                        {activeModal === 'OPENSKY' && (
                            <div style={{ 
                                width: '400px',
                                padding: '32px', 
                                background: COLOR.bg.base, 
                                border: BORDER.strong, 
                                borderRadius: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '20px',
                                textAlign: 'center'
                            }}>
                                 <Globe size={48} color={COLOR.semantic.info} />
                                 <div>
                                    <Text variant="heading" size="md">PUBLIC_NET_ACTIVE</Text>
                                    <div style={{ marginTop: '12px' }}>
                                        <Text size="sm" color="secondary">Using community-sourced OpenSky ADSB vectors. This connection is open and requires no authentication.</Text>
                                    </div>
                                 </div>
                                 <Button variant="filled" onClick={() => setActiveModal(null)} style={{ background: COLOR.semantic.info, color: COLOR.text.inverse, width: '100%' }}>CONFIRM</Button>
                            </div>
                        )}
                        {activeModal === 'RAPIDAPI' && <ApiConfigModal provider="RAPIDAPI" onClose={() => setActiveModal(null)} />}
                    </div>
                </div>
            )}
        </div>
    );
};

const ConnectionCard: React.FC<{ 
    conn: ConnectionMeta; 
    onConfig: () => void;
    onDelete: () => void;
}> = ({ conn, onConfig, onDelete }) => {
    const isUp = conn.status === 'connected';
    const tagVariant = conn.status === 'connected' ? 'up' : (conn.status === 'pending' ? 'warning' : 'muted');

    return (
        <div 
            style={{ 
                background: COLOR.bg.overlay, 
                border: BORDER.standard, 
                borderRadius: 0, 
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                transition: 'all 80ms linear',
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = COLOR.bg.border)}
            onMouseOut={e => (e.currentTarget.style.borderColor = COLOR.bg.border)}
        >
            <div style={{ 
                width: '40px', 
                height: '40px', 
                background: COLOR.bg.base, 
                border: BORDER.standard, 
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isUp ? COLOR.semantic.info : COLOR.text.muted
            }}>
                {conn.icon}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <Text weight="bold" color="primary">{conn.displayName}</Text>
                    <Tag label={conn.status} variant={tagVariant} />
                </div>
                <Text size="xs" color="muted">{conn.description}</Text>
            </div>

            <div style={{ width: '140px', textAlign: 'right' }}>
                <Text variant="label">LAST_ACTIVITY</Text>
                <div style={{ marginTop: '2px' }}>
                    <Text size="xs" color="secondary">{conn.lastActivity}</Text>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', borderLeft: BORDER.standard, paddingLeft: '24px', marginLeft: '12px' }}>
                <Tooltip content="CONFIGURE_ENDPOINT" position="left">
                    <Button 
                        variant="ghost" 
                        onClick={onConfig}
                        size="sm"
                        style={{ border: BORDER.standard, color: COLOR.text.primary, height: '32px', width: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Settings2 size={14} />
                    </Button>
                </Tooltip>
                {conn.provider !== 'UPSTOX' && (
                    <Tooltip content="REMOVE_INFRASTRUCTURE" position="left">
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${conn.displayName}?`)) {
                                    onDelete();
                                }
                            }}
                            size="sm"
                            style={{ border: BORDER.standard, color: COLOR.semantic.down, height: '32px', width: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.9)',
    zIndex: Z.modal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)'
};
