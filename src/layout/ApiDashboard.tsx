import React, { useMemo, useState } from 'react';
import { Activity, Globe, Plane, Plus, Server, Settings2, Trash2, X, Zap } from 'lucide-react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  ActionWrapper,
  BrandLockup,
  Button,
  COLOR,
  EmptyState,
  MetricWrapper,
  ModalShell,
  OverlayShell,
  SectionHeader,
  SPACE,
  StatusWrapper,
  Tag,
  Text,
  Toolbar,
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
  const { status: upstoxStatus, apiKey: upstoxKey } = useUpstoxStore();
  const {
    aisStreamApiKey,
    nasaApiKey,
    rapidApiKey,
    flightAwareApiKey,
    setAisStreamApiKey,
    setRapidApiKey,
    setFlightAwareApiKey,
    enabledConnections,
    removeConnection,
  } = useSettingsStore();

  const [activeModal, setActiveModal] = useState<'UPSTOX' | 'AISSTREAM' | 'NASA' | 'FLIGHTAWARE' | 'RAPIDAPI' | 'SELECT' | null>(null);

  const masterConnections: ConnectionMeta[] = useMemo(
    () => [
      {
        id: 'upstox-01',
        type: 'BROKER',
        provider: 'UPSTOX',
        displayName: 'Upstox Terminal Bridge',
        description: 'Primary trade execution and Nifty market data stream.',
        icon: <Zap size={18} />,
        status: upstoxStatus === 'connected' ? 'connected' : upstoxKey ? 'pending' : 'disconnected',
        lastActivity: upstoxStatus === 'connected' ? 'Live Now' : '2h ago',
      },
      {
        id: 'nasa-01',
        type: 'DATA_FEED',
        provider: 'NASA',
        displayName: 'NASA FIRMS Protocol',
        description: 'Global live thermal anomaly and fire scanner via VIIRS S-NPP.',
        icon: <Activity size={18} />,
        status: nasaApiKey ? 'connected' : 'disconnected',
        lastActivity: nasaApiKey ? 'Live Now' : 'Never',
      },
      {
        id: 'flightaware-01',
        type: 'DATA_FEED',
        provider: 'FLIGHTAWARE',
        displayName: 'FlightAware AeroAPI',
        description: 'Professional grade global flight radar and airline intelligence.',
        icon: <Plane size={18} />,
        status: flightAwareApiKey ? 'connected' : 'disconnected',
        lastActivity: flightAwareApiKey ? 'Live Now' : 'Never',
      },
      {
        id: 'rapidapi-01',
        type: 'DATA_FEED',
        provider: 'RAPIDAPI',
        displayName: 'RapidAPI Economic Intel',
        description: 'Live global economic calendar and macro-event data stream.',
        icon: <Globe size={18} />,
        status: rapidApiKey ? 'connected' : 'disconnected',
        lastActivity: rapidApiKey ? 'Live Now' : 'Never',
      },
    ],
    [upstoxStatus, upstoxKey, aisStreamApiKey, nasaApiKey, flightAwareApiKey, rapidApiKey]
  );

  const connections = useMemo(() => masterConnections.filter((c) => enabledConnections.includes(c.id)), [masterConnections, enabledConnections]);

  const handleDelete = (id: string, provider: string) => {
    if (provider === 'UPSTOX') return;

    removeConnection(id);
    if (provider === 'AISSTREAM') {
      setAisStreamApiKey('');
    } else if (provider === 'NASA') {
      useSettingsStore.getState().setNasaApiKey('');
    } else if (provider === 'FLIGHTAWARE') {
      setFlightAwareApiKey('');
    } else if (provider === 'RAPIDAPI') {
      setRapidApiKey('');
    }
  };

  const hasAnyConnection = connections.some((c) => c.status !== 'disconnected');
  const providerOptions = [
    { id: 'UPSTOX', title: 'Upstox Bridge', desc: 'Secure broker API for trade execution and live Nifty streams.', icon: <Zap size={18} /> },
    { id: 'NASA', title: 'NASA FIRMS Sat', desc: 'Thermal anomaly satellite data for global fire monitoring.', icon: <Activity size={18} /> },
    { id: 'FLIGHTAWARE', title: 'FlightAware Radar', desc: 'High-fidelity flight tracking and airline intelligence.', icon: <Plane size={18} /> },
    { id: 'RAPIDAPI', title: 'RapidAPI Stream', desc: 'Global economic events and macro-calendar data stream.', icon: <Globe size={18} /> },
  ];

  return (
    <div style={{ height: '100%', width: '100%', background: COLOR.bg.base, display: 'flex', flexDirection: 'column' }}>
      <Toolbar style={{ padding: SPACE[6], height: 'auto', minHeight: 'auto' }}>
        <Toolbar.Left>
          <BrandLockup
            icon={<Server size={14} />}
            title="INFRASTRUCTURE"
            subtitle="Cloud backends & data protocols"
          />
        </Toolbar.Left>
        <Toolbar.Right>
          <MetricWrapper label="ACTIVE" value={String(connections.length)} bare />
          <MetricWrapper label="CONNECTED" value={String(connections.filter((c) => c.status === 'connected').length)} tone="accent" bare />
          <StatusWrapper label={hasAnyConnection ? 'INFRA_HEALTH_OPTIMAL' : 'NO_ACTIVE_LINKS'} tone={hasAnyConnection ? 'up' : 'warning'} bare />
          <Button variant="accent" size="sm" onClick={() => setActiveModal('SELECT')}>
            <Plus size={12} style={{ marginRight: '6px' }} />
            CONNECT
          </Button>
        </Toolbar.Right>
      </Toolbar>

      <div style={{ flex: 1, overflowY: 'auto', padding: SPACE[4] }} className="custom-scrollbar">
        {connections.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <EmptyState
              icon={<Server size={48} />}
              message="NO_ACTIVE_CONNECTIONS"
              subMessage="Authorize a protocol to integrate real-time market or alternative data feeds into the terminal."
            />
            <Button variant="accent" onClick={() => setActiveModal('SELECT')}>
              INITIATE_HANDSHAKE
            </Button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
            <SectionHeader
              title={`${connections.length} ACTIVE CLOUD BACKENDS`}
              subtitle="Registry-driven protocol surfaces with shared shell and override rules."
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: SPACE[2] }}>
              {connections.map((conn) => (
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

      {activeModal && (
        <OverlayShell onClick={() => setActiveModal(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            {activeModal === 'SELECT' && (
              <ModalShell
                title="SELECT_INFRASTRUCTURE"
                subtitle="Choose a verified gateway to authorize with the terminal ecosystem."
                icon={<Server size={12} />}
                width="52.5rem"
                height="33.75rem"
                footer={
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="xs" color="muted">
                      ST_INFRA_ENGINE_V4.6
                    </Text>
                    <Button variant="ghost" onClick={() => setActiveModal(null)}>
                      CLOSE
                    </Button>
                  </div>
                }
                actions={
                  <ActionWrapper onClick={() => setActiveModal(null)}>
                    <X size={14} />
                  </ActionWrapper>
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 18rem) minmax(0, 1fr)', height: '100%' }}>
                  <div style={{ borderRight: `1px solid ${COLOR.bg.border}`, paddingRight: SPACE[4], display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
                    <SectionHeader title="CLOUD PROTOCOLS" subtitle="Shared wrappers control shell density, identity, and action affordances." />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
                      <MetricWrapper label="SUPPORTED" value={String(providerOptions.length)} tone="accent" />
                      <StatusWrapper label="TERMINAL_STYLE_LOCKED" tone="up" />
                    </div>
                  </div>
                  <div style={{ paddingLeft: SPACE[4], display: 'flex', flexDirection: 'column', gap: SPACE[2], overflowY: 'auto' }} className="custom-scrollbar">
                    {providerOptions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveModal(p.id as any)}
                        style={{
                          background: COLOR.bg.surface,
                          border: `1px solid ${COLOR.bg.border}`,
                          padding: `${SPACE[3]} ${SPACE[4]}`,
                          cursor: 'pointer',
                          transition: 'background 80ms linear, border-color 80ms linear',
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACE[3],
                          textAlign: 'left',
                          color: COLOR.text.primary,
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = COLOR.semantic.info;
                          e.currentTarget.style.background = COLOR.interactive.selected;
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = COLOR.bg.border;
                          e.currentTarget.style.background = COLOR.bg.surface;
                        }}
                      >
                        <div style={{ width: '2rem', height: '2rem', border: `1px solid ${COLOR.bg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLOR.semantic.info }}>
                          {p.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text weight="bold" color="primary">
                            {p.title}
                          </Text>
                          <div style={{ marginTop: '2px' }}>
                            <Text size="xs" color="muted">
                              {p.desc}
                            </Text>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </ModalShell>
            )}
            {activeModal === 'UPSTOX' && <ApiConfigModal provider="UPSTOX" onClose={() => setActiveModal(null)} />}
            {activeModal === 'NASA' && <ApiConfigModal provider="NASA" onClose={() => setActiveModal(null)} />}
            {activeModal === 'FLIGHTAWARE' && <ApiConfigModal provider="FLIGHTAWARE" onClose={() => setActiveModal(null)} />}
            {activeModal === 'RAPIDAPI' && <ApiConfigModal provider="RAPIDAPI" onClose={() => setActiveModal(null)} />}
          </div>
        </OverlayShell>
      )}
    </div>
  );
};

const ConnectionCard: React.FC<{
  conn: ConnectionMeta;
  onConfig: () => void;
  onDelete: () => void;
}> = ({ conn, onConfig, onDelete }) => {
  const tagVariant = conn.status === 'connected' ? 'up' : conn.status === 'pending' ? 'warning' : 'muted';

  return (
    <div
      style={{
        background: COLOR.bg.overlay,
        border: `1px solid ${COLOR.bg.border}`,
        padding: `${SPACE[3]} ${SPACE[4]}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACE[4],
      }}
    >
      <div
        style={{
          width: '2.5rem',
          height: '2.5rem',
          background: COLOR.bg.base,
          border: `1px solid ${COLOR.bg.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: conn.status === 'connected' ? COLOR.semantic.info : COLOR.text.muted,
          flexShrink: 0,
        }}
      >
        {conn.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[1], flexWrap: 'wrap' }}>
          <Text weight="bold" color="primary">
            {conn.displayName}
          </Text>
          <Tag label={conn.status} variant={tagVariant} />
        </div>
        <Text size="xs" color="muted">
          {conn.description}
        </Text>
      </div>

      <div style={{ width: '8rem', textAlign: 'right', flexShrink: 0 }}>
        <Text variant="label">LAST_ACTIVITY</Text>
        <div style={{ marginTop: '2px' }}>
          <Text size="xs" color="secondary">
            {conn.lastActivity}
          </Text>
        </div>
      </div>

      <div style={{ display: 'flex', gap: SPACE[2], borderLeft: `1px solid ${COLOR.bg.border}`, paddingLeft: SPACE[4], marginLeft: SPACE[2] }}>
        <ActionWrapper onClick={onConfig}>
          <Settings2 size={14} />
        </ActionWrapper>
        {conn.provider !== 'UPSTOX' && (
          <ActionWrapper
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${conn.displayName}?`)) {
                onDelete();
              }
            }}
            tone="accent"
          >
            <Trash2 size={14} />
          </ActionWrapper>
        )}
      </div>
    </div>
  );
};
