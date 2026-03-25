import React, { useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Ship, Map as MapIcon, Table } from 'lucide-react';
import { useNSEData } from '../../hooks/useNSEData';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';

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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, fontFamily: TYPE.family.mono }}>
      <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: COLOR.bg.elevated, border: BORDER.standard }}>
          <button
            onClick={() => setViewMode('map')}
            style={{
              padding: '4px 12px',
              fontSize: '9px',
              fontWeight: TYPE.weight.bold,
              background: viewMode === 'map' ? COLOR.interactive.selected : 'transparent',
              color: viewMode === 'map' ? COLOR.semantic.info : COLOR.text.muted,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <MapIcon size={10} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> MAP_VISUAL
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '4px 12px',
              fontSize: '9px',
              fontWeight: TYPE.weight.bold,
              background: viewMode === 'table' ? COLOR.interactive.selected : 'transparent',
              color: viewMode === 'table' ? COLOR.semantic.info : COLOR.text.muted,
              borderLeft: BORDER.standard,
              cursor: 'pointer',
            }}
          >
            <Table size={10} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> CORRELATION_MATRIX
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
          <Ship size={12} style={{ color: COLOR.semantic.info }} />
          <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase' }}>LIVE_FEED_ONLY</span>
        </div>
      </div>

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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.bg.base, color: COLOR.text.muted, fontSize: '9px', fontWeight: TYPE.weight.bold, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>
            MAP_ENGINE_OFFLINE
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: COLOR.bg.surface, borderBottom: BORDER.standard }}>
                  <th style={{ padding: '8px 12px', fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase' }}>PRIMARY_PORT</th>
                  <th style={{ padding: '8px 12px', fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', textAlign: 'right' }}>ACTIVITY_7D_CHG</th>
                  <th style={{ padding: '8px 12px', fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', textAlign: 'right' }}>PROXY_RETURN</th>
                  <th style={{ padding: '8px 12px', fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', textAlign: 'right' }}>CORRELATION_RANK</th>
                </tr>
              </thead>
              <tbody>
                {ports.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: COLOR.text.muted, fontSize: '10px' }}>
                      NO PORT MONITOR DATA
                    </td>
                  </tr>
                ) : (
                  ports.map((port, i) => (
                    <tr key={i} style={{ borderBottom: BORDER.standard, cursor: 'pointer' }} className="hover:bg-interactive-hover transition-colors" onClick={() => setSelectedPort(port)}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>{port.name.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase' }}>{port.type}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: port.activityChangePct >= 0 ? COLOR.semantic.up : COLOR.semantic.down, fontVariantNumeric: 'tabular-nums' }}>
                          {port.activityChangePct >= 0 ? '+' : ''}{port.activityChangePct.toFixed(2)}%
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', fontWeight: TYPE.weight.bold, color: port.proxyReturnPct >= 0 ? COLOR.semantic.up : COLOR.semantic.down, fontVariantNumeric: 'tabular-nums' }}>
                          {port.proxyReturnPct >= 0 ? '+' : ''}{port.proxyReturnPct.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <span style={{ fontSize: '8px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, border: `1px solid ${COLOR.bg.border}`, padding: '2px 6px', textTransform: 'uppercase' }}>
                          {port.correlationRank}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortMonitor;
