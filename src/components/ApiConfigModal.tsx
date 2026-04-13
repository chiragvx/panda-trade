import React, { useState } from 'react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ShieldCheck, ShieldAlert, Key, Globe, LogIn, ExternalLink, Lock, Zap, Anchor, Activity, Info, Eye, EyeOff, Server, Shield, Plane } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../ds/tokens';

interface ApiConfigModalProps {
    provider: 'UPSTOX' | 'AISSTREAM' | 'NASA' | 'OPENSKY' | 'RAPIDAPI';
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
    fontSize: TYPE.size.xs,
    fontFamily: TYPE.family.mono,
    color: COLOR.text.primary,
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: TYPE.size.xs,
    fontWeight: TYPE.weight.black,
    color: COLOR.text.muted,
    textTransform: 'uppercase',
    letterSpacing: TYPE.letterSpacing.caps,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: SPACE[2]
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{icon} {label}</label>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: COLOR.bg.elevated, 
        border: BORDER.standard, 
        borderRadius: '2px' 
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
            background: 'transparent', border: 'none', color: COLOR.text.muted, 
            padding: '0 12px', cursor: 'pointer', transition: 'color 0.1s' 
          }}
          onMouseEnter={e => e.currentTarget.style.color = COLOR.text.primary}
          onMouseLeave={e => e.currentTarget.style.color = COLOR.text.muted}
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
    const [osUser, setOsUser] = useState(settings.openSkyUsername);
    const [osPass, setOsPass] = useState(settings.openSkyPassword);
    const [rapidKey, setRapidKey] = useState(settings.rapidApiKey);

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
                settings.addConnection('aisstream-01');
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
                settings.addConnection('nasa-01');
            }
        },
        OPENSKY: {
            title: 'OpenSky Public Radar',
            icon: <Plane size={18} />,
            image: '/opensky_api_guide.png',
            guide: 'Accessing global flight vectors via OpenSky Network public API. No credentials required for standard community access. Authenticated sessions are optional for high-frequency data.',
            link: 'https://opensky-network.org/',
            handleSave: () => {
                settings.addConnection('opensky-01');
            }
        },
        RAPIDAPI: {
            title: 'RapidAPI Economic Intel',
            icon: <Globe size={18} />,
            image: '/rapidapi_guide.png',
            guide: 'Access global economic events and macro news via the Ultimate Economic Calendar on RapidAPI. Secure a personal application key to enable live calendar sync.',
            link: 'https://rapidapi.com/toplistaai/api/ultimate-economic-calendar',
            handleSave: () => {
                settings.setRapidApiKey(rapidKey);
                settings.addConnection('rapidapi-01');
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
        background: COLOR.bg.base,
        border: BORDER.standard,
        padding: '10px 12px',
        fontSize: TYPE.size.xs,
        fontFamily: TYPE.family.mono,
        color: COLOR.text.primary,
        outline: 'none',
        borderRadius: '2px',
        marginBottom: SPACE[4]
    };

    const labelStyle: React.CSSProperties = {
        fontSize: TYPE.size.xs,
        fontWeight: TYPE.weight.black,
        color: COLOR.text.muted,
        textTransform: 'uppercase',
        letterSpacing: TYPE.letterSpacing.caps,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: SPACE[2]
    };

    return (
        <div style={{ 
            display: 'flex', 
            width: '800px', 
            height: '500px', 
            background: COLOR.bg.surface, 
            border: BORDER.standard,
            overflow: 'hidden',
            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.8)'
        }}>
            {/* Left Column: Info & Image */}
            <div style={{ 
                flex: 1.2, 
                borderRight: BORDER.standard, 
                background: COLOR.bg.elevated,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ flex: 1, position: 'relative', background: COLOR.bg.base, overflow: 'hidden' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLOR.text.primary }}>
                            {config.icon}
                            <span style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.black, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>{config.title}</span>
                        </div>
                    </div>
                </div>
                <div style={{ padding: SPACE[6], display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
                    <p style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, lineHeight: '1.6', margin: 0, fontWeight: TYPE.weight.bold }}>
                        {config.guide}
                    </p>
                    <a 
                        href={config.link} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                            fontSize: TYPE.size.xs, 
                            color: COLOR.semantic.info, 
                            textDecoration: 'none', 
                            fontWeight: TYPE.weight.black,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            letterSpacing: TYPE.letterSpacing.caps
                        }}
                    >
                        GET API KEY FROM SOURCE <ExternalLink size={12} />
                    </a>
                </div>
            </div>

            {/* Right Column: Inputs */}
            <div style={{ flex: 1, padding: SPACE[8], display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    <h3 style={{ fontSize: TYPE.size.sm, color: COLOR.text.primary, fontWeight: TYPE.weight.black, margin: `0 0 ${SPACE[6]} 0`, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>Configuration</h3>
                    
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
                            label="NASA FIRMS API KEY"
                            icon={<Key size={12} />}
                            value={nasaKey}
                            onChange={setNasaKey}
                            placeholder="Paste NASA FIRMS Token"
                        />
                    )}

                    {provider === 'OPENSKY' && (
                        <div style={{ 
                            padding: '40px 20px', 
                            background: COLOR.bg.base, 
                            border: BORDER.standard, 
                            borderRadius: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            textAlign: 'center'
                        }}>
                             <Globe size={32} color={COLOR.semantic.info} />
                             <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.primary, fontWeight: TYPE.weight.black }}>PUBLIC_DATA_ACTIVE</div>
                             <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, lineHeight: '1.5', fontWeight: TYPE.weight.bold }}>Using OpenSky community-sourced ADSB vectors.<br/>No further configuration is required.</div>
                        </div>
                    )}

                    {provider === 'RAPIDAPI' && (
                        <SecureInput 
                            label="RAPIDAPI KEY"
                            icon={<Key size={12} />}
                            value={rapidKey}
                            onChange={setRapidKey}
                            placeholder="Paste X-RapidAPI-Key"
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
                            background: isSaving ? COLOR.bg.elevated : COLOR.semantic.info, 
                            color: COLOR.text.inverse, 
                            border: 'none', 
                            fontWeight: TYPE.weight.black, 
                            fontSize: TYPE.size.xs,
                            cursor: 'pointer',
                            borderRadius: '2px',
                            transition: 'all 0.1s',
                            letterSpacing: TYPE.letterSpacing.caps
                        }}
                    >
                        {isSaving ? 'STORAGE_UPDATING...' : 'SAVE_CONFIGURATION'}
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
                                background: COLOR.text.primary, 
                                color: COLOR.bg.base, 
                                border: 'none', 
                                fontWeight: TYPE.weight.black, 
                                fontSize: TYPE.size.xs,
                                cursor: 'pointer',
                                borderRadius: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                letterSpacing: TYPE.letterSpacing.caps
                            }}
                        >
                            <LogIn size={16} /> INITIALIZE_SESSION
                        </button>
                    )}

                    <button 
                        onClick={onClose}
                        style={{ 
                            width: '100%', 
                            background: 'transparent', 
                            color: COLOR.text.muted, 
                            border: 'none', 
                            fontSize: TYPE.size.xs,
                            fontWeight: TYPE.weight.black,
                            cursor: 'pointer',
                            marginTop: SPACE[2],
                            letterSpacing: TYPE.letterSpacing.caps
                        }}
                    >
                        CANCEL_PROCEDURE
                    </button>
                </div>
            </div>
        </div>
    );
};
