import React from 'react';
import { COLOR, TYPE, BORDER } from '../tokens';

type InputVariant = 'ghost' | 'solid';
type InputSize    = 'sm' | 'md' | 'lg';

const HEIGHT: Record<InputSize, string> = {
  sm: '24px',
  md: '32px',
  lg: '40px',
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
 * Heights: sm=24px | md=28px | lg=32px (all 4px-grid).
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'solid', inputSize = 'md', rightEl, style, ...rest }, ref) => {

    const baseStyle: React.CSSProperties = {
      height:       HEIGHT[inputSize],
      padding:      '0 12px',
      fontFamily:   TYPE.family.mono,
      fontSize:     TYPE.size.sm,
      fontWeight:   TYPE.weight.medium,
      color:        COLOR.text.primary,
      background:   variant === 'ghost' ? 'transparent' : '#000000',
      border:       variant === 'ghost' ? 'none' : BORDER.standard,
      borderRadius: 0,
      outline:      'none',
      width:        '100%',
      caretColor:   COLOR.semantic.info,
      transition:   'border-color 80ms linear',
      ...style,
    };

    if (rightEl) {
      return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input ref={ref} style={baseStyle} {...rest} />
          <div style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: COLOR.text.muted, display: 'flex', alignItems: 'center' }}>
            {rightEl}
          </div>
        </div>
      );
    }

    return <input ref={ref} style={baseStyle} {...rest} />;
  }
);

Input.displayName = 'Input';
