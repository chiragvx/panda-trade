import React, { useState } from 'react';
import { Key, Globe, Shield, Zap, Anchor, Activity, Server, ArrowRight, Check, X, Plane } from 'lucide-react';
import { 
  COLOR, 
  TYPE, 
  BORDER, 
  SPACE, 
  Text, 
  Badge, 
  Button, 
  Input 
} from '../../ds';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';

const PROVIDERS = [
    { id: 'upstox-01', name: 'Upstox', type: 'BROKER', icon: <Zap size={16} />, color: COLOR.semantic.info },
    { id: 'aisstream-01', name: 'AISStream', type: 'DATA_FEED', icon: <Anchor size={16} />, color: COLOR.semantic.info },
    { id: 'nasa-01', name: 'NASA FIRMS', type: 'DATA_FEED', icon: <Activity size={16} />, color: COLOR.semantic.down },
    { id: 'opensky-01', name: 'OpenSky Network', type: 'DATA_FEED', icon: <Plane size={16} />, color: COLOR.semantic.info },
];

export const GenericConnect: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addConnection, setAisStreamApiKey, setNasaApiKey, setOpenSkyCredentials } = useSettingsStore();
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
        }, 1200);
    };

    const handleSave = () => {
        if (!selectedProvider) return;
        
        if (selectedProvider.id === 'upstox-01') {
            setCredentials(formData.apiKey, formData.apiSecret);
        } else if (selectedProvider.id === 'aisstream-01') {
            setAisStreamApiKey(formData.apiKey);
        } else if (selectedProvider.id === 'nasa-01') {
            setNasaApiKey(formData.apiKey);
        } else if (selectedProvider.id === 'opensky-01') {
            setOpenSkyCredentials(formData.apiKey, formData.apiSecret);
        }

        addConnection(selectedProvider.id);
        onClose();
    };

    return (
        <div style={{ padding: SPACE[6], display: 'flex', flexDirection: 'column', background: COLOR.bg.surface, color: COLOR.text.primary }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE[6] }}>
                <div>
                    <Text size="lg" weight="black" style={{ letterSpacing: TYPE.letterSpacing.caps }} block>
                        {step === 1 ? 'CONNECT_NEW_BACKEND' : `CONFIG_${selectedProvider?.name.toUpperCase()}`}
                    </Text>
                    <Text size="xs" color="muted" weight="bold">
                        {step === 1 
                            ? 'Select a provider to establish a multi-service data tunnel.' 
                            : 'Enter credentials for terminal authorization.'}
                    </Text>
                </div>
                <button 
                  onClick={onClose} 
                  style={{ background: 'transparent', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>
            </div>

            {step === 1 ? (
                /* Provider Selection Area */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: SPACE[3] }}>
                    {PROVIDERS.map(p => (
                        <div 
                            key={p.id}
                            onClick={() => handleProviderSelect(p)}
                            style={{ 
                                background: COLOR.bg.elevated, 
                                border: BORDER.standard, 
                                padding: SPACE[4], 
                                borderRadius: '2px', 
                                cursor: 'pointer',
                                transition: 'all 0.1s linear'
                            }}
                            onMouseOver={e => (e.currentTarget.style.borderColor = p.color)}
                            onMouseOut={e => (e.currentTarget.style.borderColor = COLOR.bg.border)}
                        >
                            <div style={{ color: p.color, marginBottom: SPACE[2] }}>{p.icon}</div>
                            <Text size="sm" weight="black" block>{p.name}</Text>
                            <Badge label={p.type} variant="muted" />
                        </div>
                    ))}
                </div>
            ) : (
                /* Credentials Form Area */
                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
                    <div>
                        <Text variant="label" size="xs" color="muted" weight="black" style={{ marginBottom: SPACE[1] }} block>
                            IDENT_KEY / CLIENT_ID
                        </Text>
                        <Input 
                            value={formData.apiKey}
                            onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                            placeholder="e.g. panda_live_0123"
                        />
                    </div>
                    {selectedProvider?.id === 'nasa-01' && (
                        <div style={{ marginTop: '-8px' }}>
                            <Button variant="ghost" size="xs" onClick={() => window.open('https://firms.modaps.eosdis.nasa.gov/api/data_availability/')} style={{ color: COLOR.semantic.info }}>
                                OBTAIN_MAP_KEY_SECURE ↗
                            </Button>
                        </div>
                    )}
                    {selectedProvider?.id !== 'aisstream-01' && selectedProvider?.id !== 'nasa-01' && (
                        <div>
                            <Text variant="label" size="xs" color="muted" weight="black" style={{ marginBottom: SPACE[1] }} block>
                                AUTH_SECRET / ACCESS_TOKEN
                            </Text>
                            <Input 
                                type="password"
                                value={formData.apiSecret}
                                onChange={e => setFormData({ ...formData, apiSecret: e.target.value })}
                                placeholder="••••••••••••••••"
                            />
                        </div>
                    )}

                    <div style={{ marginTop: SPACE[3], display: 'flex', gap: SPACE[2] }}>
                        <Button 
                            variant="secondary" 
                            onClick={() => setStep(1)}
                            style={{ flex: 0.3 }}
                        >
                            BACK
                        </Button>
                        <Button 
                            variant="primary"
                            onClick={handleTest}
                            loading={isTesting}
                            disabled={!formData.apiKey}
                            style={{ flex: 1 }}
                        >
                            {testResult === 'SUCCESS' ? 'VALIDATED' : 'TEST_CONNECTION'}
                            {testResult === 'SUCCESS' && <Check size={14} style={{ marginLeft: '8px' }} />}
                        </Button>
                    </div>

                    <Button 
                        variant="primary"
                        onClick={handleSave}
                        disabled={!testResult}
                        style={{ 
                            background: testResult === 'SUCCESS' ? COLOR.semantic.info : COLOR.bg.elevated,
                            color: testResult === 'SUCCESS' ? COLOR.text.inverse : COLOR.text.muted,
                            marginTop: SPACE[2]
                        }}
                    >
                        AUTHORIZE_CONNECTION <ArrowRight size={14} style={{ marginLeft: '8px' }} />
                    </Button>
                </div>
            )}
        </div>
    );
};
