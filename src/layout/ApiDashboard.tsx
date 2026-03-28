import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, Plus, AlertCircle, ChevronDown, Zap, Anchor, ShieldCheck, ShieldAlert, Key, Globe, MoreVertical, ExternalLink, Settings2, Power, Trash2 } from 'lucide-react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLOR, BORDER, TYPE, SPACE } from '../ds/tokens';
import UpstoxConnect from '../widgets/upstox/UpstoxConnect';
import { AisStreamConnect } from '../widgets/Other/AisStreamConnect';
import { GenericConnect } from '../widgets/Other/GenericConnect';

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
    const { aisStreamApiKey, setAisStreamApiKey, enabledConnections, removeConnection } = useSettingsStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONNECTED' | 'DISCONNECTED'>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'BROKER' | 'DATA_FEED'>('ALL');
    const [activeModal, setActiveModal] = useState<'UPSTOX' | 'AISSTREAM' | 'GENERIC' | null>(null);

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
        }
    ], [upstoxStatus, upstoxKey, aisStreamApiKey]);

    // Derived list based on what user has "added"
    const connections = useMemo(() => 
        masterConnections.filter(c => enabledConnections.includes(c.id)),
    [masterConnections, enabledConnections]);

    const handleDelete = (id: string, provider: string) => {
        if (provider === 'UPSTOX') return; // Restriction
        
        removeConnection(id);
        if (provider === 'AISSTREAM') {
            setAisStreamApiKey('');
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
                        onClick={() => setActiveModal('GENERIC')}
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
                            onClick={() => setActiveModal('GENERIC')}
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
            {activeModal === 'UPSTOX' && (
                <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <UpstoxConnect />
                    </div>
                </div>
            )}
            {activeModal === 'AISSTREAM' && (
                <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <AisStreamConnect />
                    </div>
                </div>
            )}
            {activeModal === 'GENERIC' && (
                <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <GenericConnect onClose={() => setActiveModal(null)} />
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
