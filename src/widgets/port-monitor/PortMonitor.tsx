import React, { useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Ship, Map as MapIcon, Table } from 'lucide-react';
import { useNSEData } from '../../hooks/useNSEData';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { SegmentedControl } from '../../ds/components/SegmentedControl';
import { DataTable } from '../../ds/components/DataTable';
import { EmptyState } from '../../ds/components/EmptyState';

interface PortData {
  name: string;
  lat: number;
  lon: number;
  vessels: number;
  type: string;
  stocks: string[];
  activityChangePct: number;
  proxyReturnPct: number;
  correlationRank: string;
  trend: { day: number; count: number }[];
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePorts = (payload: any): PortData[] => {
  const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return raw.map((item: any) => ({
    name: String(item.name || item.port || '').toUpperCase(),
    lat: toNumber(item.lat),
    lon: toNumber(item.lon),
    vessels: toNumber(item.vessels),
    type: String(item.type || 'UNKNOWN'),
    stocks: Array.isArray(item.stocks) ? item.stocks.map((s: any) => String(s).toUpperCase()) : [],
    activityChangePct: toNumber(item.activityChangePct),
    proxyReturnPct: toNumber(item.proxyReturnPct),
    correlationRank: String(item.correlationRank || 'N/A').toUpperCase(),
    trend: Array.isArray(item.trend)
      ? item.trend.map((t: any, idx: number) => ({ day: toNumber(t.day ?? idx), count: toNumber(t.count) }))
      : [],
  })).filter((item: PortData) => item.name.length > 0);
};

const PortMonitor: React.FC = () => {
  const { data } = useNSEData<any>('/api/port-activity', { pollingInterval: 5 * 60 * 1000 });
  const ports = useMemo(() => parsePorts(data), [data]);

  const [selectedPort, setSelectedPort] = useState<PortData | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('table');

  const columns = [
    { 
        key: 'name', 
        label: 'PRIMARY_PORT', 
        render: (val: string, item: any) => (
            <div>
                <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{val.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase' }}>{item.type}</div>
            </div>
        )
    },
    { 
        key: 'activityChangePct', 
        label: 'ACTIVITY_7D_CHG', 
        align: 'right' as const,
        render: (val: number) => (
            <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: val >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                {val >= 0 ? '+' : ''}{val.toFixed(2)}%
            </div>
        )
    },
    { 
        key: 'proxyReturnPct', 
        label: 'PROXY_RETURN', 
        align: 'right' as const,
        render: (val: number) => (
            <span style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: val >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                {val >= 0 ? '+' : ''}{val.toFixed(2)}%
            </span>
        )
    },
    { 
        key: 'correlationRank', 
        label: 'CORRELATION_RANK', 
        align: 'right' as const,
        render: (val: string) => (
            <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, border: `1px solid ${COLOR.bg.border}`, padding: '2px 6px', textTransform: 'uppercase' }}>
                {val}
            </span>
        )
    }
  ];

  return (
    <WidgetShell>
      <WidgetShell.Toolbar>
        <SegmentedControl 
            options={[
                { label: 'MAP_VISUAL', value: 'map', icon: <MapIcon size={10} /> },
                { label: 'CORRELATION_MATRIX', value: 'table', icon: <Table size={10} /> }
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as any)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
          <Ship size={12} style={{ color: COLOR.semantic.info }} />
          <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase' }}>LIVE_FEED_ONLY</span>
        </div>
      </WidgetShell.Toolbar>

      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        {selectedPort && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 100, width: '240px', background: COLOR.bg.surface, border: BORDER.standard, padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{selectedPort.name}</div>
                <div style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', marginTop: '2px' }}>{selectedPort.type}</div>
              </div>
              <button onClick={() => setSelectedPort(null)} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer', fontSize: '14px' }}>×</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', display: 'block' }}>VESSEL_COUNT</span>
                <span style={{ fontSize: '18px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary, fontVariantNumeric: 'tabular-nums' }}>{selectedPort.vessels}</span>
              </div>
              <div style={{ height: '32px', width: '80px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={selectedPort.trend}>
                    <Area type="monotone" dataKey="count" stroke={COLOR.semantic.info} strokeWidth={1} fill={`${COLOR.semantic.info}10`} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', marginBottom: '4px' }}>CORRELATED_EQUITIES</span>
              {selectedPort.stocks.length === 0 ? (
                <div style={{ fontSize: '9px', color: COLOR.text.muted }}>NO CORRELATED DATA</div>
              ) : (
                selectedPort.stocks.map((stock) => (
                  <div key={stock} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: COLOR.bg.elevated, border: BORDER.standard, alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{stock}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {viewMode === 'map' ? (
          <EmptyState 
            icon={<MapIcon size={32} />} 
            message="MAP_ENGINE_OFFLINE" 
            subMessage="Geospatial visualization requires active GPS feed and mapping tile server connection."
          />
        ) : (
          ports.length === 0 ? (
            <EmptyState 
                icon={<Table size={32} />} 
                message="NO PORT MONITOR DATA" 
                subMessage="Waiting for global port activity data stream synchronization."
            />
          ) : (
            <DataTable 
                data={ports}
                columns={columns}
                onRowClick={(item) => setSelectedPort(item)}
            />
          )
        )}
      </div>
    </WidgetShell>
  );
};

export default PortMonitor;

