import React from 'react';
import { COLOR, TYPE } from '../tokens';

interface PriceProps {
  value: number;
  currency?: string;
  decimals?: number;
  size?: keyof typeof TYPE.size;
  weight?: keyof typeof TYPE.weight;
  color?: string;
  flash?: 'up' | 'down' | null;
}

export const Price: React.FC<PriceProps> = ({
  value,
  currency = '₹',
  decimals = 2,
  size = 'lg',
  weight = 'medium',
  color = COLOR.text.primary,
  flash,
}) => (
  <span
    style={{ fontFamily: TYPE.family.mono, whiteSpace: 'nowrap', letterSpacing: TYPE.letterSpacing.tight }}
    className={flash === 'up' ? 'price-flash-up' : flash === 'down' ? 'price-flash-down' : ''}
  >
    {currency && (
      <span style={{ color: COLOR.text.secondary, fontSize: TYPE.size.sm, fontWeight: TYPE.weight.regular }}>
        {currency}
      </span>
    )}
    <span style={{ color: color, fontSize: TYPE.size[size], fontWeight: TYPE.weight[weight] }}>
      {value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  </span>
);
