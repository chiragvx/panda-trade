import React from 'react';
import { COLOR } from '../tokens';

type DotColor = 'up' | 'down' | 'warning' | 'info' | 'muted' | 'purple';

const COLOR_MAP: Record<DotColor, string> = {
  up:      COLOR.semantic.up,
  down:    COLOR.semantic.down,
  warning: COLOR.semantic.warning,
  info:    COLOR.semantic.info,
  muted:   COLOR.text.muted,
  purple:  COLOR.semantic.purple,
};

interface DotProps {
  color?:  DotColor;
  size?:   4 | 6 | 8 | 10;
  pulse?:  boolean;
  style?:  React.CSSProperties;
}

/**
 * Dot — a status indicator circle.
 * Replaces the inline `borderRadius: '50%'` pattern used in ~12 places.
 */
export const Dot: React.FC<DotProps> = ({
  color  = 'muted',
  size   = 6,
  pulse  = false,
  style,
}) => (
  <div
    style={{
      width:       `${size}px`,
      height:      `${size}px`,
      borderRadius: '50%',
      background:   COLOR_MAP[color],
      flexShrink:   0,
      animation:    pulse ? 'pulse 2s infinite' : undefined,
      ...style,
    }}
  />
);
