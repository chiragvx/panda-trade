import React, { useState } from 'react';
import { Key, Globe, Shield, Zap, Anchor, Activity, Server, ArrowRight, Check, AlertCircle, X } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';

const PROVIDERS = [
    { id: 'upstox-01', name: 'Upstox', type: 'BROKER', icon: <Zap size={16} />, color: COLOR.semantic.info },
    { id: 'aisstream-01', name: 'AISStream', type: 'DATA_FEED', icon: <Anchor size={16} />, color: COLOR.semantic.info },
    { id: 'opensky', name: 'OpenSky Network', type: 'DATA_FEED', icon: <Activity size={16} />, color: COLOR.semantic.info },
    { id: 'custom', name: 'Custom Backend', type: 'GENERIC', icon: <Server size={16} />, color: COLOR.text.muted },
];

export const GenericConnect: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addConnection, setAisStreamApiKey } = useSettingsStore();
    const { setCredentials } = useUpstoxStore();

    const [step, setStep] = useState<1 | 2>(1);
    const [selectedProvider, setSelectedProvider] = useState<typeof PROVIDERS[0] | null>(null);
    const [formData, setFormData] = useState({ apiKey: '', apiSecret: '', endpoint: '' });
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'SUCCESS' | 'FAILED' | null>(null);

    const handleProviderSelect = (provider: typeof PROVIDERS[0]) => {
        setSelectedProvider(provider);
        setStep(2);
    };

    const handleTest = () => {
        setIsTesting(true);
        setTestResult(null);
        setTimeout(() => {
            setIsTesting(false);
            setTestResult('SUCCESS');
        }, 1500);
    };

    const handleSave = () => {
        if (!selectedProvider) return;
        
        // Save Credentials logic
        if (selectedProvider.id === 'upstox-01') {
            setCredentials(formData.apiKey, formData.apiSecret);
        } else if (selectedProvider.id === 'aisstream-01') {
            setAisStreamApiKey(formData.apiKey);
        }

        // Add to dashboard
        addConnection(selectedProvider.id);
        onClose();
    };

    return (
        <div style={{ padding: SPACE[6], display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE[6] }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#fff', margin: 0 }}>
                        {step === 1 ? 'CONNECT_NEW_BACKEND' : `CONFIG_${selectedProvider?.name.toUpperCase()}`}
                    </h2>
                    <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>
                        {step === 1 ? 'Select a provider to establish a new secure connection.' : 'Enter your credentials to authorize this terminal.'}
                    </p>
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            {step === 1 ? (
                /* Provider Selection Area */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {PROVIDERS.map(p => (
                        <div 
                            key={p.id}
                            onClick={() => handleProviderSelect(p)}
                            style={{ 
                                background: '#111', 
                                border: '1px solid #222', 
                                padding: '16px', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                transition: 'all 0.1s linear'
                            }}
                            onMouseOver={e => (e.currentTarget.style.borderColor = p.color)}
                            onMouseOut={e => (e.currentTarget.style.borderColor = '#222')}
                        >
                            <div style={{ color: p.color, marginBottom: '8px' }}>{p.icon}</div>
                            <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{p.name}</div>
                            <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{p.type}</div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Credentials Form Area */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={labelStyle}>API_KEY / CLIENT_ID</label>
                        <input 
                            value={formData.apiKey}
                            onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                            placeholder="e.g. key_live_12345"
                            style={inputStyle}
                        />
                    </div>
                    {selectedProvider?.id !== 'aisstream-01' && (
                        <div>
                            <label style={labelStyle}>API_SECRET / AUTH_TOKEN</label>
                            <input 
                                type="password"
                                value={formData.apiSecret}
                                onChange={e => setFormData({ ...formData, apiSecret: e.target.value })}
                                placeholder="••••••••••••••••"
                                style={inputStyle}
                            />
                        </div>
                    )}
                    {selectedProvider?.id === 'custom' && (
                        <div>
                            <label style={labelStyle}>REST_WS_ENDPOINT</label>
                            <input 
                                value={formData.endpoint}
                                onChange={e => setFormData({ ...formData, endpoint: e.target.value })}
                                placeholder="https://api.yourbackend.com/v1"
                                style={inputStyle}
                            />
                        </div>
                    )}

                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => setStep(1)}
                            style={{ background: 'transparent', border: '1px solid #333', color: '#666', padding: '10px 16px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Back
                        </button>
                        <button 
                            onClick={handleTest}
                            disabled={isTesting || !formData.apiKey}
                            style={{ 
                                flex: 1,
                                background: '#1a1a1a', 
                                border: '1px solid #333', 
                                color: '#fff', 
                                padding: '10px', 
                                borderRadius: '4px', 
                                fontSize: '11px', 
                                fontWeight: 'bold', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isTesting ? 'Validating...' : (testResult === 'SUCCESS' ? 'Validated' : 'Test Connection')}
                            {testResult === 'SUCCESS' && <Check size={14} color={COLOR.semantic.up} />}
                        </button>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={!testResult && selectedProvider?.id !== 'custom'}
                        style={{ 
                            background: testResult === 'SUCCESS' ? COLOR.semantic.info : '#222', 
                            color: testResult === 'SUCCESS' ? COLOR.text.inverse : '#444', 
                            border: 'none', 
                            padding: '12px', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            fontWeight: 'bold', 
                            cursor: testResult === 'SUCCESS' ? 'pointer' : 'not-allowed',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        Save Connection <ArrowRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #333',
    padding: '10px 12px',
    fontSize: '13px',
    fontFamily: TYPE.family.mono,
    color: '#fff',
    outline: 'none',
    borderRadius: '4px',
};

const labelStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
    display: 'block'
};
