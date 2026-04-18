import React, { useState } from 'react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Activity, Anchor, ExternalLink, Eye, EyeOff, Globe, Key, Lock, LogIn, Plane, X, Zap } from 'lucide-react';
import {
  ActionWrapper,
  Button,
  COLOR,
  FieldWrapper,
  FormField,
  ModalShell,
  SectionHeader,
  SPACE,
  StatusWrapper,
  Text,
  TYPE,
} from '../ds';

interface ApiConfigModalProps {
  provider: 'UPSTOX' | 'AISSTREAM' | 'NASA' | 'FLIGHTAWARE' | 'RAPIDAPI';
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

  return (
    <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{icon} {label}</span>}>
      <FieldWrapper
        suffix={
          <button
            onClick={() => setVisible(!visible)}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: COLOR.text.muted,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
      >
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: '2.25rem',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: COLOR.text.primary,
            fontFamily: TYPE.family.mono,
            fontSize: TYPE.size.xs,
            padding: `0 ${SPACE[3]}`,
          }}
        />
      </FieldWrapper>
    </FormField>
  );
};

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ provider, onClose }) => {
  const upstox = useUpstoxStore();
  const [upstoxKey, setUpstoxKey] = useState(upstox.apiKey);
  const [upstoxSecret, setUpstoxSecret] = useState(upstox.apiSecret);
  const [redirectUrl] = useState(`${window.location.origin}/callback`);

  const settings = useSettingsStore();
  const [aisKey, setAisKey] = useState(settings.aisStreamApiKey);
  const [nasaKey, setNasaKey] = useState(settings.nasaApiKey);
  const [rapidKey, setRapidKey] = useState(settings.rapidApiKey);
  const [flightAwareKey, setFlightAwareKey] = useState(settings.flightAwareApiKey);

  const [isSaving, setIsSaving] = useState(false);

  const providers = {
    UPSTOX: {
      title: 'Upstox Terminal Bridge',
      icon: <Zap size={18} />,
      image: '/upstox_api_guide.png',
      guide: 'Create a Trading API app in the Upstox Developer Portal and register the redirect URI used by this terminal.',
      link: 'https://account.upstox.com/developer/apps',
      handleSave: () => {
        upstox.setCredentials(upstoxKey, upstoxSecret);
      },
    },
    AISSTREAM: {
      title: 'AISStream Marine Protocol',
      icon: <Anchor size={18} />,
      image: '/aisstream_api_guide.png',
      guide: 'Register for a free API key at AISStream.io to enable live global vessel tracking and maritime intelligence.',
      link: 'https://aisstream.io/authenticate',
      handleSave: () => {
        settings.setAisStreamApiKey(aisKey);
        settings.addConnection('aisstream-01');
      },
    },
    NASA: {
      title: 'NASA FIRMS Protocol',
      icon: <Activity size={18} />,
      image: '/nasa_firms_api_guide.png',
      guide: 'Obtain a NASA FIRMS or Earthdata API key to enable live thermal anomaly monitoring.',
      link: 'https://firms.modaps.eosdis.nasa.gov/api/data_availability/',
      handleSave: () => {
        settings.setNasaApiKey(nasaKey);
        settings.addConnection('nasa-01');
      },
    },
    RAPIDAPI: {
      title: 'RapidAPI Economic Intel',
      icon: <Globe size={18} />,
      image: '/rapidapi_guide.png',
      guide: 'Secure a RapidAPI application key to enable live economic calendar and macro-event synchronization.',
      link: 'https://rapidapi.com/toplistaai/api/ultimate-economic-calendar',
      handleSave: () => {
        settings.setRapidApiKey(rapidKey);
        settings.addConnection('rapidapi-01');
      },
    },
    FLIGHTAWARE: {
      title: 'FlightAware AeroAPI',
      icon: <Plane size={18} />,
      image: '/flightaware_guide.png',
      guide: 'Access professional-grade global flight tracking with a personal AeroAPI x-apikey from the FlightAware portal.',
      link: 'https://flightaware.com/commercial/aeroapi/portal',
      handleSave: () => {
        settings.setFlightAwareApiKey(flightAwareKey);
        settings.addConnection('flightaware-01');
      },
    },
  };

  const config = providers[provider];

  const startUpstoxLogin = () => {
    if (!upstoxKey) return;
    const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${upstoxKey}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  const onSave = () => {
    setIsSaving(true);
    config.handleSave();
    setTimeout(() => {
      setIsSaving(false);
      if (provider !== 'UPSTOX') onClose();
    }, 800);
  };

  const onLogin = () => {
    if (!upstoxKey || !upstoxSecret) return;
    setIsSaving(true);
    config.handleSave();
    setTimeout(() => {
      setIsSaving(false);
      startUpstoxLogin();
    }, 250);
  };

  return (
    <ModalShell
      title={config.title}
      subtitle="Terminal utility surface"
      icon={config.icon}
      width="50rem"
      height="31.25rem"
      headerStyle={{
        minHeight: '4rem',
        height: '4rem',
        padding: `${SPACE[3]} ${SPACE[4]}`,
      }}
      actions={
        <ActionWrapper onClick={onClose}>
          <X size={14} />
        </ActionWrapper>
      }
      footer={
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3] }}>
          <StatusWrapper label={isSaving ? 'STORAGE_UPDATING' : 'READY'} tone={isSaving ? 'warning' : 'up'} />
          <div style={{ display: 'flex', gap: SPACE[2], marginLeft: 'auto' }}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {provider === 'UPSTOX' ? (
              <Button
                variant="accent"
                onClick={onLogin}
                disabled={isSaving || !upstoxKey || !upstoxSecret}
              >
                <LogIn size={14} style={{ marginRight: '6px' }} />
                {isSaving ? 'Logging in...' : 'Login'}
              </Button>
            ) : (
              <Button variant="accent" onClick={onSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save configuration'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: SPACE[4], height: '100%' }}>
        <div style={{ borderRight: `1px solid ${COLOR.bg.border}`, paddingRight: SPACE[4], display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
          <div style={{ flex: 1, border: `1px solid ${COLOR.bg.border}`, background: COLOR.bg.base, position: 'relative', overflow: 'hidden' }}>
            <img
              src={config.image}
              alt="API Guide"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.42 }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 'auto 0 0 0',
                padding: SPACE[4],
                background: 'rgba(5,5,5,0.9)',
                borderTop: `1px solid ${COLOR.bg.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACE[2],
              }}
            >
              <StatusWrapper label="PROVIDER_GUIDE" tone="accent" />
              <Text weight="bold" color="primary">
                {config.title}
              </Text>
            </div>
          </div>

          <SectionHeader title="SETUP NOTES" subtitle={config.guide} />
          <a
            href={config.link}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: TYPE.size.xs,
              color: COLOR.semantic.info,
              textDecoration: 'none',
              fontWeight: TYPE.weight.bold,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: TYPE.letterSpacing.caps,
            }}
          >
            Get API key from source <ExternalLink size={12} />
          </a>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], overflowY: 'auto' }} className="custom-scrollbar">
          <SectionHeader title="CONFIGURATION" subtitle="All fields inherit flat shells, fixed scale, and wrapper-driven adornments." />

          {provider === 'UPSTOX' && (
            <>
              <SecureInput label="API key (Client ID)" icon={<Key size={12} />} value={upstoxKey} onChange={setUpstoxKey} placeholder="Enter Upstox API key" />
              <SecureInput label="API secret" icon={<Lock size={12} />} value={upstoxSecret} onChange={setUpstoxSecret} placeholder="••••••••••••••••" />
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Globe size={12} /> Redirect URI</span>}>
                <FieldWrapper>
                  <input
                    value={redirectUrl}
                    readOnly
                    style={{
                      width: '100%',
                      height: '2.25rem',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: COLOR.text.muted,
                      fontFamily: TYPE.family.mono,
                      fontSize: TYPE.size.xs,
                      padding: `0 ${SPACE[3]}`,
                    }}
                  />
                </FieldWrapper>
              </FormField>
            </>
          )}

          {provider === 'AISSTREAM' && (
            <SecureInput label="AISStream API key" icon={<Key size={12} />} value={aisKey} onChange={setAisKey} placeholder="Paste AISStream token" />
          )}

          {provider === 'NASA' && (
            <SecureInput label="NASA FIRMS API key" icon={<Key size={12} />} value={nasaKey} onChange={setNasaKey} placeholder="Paste NASA FIRMS token" />
          )}

          {provider === 'FLIGHTAWARE' && (
            <SecureInput label="FlightAware X-ApiKey" icon={<Key size={12} />} value={flightAwareKey} onChange={setFlightAwareKey} placeholder="Enter AeroAPI key" />
          )}

          {provider === 'RAPIDAPI' && (
            <SecureInput label="RapidAPI key" icon={<Key size={12} />} value={rapidKey} onChange={setRapidKey} placeholder="Paste X-RapidAPI-Key" />
          )}
        </div>
      </div>
    </ModalShell>
  );
};
