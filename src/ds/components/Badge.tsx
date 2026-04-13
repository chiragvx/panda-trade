import React from 'react';
import { COLOR, TYPE } from '../tokens';

type BadgeVariant = 'exchange-nse' | 'exchange-bse' | 'status-live' | 'status-closed' | 
                    'status-pending' | 'status-executed' | 'status-cancelled' | 'default' |
                    'info' | 'muted' | 'up' | 'down' | 'warning' | 'purple';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  'exchange-nse':      { color: 'rgba(74,158,255,0.7)',  borderColor: 'rgba(74,158,255,0.3)' },
  'exchange-bse':      { color: 'rgba(245,166,35,0.7)',  borderColor: 'rgba(245,166,35,0.3)' },
  'status-live':       { color: COLOR.semantic.up,    borderColor: COLOR.semantic.up },
  'status-closed':     { color: COLOR.text.muted,     borderColor: COLOR.bg.border },
  'status-pending':    { color: COLOR.semantic.warning, borderColor: COLOR.semantic.warning },
  'status-executed':   { color: COLOR.semantic.up,    borderColor: COLOR.semantic.up },
  'status-cancelled':  { color: COLOR.text.muted,     borderColor: COLOR.text.muted },
  'default':           { color: COLOR.text.secondary,  borderColor: COLOR.bg.border },
  'info':              { color: COLOR.semantic.info,    borderColor: COLOR.semantic.info },
  'muted':             { color: COLOR.text.muted,       borderColor: COLOR.bg.border },
  'up':                { color: COLOR.semantic.up,      borderColor: COLOR.semantic.up },
  'down':              { color: COLOR.semantic.down,    borderColor: COLOR.semantic.down },
  'warning':           { color: COLOR.semantic.warning, borderColor: COLOR.semantic.warning },
  'purple':            { color: COLOR.semantic.purple,  borderColor: COLOR.semantic.purple },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    height: '14px',
    padding: '0 3px',
    border: `1px solid ${VARIANT_STYLES[variant].borderColor}`,
    borderRadius: '0',
    fontFamily: TYPE.family.mono,
    fontSize: TYPE.size.xs,
    fontWeight: TYPE.weight.medium,
    letterSpacing: TYPE.letterSpacing.wide,
    color: VARIANT_STYLES[variant].color,
    background: 'transparent',
    whiteSpace: 'nowrap',
    
    lineHeight: 1,
  }}>
    {label}
  </span>
);
