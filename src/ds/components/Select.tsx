import React from 'react';
import { COLOR, TYPE, BORDER } from '../tokens';

type SelectSize = 'sm' | 'md' | 'lg';

const HEIGHT: Record<SelectSize, string> = {
  sm: '24px',
  md: '28px',
  lg: '32px',
};

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  selectSize?: SelectSize;
  style?:      React.CSSProperties;
}

/**
 * Select — standardized dropdown.
 * Custom arrow glyph, no native appearance. Dark option background.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ selectSize = 'md', style, children, ...rest }, ref) => (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <select
        ref={ref}
        style={{
          height:       HEIGHT[selectSize],
          padding:      '0 24px 0 8px',
          fontFamily:   TYPE.family.mono,
          fontSize:     TYPE.size.sm,
          fontWeight:   TYPE.weight.medium,
          color:        COLOR.text.primary,
          background:   COLOR.bg.base,
          border:       BORDER.standard,
          borderRadius: 0,
          outline:      'none',
          width:        '100%',
          appearance:   'none',
          cursor:       'pointer',
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
      <span
        style={{
          position:      'absolute',
          right:         '8px',
          fontSize:      TYPE.size.xs,
          color:         COLOR.text.muted,
          pointerEvents: 'none',
          fontWeight:    TYPE.weight.black
        }}
      >
        ▼
      </span>
    </div>
  )
);

Select.displayName = 'Select';
