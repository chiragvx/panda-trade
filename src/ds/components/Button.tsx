import React from 'react';
import { Loader2 } from 'lucide-react';
import { COLOR, MOTION, SIZE, SPACE, TYPE } from '../tokens';
import { humanizeLabel } from '../textFormat';

interface ButtonProps {
  variant?: 'ghost' | 'filled' | 'accent' | 'buy' | 'sell' | 'danger' | 'primary' | 'secondary' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
}

const SIZE_STYLES = {
  xs: { height: '1.75rem', padding: `0 ${SPACE[3]}`, fontSize: TYPE.size.xs },
  sm: { height: '2rem', padding: `0 ${SPACE[3]}`, fontSize: TYPE.size.sm },
  md: { height: '2.25rem', padding: `0 ${SPACE[4]}`, fontSize: TYPE.size.md },
};

const BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0',
  fontFamily: TYPE.family.mono,
  fontWeight: TYPE.weight.bold,
  letterSpacing: TYPE.letterSpacing.wide,
  cursor: 'pointer',
  border: `1px solid ${COLOR.bg.border}`,
  outline: 'none',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  boxSizing: 'border-box',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'ghost',
  size = 'sm',
  disabled,
  onClick,
  children,
  title,
  style,
  className,
  loading,
}) => {
  const [hovered, setHovered] = React.useState(false);
  const renderedChildren = typeof children === 'string' ? humanizeLabel(children) : children;

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
      case 'accent':
        return {
          background: hovered ? COLOR.interactive.active : COLOR.semantic.info,
          border: `1px solid ${COLOR.semantic.info}`,
          color: hovered ? COLOR.text.primary : COLOR.text.inverse,
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
          background: hovered ? `${COLOR.semantic.down}18` : 'transparent',
          border: `1px solid ${COLOR.semantic.down}`,
          color: COLOR.semantic.down,
        };
      case 'primary':
        return {
          background: hovered ? COLOR.bg.subtle : COLOR.bg.overlay,
          border: `1px solid ${hovered ? COLOR.text.muted : COLOR.bg.border}`,
          color: COLOR.text.primary,
        };
      case 'secondary':
        return {
          background: 'transparent',
          border: `1px solid ${COLOR.bg.border}`,
          color: COLOR.text.secondary,
        };
      case 'outline':
        return {
          background: 'transparent',
          border: `1px solid ${COLOR.text.muted}`,
          color: COLOR.text.muted,
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
        opacity: (disabled || loading) ? 0.4 : 1,
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: `background ${MOTION.duration.hover} ${MOTION.easing.standard}, color ${MOTION.duration.hover} ${MOTION.easing.standard}, border-color ${MOTION.duration.hover} ${MOTION.easing.standard}`,
        ...style,
      }}
      className={className}
    >
      {loading ? <Loader2 className="animate-spin" size={12} style={{ marginRight: children ? SPACE[2] : '0' }} /> : null}
      {renderedChildren}
    </button>
  );
};
