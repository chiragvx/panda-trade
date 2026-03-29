import React, { useState } from 'react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ShieldCheck, ShieldAlert, Key, Globe, LogIn, ExternalLink, Lock, Zap, Anchor, Activity, Info, Eye, EyeOff } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../ds/tokens';

interface ApiConfigModalProps {
    provider: 'UPSTOX' | 'AISSTREAM' | 'NASA';
    onClose: () => void;
}

const SecureInput: React.FC<{ 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string;
  label: string;
  icon: React.ReactNode;
}> = ({ value, onChange, placeholder, label, icon }) => {
  const [visible, setVisible] = useState(false);
  
  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '10px 12px',
    fontSize: '12px',
    fontFamily: TYPE.family.mono,
    color: '#fff',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px'
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{icon} {label}</label>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#0a0a0a', 
        border: '1px solid #222', 
        borderRadius: '4px' 
      }}>
        <input 
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
        <button 
          onClick={() => setVisible(!visible)}
          style={{ 
            background: 'transparent', border: 'none', color: '#444', 
            padding: '0 12px', cursor: 'pointer', transition: 'color 0.1s' 
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#444'}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
};

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ provider, onClose }) => {
    // Upstox State
    const upstox = useUpstoxStore();
    const [upstoxKey, setUpstoxKey] = useState(upstox.apiKey);
    const [upstoxSecret, setUpstoxSecret] = useState(upstox.apiSecret);
    const [redirectUrl] = useState(`${window.location.origin}/callback`);

    // Extended Settings State
    const settings = useSettingsStore();
    const [aisKey, setAisKey] = useState(settings.aisStreamApiKey);
    const [nasaKey, setNasaKey] = useState(settings.nasaApiKey);

    const [isSaving, setIsSaving] = useState(false);

    const providers = {
        UPSTOX: {
            title: 'Upstox Terminal Bridge',
            icon: <Zap size={18} />,
            image: '/upstox_api_guide.png',
            guide: 'Create a "Trading API" app in the Upstox Developer Portal. Ensure you set the Redirect URL correctly to authorize the terminal.',
            link: 'https://account.upstox.com/developer/apps',
            handleSave: () => {
                upstox.setCredentials(upstoxKey, upstoxSecret);
            }
        },
        AISSTREAM: {
            title: 'AISStream Marine Protocol',
            icon: <Anchor size={18} />,
            image: '/aisstream_api_guide.png',
            guide: 'Register for a free API key at AISStream.io. This key enables live global vessel tracking and maritime intelligence.',
            link: 'https://aisstream.io/authenticate',
            handleSave: () => {
                settings.setAisStreamApiKey(aisKey);
            }
        },
        NASA: {
            title: 'NASA FIRMS Protocol',
            icon: <Activity size={18} />,
            image: '/nasa_firms_api_guide.png',
            guide: 'Obtain a Mapbox/NASA Earthdata API key for VIIRS fire scanning. This allows live monitoring of thermal anomalies.',
            link: 'https://firms.modaps.eosdis.nasa.gov/api/data_availability/',
            handleSave: () => {
                settings.setNasaApiKey(nasaKey);
            }
        }
    };

    const config = providers[provider];

    const onSave = () => {
        setIsSaving(true);
        config.handleSave();
        setTimeout(() => {
            setIsSaving(false);
            if (provider !== 'UPSTOX') onClose();
        }, 800);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: '#0a0a0a',
        border: '1px solid #222',
        padding: '10px 12px',
        fontSize: '12px',
        fontFamily: TYPE.family.mono,
        color: '#fff',
        outline: 'none',
        borderRadius: '4px',
        marginBottom: '16px'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px'
    };

    return (
        <div style={{ 
            display: 'flex', 
            width: '800px', 
            height: '500px', 
            background: '#000', 
            border: '1px solid #333',
            overflow: 'hidden',
            boxShadow: '0 30px 100px rgba(0,0,0,0.8)'
        }}>
            {/* Left Column: Info & Image */}
            <div style={{ 
                flex: 1.2, 
                borderRight: '1px solid #222', 
                background: '#050505',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
                    <img 
                        src={config.image} 
                        alt="API Guide" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <div style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        padding: '24px', 
                        background: 'linear-gradient(to top, #050505, transparent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                            {config.icon}
                            <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{config.title}</span>
                        </div>
                    </div>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.6', margin: 0 }}>
                        {config.guide}
                    </p>
                    <a 
                        href={config.link} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                            fontSize: '11px', 
                            color: COLOR.semantic.info, 
                            textDecoration: 'none', 
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        GET API KEY FROM SOURCE <ExternalLink size={12} />
                    </a>
                </div>
            </div>

            {/* Right Column: Inputs */}
            <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    <h3 style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold', margin: '0 0 24px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configuration</h3>
                    
                    {provider === 'UPSTOX' && (
                        <>
                            <SecureInput 
                                label="API KEY (CLIENT ID)"
                                icon={<Key size={12} />}
                                value={upstoxKey}
                                onChange={setUpstoxKey}
                                placeholder="Enter Upstox API Key"
                            />
                            
                            <SecureInput 
                                label="API SECRET"
                                icon={<Lock size={12} />}
                                value={upstoxSecret}
                                onChange={setUpstoxSecret}
                                placeholder="••••••••••••••••"
                            />

                            <label style={labelStyle}><Globe size={12} /> REDIRECT URI</label>
                            <input 
                                value={redirectUrl} 
                                readOnly 
                                style={{ ...inputStyle, color: '#444', background: 'transparent' }} 
                            />
                        </>
                    )}

                    {provider === 'AISSTREAM' && (
                        <SecureInput 
                            label="AISSTREAM API KEY"
                            icon={<Key size={12} />}
                            value={aisKey}
                            onChange={setAisKey}
                            placeholder="Paste AISStream Token"
                        />
                    )}

                    {provider === 'NASA' && (
                        <SecureInput 
                            label="FIRMS SCANNER KEY"
                            icon={<Key size={12} />}
                            value={nasaKey}
                            onChange={setNasaKey}
                            placeholder="Paste NASA Earthdata Key"
                        />
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                        onClick={onSave}
                        disabled={isSaving}
                        style={{ 
                            width: '100%', 
                            height: '40px', 
                            background: isSaving ? '#222' : COLOR.semantic.info, 
                            color: '#fff', 
                            border: 'none', 
                            fontWeight: 'bold', 
                            fontSize: '12px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            transition: 'all 0.1s'
                        }}
                    >
                        {isSaving ? 'STORAGE_UPDATING...' : 'SAVE CONFIGURATION'}
                    </button>

                    {provider === 'UPSTOX' && upstox.apiKey && (
                         <button 
                            onClick={() => {
                                const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${upstox.apiKey}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
                                window.location.href = authUrl;
                            }}
                            style={{ 
                                width: '100%', 
                                height: '40px', 
                                background: '#fff', 
                                color: '#000', 
                                border: 'none', 
                                fontWeight: '900', 
                                fontSize: '12px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <LogIn size={16} /> INITIALIZE SESSION
                        </button>
                    )}

                    <button 
                        onClick={onClose}
                        style={{ 
                            width: '100%', 
                            background: 'transparent', 
                            color: '#666', 
                            border: 'none', 
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginTop: '8px'
                        }}
                    >
                        CANCEL
                    </button>
                </div>
            </div>
        </div>
    );
};
