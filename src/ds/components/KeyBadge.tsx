import React from 'react';
import { BORDER, COLOR, SPACE, TYPE } from '../tokens';
import { humanizeLabel } from '../textFormat';

interface KeyBadgeProps {
  keys: string;
  style?: React.CSSProperties;
}

export const KeyBadge: React.FC<KeyBadgeProps> = ({ keys, style }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '1.25rem',
      padding: `${SPACE[0.5]} ${SPACE[2]}`,
      border: BORDER.standard,
      background: COLOR.bg.elevated,
      color: COLOR.text.muted,
      fontFamily: TYPE.family.mono,
      fontSize: TYPE.size.xs,
      fontWeight: TYPE.weight.bold,
      letterSpacing: TYPE.letterSpacing.caps,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {humanizeLabel(keys)}
  </span>
);
