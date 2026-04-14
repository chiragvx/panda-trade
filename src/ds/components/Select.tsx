import React from 'react';
import { COLOR, TYPE, BORDER } from '../tokens';

type SelectSize = 'sm' | 'md' | 'lg';

const HEIGHT: Record<SelectSize, string> = {
  sm: '24px',
  md: '32px',
  lg: '40px',
};

const FONT_SIZE: Record<SelectSize, string> = {
  sm: TYPE.size.xs,
  md: TYPE.size.sm,
  lg: TYPE.size.sm,
};

const PADDING: Record<SelectSize, string> = {
  sm: '0 22px 0 6px',
  md: '0 24px 0 12px',
  lg: '0 28px 0 16px',
};

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  selectSize?: SelectSize;
  style?: React.CSSProperties;
}

/**
 * Select — Global standardized dropdown.
 * - Dark terminal color scheme, no native appearance
 * - Consistent across all widgets and pages
 * - Monospace font, sharp corners, design system border
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ selectSize = 'md', style, children, ...rest }, ref) => (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        ref={ref}
        style={{
          height:       HEIGHT[selectSize],
          padding:      PADDING[selectSize],
          fontFamily:   TYPE.family.mono,
          fontSize:     FONT_SIZE[selectSize],
          fontWeight:   TYPE.weight.bold,
          color:        COLOR.text.primary,
          background:   COLOR.bg.elevated,
          border:       BORDER.standard,
          borderRadius: 0,
          outline:      'none',
          width:        '100%',
          appearance:   'none',
          cursor:       'pointer',
          transition:   'border-color 80ms linear',
          ...style,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = COLOR.semantic.info + '66')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = COLOR.bg.border)}
        {...rest}
      >
        {children}
      </select>
      {/* Custom chevron — always perfectly positioned */}
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        style={{
          position:      'absolute',
          right:         '7px',
          pointerEvents: 'none',
          flexShrink:    0,
        }}
      >
        <path d="M1 1L5 5L9 1" stroke={COLOR.text.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
);

Select.displayName = 'Select';
