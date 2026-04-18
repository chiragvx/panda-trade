import React from 'react';
import { BORDER, COLOR, MOTION, SPACE, TYPE } from '../tokens';

type InputVariant = 'ghost' | 'solid';
type InputSize    = 'sm' | 'md' | 'lg';

const HEIGHT: Record<InputSize, string> = {
  sm: '2rem',
  md: '2.25rem',
  lg: '2.5rem',
};

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?:  InputVariant;
  inputSize?: InputSize;
  rightEl?:  React.ReactNode;
  style?:    React.CSSProperties;
}

/**
 * Input — standardized text/number input.
 * Replaces 5+ different inline input style objects across the app.
 * Heights: sm=32px | md=36px | lg=40px.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'solid', inputSize = 'md', rightEl, style, ...rest }, ref) => {

    const baseStyle: React.CSSProperties = {
      height:       HEIGHT[inputSize],
      padding:      `0 ${SPACE[3]}`,
      fontFamily:   TYPE.family.mono,
      fontSize:     TYPE.size.sm,
      fontWeight:   TYPE.weight.medium,
      color:        COLOR.text.primary,
      background:   variant === 'ghost' ? 'transparent' : COLOR.bg.surface,
      border:       variant === 'ghost' ? BORDER.standard : BORDER.standard,
      borderRadius: 0,
      outline:      'none',
      width:        '100%',
      caretColor:   COLOR.semantic.info,
      transition:   `border-color ${MOTION.duration.hover} ${MOTION.easing.standard}, background ${MOTION.duration.hover} ${MOTION.easing.standard}`,
      ...style,
    };

    if (rightEl) {
      return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input ref={ref} style={baseStyle} {...rest} />
          <div style={{ position: 'absolute', right: SPACE[3], pointerEvents: 'none', color: COLOR.text.muted, display: 'flex', alignItems: 'center' }}>
            {rightEl}
          </div>
        </div>
      );
    }

    return <input ref={ref} style={baseStyle} {...rest} />;
  }
);

Input.displayName = 'Input';
