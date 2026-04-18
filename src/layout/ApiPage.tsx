import React from 'react';
import { Zap } from 'lucide-react';
import { ApiDashboard } from './ApiDashboard';
import { MetricWrapper, PageShell, StatusWrapper, Text, TYPE, COLOR } from '../ds';

interface ApiPageProps {
  integrated?: boolean;
}

export const ApiPage: React.FC<ApiPageProps> = ({ integrated = false }) => {
  return (
    <PageShell
      title="Connectivity Dashboard"
      subtitle="Broker, feed, and protocol authorization surfaces"
      icon={<Zap size={12} />}
      tone="accent"
      fullViewport={!integrated}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StatusWrapper label="System ready v3" tone="accent" />
          <MetricWrapper label="Version" value="v4.6.2 stable" />
        </div>
      }
      footer={
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>Endpoint: https://api.upstox.com/v2</span>
            <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>Socket: wss://smartapi.upstox.com</span>
          </div>
          <StatusWrapper label="Data integrity verified" tone="up" />
        </div>
      }
      style={{ overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Text size="xs" color="muted" weight="bold">
          Utility surface
        </Text>
        <StatusWrapper label={integrated ? 'Integrated in workspace' : 'Standalone utility route'} tone="accent" />
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ApiDashboard />
      </div>
    </PageShell>
  );
};
