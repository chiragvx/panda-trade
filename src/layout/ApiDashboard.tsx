import React, { useMemo, useState } from 'react';
import { Activity, Anchor, Globe, Plane, Plus, RotateCcw, Search, Server, Settings2, Trash2, X, Zap } from 'lucide-react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  ActionWrapper,
  Button,
  COLOR,
  FieldWrapper,
  Input,
  MetricWrapper,
  ModalShell,
  OverlayShell,
  SectionHeader,
  Select,
  SPACE,
  StatusWrapper,
  Tag,
  Text,
  TYPE,
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONNECTED' | 'DISCONNECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BROKER' | 'DATA_FEED'>('ALL');
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
        id: 'aisstream-01',
        type: 'DATA_FEED',
        provider: 'AISSTREAM',
        displayName: 'AISStream Marine Protocol',
        description: 'Live global AIS vessel positions and maritime intelligence.',
        icon: <Anchor size={18} />,
        status: aisStreamApiKey ? 'connected' : 'disconnected',
        lastActivity: aisStreamApiKey ? 'Live Now' : 'Never',
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

  const filteredConnections = connections.filter((c) => {
    const matchesSearch = c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || c.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CONNECTED' && c.status === 'connected') ||
      (statusFilter === 'DISCONNECTED' && c.status === 'disconnected');
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const hasAnyConnection = connections.some((c) => c.status !== 'disconnected');
  const providerOptions = [
    { id: 'UPSTOX', title: 'Upstox Bridge', desc: 'Secure broker API for trade execution and live Nifty streams.', icon: <Zap size={18} /> },
    { id: 'AISSTREAM', title: 'AIS Marine Feed', desc: 'Real-time WebSocket feed for global maritime vessel tracking.', icon: <Anchor size={18} /> },
    { id: 'NASA', title: 'NASA FIRMS Sat', desc: 'Thermal anomaly satellite data for global fire monitoring.', icon: <Activity size={18} /> },
    { id: 'FLIGHTAWARE', title: 'FlightAware Radar', desc: 'High-fidelity flight tracking and airline intelligence.', icon: <Plane size={18} /> },
    { id: 'RAPIDAPI', title: 'RapidAPI Stream', desc: 'Global economic events and macro-calendar data stream.', icon: <Globe size={18} /> },
  ];

  return (
    <div style={{ height: '100%', width: '100%', background: COLOR.bg.base, display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
      <div
        style={{
          minHeight: '3.5rem',
          border: `1px solid ${COLOR.bg.border}`,
          background: COLOR.bg.surface,
          display: 'flex',
          alignItems: 'center',
          padding: SPACE[4],
          gap: SPACE[3],
          flexWrap: 'wrap',
        }}
      >
        <FieldWrapper prefix={<Search size={14} color={COLOR.text.muted} />} style={{ maxWidth: '20rem' }}>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search infrastructure..."
            inputSize="md"
            variant="ghost"
            style={{ border: 'none', height: '100%' }}
          />
        </FieldWrapper>

        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} selectSize="md" style={{ width: '9rem' }}>
          <option value="ALL">All statuses</option>
          <option value="CONNECTED">Connected</option>
          <option value="DISCONNECTED">Disconnected</option>
        </Select>

        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} selectSize="md" style={{ width: '9rem' }}>
          <option value="ALL">All types</option>
          <option value="BROKER">Broker</option>
          <option value="DATA_FEED">Data feed</option>
        </Select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
          <ActionWrapper
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setTypeFilter('ALL');
            }}
          >
            <RotateCcw size={14} />
          </ActionWrapper>
          <Button variant="accent" size="md" onClick={() => setActiveModal('SELECT')}>
            <Plus size={14} style={{ marginRight: '6px' }} />
            CONNECT_INFRASTRUCTURE
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: SPACE[3], flexWrap: 'wrap' }}>
        <MetricWrapper label="ACTIVE" value={String(filteredConnections.length)} />
        <MetricWrapper label="CONNECTED" value={String(filteredConnections.filter((c) => c.status === 'connected').length)} tone="accent" />
        <StatusWrapper label={hasAnyConnection ? 'INFRA_HEALTH_OPTIMAL' : 'NO_ACTIVE_LINKS'} tone={hasAnyConnection ? 'up' : 'warning'} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: SPACE[1] }} className="custom-scrollbar">
        {!hasAnyConnection && searchQuery === '' && statusFilter === 'ALL' && typeFilter === 'ALL' ? (
          <div
            style={{
              width: '100%',
              maxWidth: '50rem',
              margin: '4rem auto 0 auto',
              background: COLOR.bg.overlay,
              border: `1px solid ${COLOR.bg.border}`,
              minHeight: '15rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACE[5],
              textAlign: 'center',
              padding: SPACE[6],
            }}
          >
            <div style={{ opacity: 0.3 }}>
              <Server size={48} color={COLOR.text.muted} />
            </div>
            <div>
              <Text variant="heading" size="md">
                NO_ACTIVE_CONNECTIONS
              </Text>
              <div style={{ marginTop: SPACE[2] }}>
                <Text size="sm" color="secondary">
                  Authorize a protocol to integrate real-time market or alternative data feeds into the terminal.
                </Text>
              </div>
            </div>
            <Button variant="accent" onClick={() => setActiveModal('SELECT')}>
              INITIATE_HANDSHAKE
            </Button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '56rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
            <SectionHeader
              title={`${filteredConnections.length} ACTIVE CLOUD BACKENDS`}
              subtitle="Registry-driven protocol surfaces with shared shell and override rules."
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: SPACE[2] }}>
              {filteredConnections.map((conn) => (
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
            {activeModal === 'AISSTREAM' && <ApiConfigModal provider="AISSTREAM" onClose={() => setActiveModal(null)} />}
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
