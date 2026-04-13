import React from 'react';
import { COLOR, ROW_HEIGHT, BORDER } from '../tokens';

type RowDensity = 'compact' | 'default' | 'relaxed';

interface RowProps {
  density?:   RowDensity;
  selected?:  boolean;
  noBorder?:  boolean;
  onClick?:   () => void;
  className?: string;
  style?:     React.CSSProperties;
  children:   React.ReactNode;
}

/**
 * Row — universal data row.
 * Enforces the 4px-grid row heights and consistent horizontal padding.
 * compact=28px | default=32px | relaxed=36px
 */
export const Row: React.FC<RowProps> = ({
  density   = 'default',
  selected  = false,
  noBorder  = false,
  onClick,
  className,
  style,
  children,
}) => (
  <div
    className={className}
    onClick={onClick}
    style={{
      display:    'flex',
      alignItems: 'center',
      height:     ROW_HEIGHT[density],
      minHeight:  ROW_HEIGHT[density],
      padding:    '0 12px',
      background: selected ? COLOR.interactive.selected : 'transparent',
      borderBottom: noBorder ? 'none' : BORDER.standard,
      cursor:     onClick ? 'pointer' : 'default',
      flexShrink: 0,
      transition: 'background 60ms linear',
      ...style,
    }}
    onMouseEnter={onClick ? (e) => {
      e.currentTarget.style.background = selected
        ? COLOR.interactive.selected
        : COLOR.interactive.hover;
    } : undefined}
    onMouseLeave={onClick ? (e) => {
      e.currentTarget.style.background = selected
        ? COLOR.interactive.selected
        : 'transparent';
    } : undefined}
  >
    {children}
  </div>
);
