import React from 'react';
import UpstoxConnect from '../widgets/upstox/UpstoxConnect';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { COLOR, BORDER, TYPE } from '../ds/tokens';
import { ShieldCheck, Zap } from 'lucide-react';

export const ApiDashboard: React.FC = () => {
  const { status } = useUpstoxStore();
  return (
    <div style={{ 
      height: '100%', width: '100%', background: COLOR.bg.base,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '600px', background: COLOR.bg.surface,
        border: BORDER.standard, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: BORDER.standard, paddingBottom: '16px' }}>
          <Zap size={24} color={COLOR.semantic.info} />
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '0.05em' }}>BROKER_CONNECTIVITY_API</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ color: COLOR.text.secondary, fontSize: '13px', lineHeight: 1.6 }}>
            Connect your primary execution engine to the Upstox API. This enables live order placement, 
            real-time portfolio tracking, and high-frequency data streams.
          </p>
          <div style={{ 
            background: 'rgba(74, 158, 255, 0.05)', border: `1px solid ${COLOR.semantic.info}33`,
            padding: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <ShieldCheck size={16} color={COLOR.semantic.info} />
            <span style={{ fontSize: '11px', color: COLOR.semantic.info, fontWeight: 'bold' }}>SECURE_OAUTH_FLOW_ENABLED</span>
          </div>
        </div>

        <div style={{ border: BORDER.standard, padding: '20px', background: COLOR.bg.elevated }}>
          <UpstoxConnect />
        </div>

        <div style={{ marginTop: '12px', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
             <span style={{ display: 'block', fontSize: '10px', color: COLOR.text.muted, fontWeight: 'bold' }}>LATENCY</span>
             <span style={{ fontSize: '13px', color: COLOR.text.primary, fontWeight: '900' }}>0ms</span>
          </div>
          <div style={{ flex: 1 }}>
             <span style={{ display: 'block', fontSize: '10px', color: COLOR.text.muted, fontWeight: 'bold' }}>UPTIME</span>
             <span style={{ fontSize: '13px', color: COLOR.text.primary, fontWeight: '900' }}>0%</span>
          </div>
          <div style={{ flex: 1 }}>
             <span style={{ display: 'block', fontSize: '10px', color: COLOR.text.muted, fontWeight: 'bold' }}>STATUS</span>
             <span style={{ fontSize: '13px', color: status === 'connected' ? COLOR.semantic.up : COLOR.text.primary, fontWeight: '900' }}>
               {status.toUpperCase()}
             </span>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '24px', color: COLOR.text.muted, fontSize: '10px', fontFamily: TYPE.family.mono }}>
        SYSTEM_VERSION_4.0.12 // PROTOCOL_SECURE
      </div>
    </div>
  );
};
