import React from 'react';
import { BORDER, COLOR } from '../tokens';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  tone?: 'default' | 'strong' | 'accent';
  length?: string;
  style?: React.CSSProperties;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  tone = 'default',
  length,
  style,
}) => {
  const color =
    tone === 'accent'
      ? COLOR.semantic.info
      : tone === 'strong'
        ? COLOR.bg.subtle
        : COLOR.bg.border;

  return (
    <div
      style={{
        flexShrink: 0,
        background: color,
        width: orientation === 'vertical' ? BORDER.width : length || '100%',
        height: orientation === 'horizontal' ? BORDER.width : length || '100%',
        ...style,
      }}
    />
  );
};
