import React from 'react';
import { COLOR, TYPE, ROW_HEIGHT } from '../tokens';

interface ButtonProps {
  variant?: 'ghost' | 'filled' | 'buy' | 'sell' | 'danger';
  size?: 'xs' | 'sm' | 'md';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  title?: string;
}

const SIZE_STYLES = {
  xs: { height: '18px', padding: '0 6px',  fontSize: TYPE.size.xs },
  sm: { height: '22px', padding: '0 8px',  fontSize: TYPE.size.sm },
  md: { height: '28px', padding: '0 12px', fontSize: TYPE.size.md },
};

const BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0',
  fontFamily: TYPE.family.mono,
  fontWeight: TYPE.weight.medium,
  letterSpacing: TYPE.letterSpacing.wide,
  textTransform: 'uppercase',
  cursor: 'pointer',
  border: 'none',
  outline: 'none',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'ghost',
  size = 'sm',
  disabled,
  onClick,
  children,
  title,
}) => {
  const [hovered, setHovered] = React.useState(false);

  const variantStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'ghost':
        return {
          background: 'transparent',
          border: `1px solid ${hovered ? COLOR.text.secondary : COLOR.bg.border}`,
          color: hovered ? COLOR.text.primary : COLOR.text.secondary,
        };
      case 'filled':
        return {
          background: hovered ? COLOR.interactive.hover : COLOR.bg.overlay,
          border: `1px solid ${COLOR.bg.border}`,
          color: COLOR.text.primary,
        };
      case 'buy':
        return {
          background: hovered ? COLOR.semantic.up : 'transparent',
          border: `1px solid ${COLOR.semantic.up}`,
          color: hovered ? COLOR.text.inverse : COLOR.semantic.up,
        };
      case 'sell':
        return {
          background: hovered ? COLOR.semantic.down : 'transparent',
          border: `1px solid ${COLOR.semantic.down}`,
          color: hovered ? COLOR.text.inverse : COLOR.semantic.down,
        };
      case 'danger':
        return {
          background: hovered ? 'rgba(255,59,87,0.15)' : 'transparent',
          border: `1px solid ${COLOR.semantic.down}`,
          color: COLOR.semantic.down,
        };
      default:
        return {};
    }
  };

  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...BASE,
        ...SIZE_STYLES[size],
        ...variantStyle(),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 80ms linear, color 80ms linear, border-color 80ms linear',
      }}
    >
      {children}
    </button>
  );
};
