import React from 'react';
import { COLOR, TYPE } from '../tokens';

interface ChangeProps {
  value: number;
  showSign?: boolean;
  showArrow?: boolean;
  format?: 'absolute' | 'percent' | 'both';
  decimals?: number;
  size?: keyof typeof TYPE.size;
  weight?: keyof typeof TYPE.weight;
  className?: string;
}

export const Change: React.FC<ChangeProps> = ({
  value,
  showSign = true,
  showArrow = false,
  format = 'absolute',
  decimals = 2,
  size = 'md',
  weight = 'medium',
  className = '',
}) => {
  const isUp = value > 0;
  const isDown = value < 0;
  const color = isUp ? COLOR.semantic.up : isDown ? COLOR.semantic.down : COLOR.text.muted;
  const arrow = isUp ? '▲' : isDown ? '▼' : '';
  const sign = isUp && showSign ? '+' : '';
  const abs = Math.abs(value).toFixed(decimals);

  let display = '';
  if (format === 'absolute') display = `${sign}${isDown ? '-' : ''}${abs}`;
  if (format === 'percent') display = `${sign}${value.toFixed(decimals)}%`;
  if (format === 'both') display = `${sign}${Math.abs(value).toFixed(decimals)} (${sign}${Math.abs(value).toFixed(decimals)}%)`;

  return (
    <span
      className={className}
      style={{
        color,
        fontFamily: TYPE.family.mono,
        fontSize: TYPE.size[size],
        fontWeight: TYPE.weight[weight],
        letterSpacing: TYPE.letterSpacing.tight,
        whiteSpace: 'nowrap',
      }}
    >
      {showArrow && arrow && <span style={{ marginRight: '2px', fontSize: '8px' }}>{arrow}</span>}
      {display}
    </span>
  );
};
