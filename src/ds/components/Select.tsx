import React from 'react';
import { BORDER, COLOR, MOTION, SPACE, TYPE } from '../tokens';

type SelectSize = 'sm' | 'md' | 'lg';

const HEIGHT: Record<SelectSize, string> = {
  sm: '2rem',
  md: '2.25rem',
  lg: '2.5rem',
};

const FONT_SIZE: Record<SelectSize, string> = {
  sm: TYPE.size.xs,
  md: TYPE.size.sm,
  lg: TYPE.size.md,
};

const PADDING: Record<SelectSize, string> = {
  sm: `0 1.75rem 0 ${SPACE[2]}`,
  md: `0 2rem 0 ${SPACE[3]}`,
  lg: `0 2rem 0 ${SPACE[4]}`,
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
          background:   COLOR.bg.surface,
          border:       BORDER.standard,
          borderRadius: 0,
          outline:      'none',
          width:        '100%',
          appearance:   'none',
          cursor:       'pointer',
          transition:   `border-color ${MOTION.duration.hover} ${MOTION.easing.standard}, background ${MOTION.duration.hover} ${MOTION.easing.standard}`,
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
          right:         SPACE[2],
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
