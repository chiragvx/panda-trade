import React from 'react';
import { COLOR, BORDER, LAYOUT } from '../tokens';

interface FilterRowProps {
  children:      React.ReactNode;
  noBorder?:     boolean;
  noBackground?: boolean;
  style?:        React.CSSProperties;
  className?:    string;
}

/**
 * FilterRow — standardized 32px filter / search bar row.
 * Used as the top control row inside widgets: expiry picker, strike filters,
 * segment controls, etc.
 *
 * Height: LAYOUT.filterH = 32px
 * Padding: 0 12px horizontal (cellPadH)
 * Gap: 8px between children
 */
export const FilterRow: React.FC<FilterRowProps> = ({
  children,
  noBorder     = false,
  noBackground = false,
  style,
  className,
}) => (
  <div
    className={className}
    style={{
      height:      LAYOUT.filterH,
      minHeight:   LAYOUT.filterH,
      display:     'flex',
      alignItems:  'center',
      padding:     '0 12px',
      gap:         '8px',
      background:  noBackground ? 'transparent' : COLOR.bg.surface,
      borderBottom: noBorder ? 'none' : BORDER.standard,
      flexShrink:  0,
      ...style,
    }}
  >
    {children}
  </div>
);
