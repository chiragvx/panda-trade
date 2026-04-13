import React from 'react';
import { COLOR, TYPE, BORDER } from '../tokens';

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  size?: 'xs' | 'sm';
  className?: string;
  style?: React.CSSProperties;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ 
  options, 
  value, 
  onChange,
  size = 'xs',
  className,
  style
}) => {
  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        background: COLOR.bg.elevated, 
        border: BORDER.standard,
        ...style 
      }}
    >
      {options.map((opt, idx) => {
        const isActive = value === opt.value;
        return (
          <button 
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{ 
                padding: size === 'xs' ? '2px 8px' : '4px 12px', 
                fontSize: TYPE.size.xs, 
                fontWeight: TYPE.weight.black, 
                background: isActive ? COLOR.interactive.selected : 'transparent',
                color: isActive ? COLOR.semantic.info : COLOR.text.muted,
                border: 'none',
                borderRight: idx !== options.length - 1 ? BORDER.standard : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: TYPE.family.mono,
                
                transition: 'all 0.1s linear',
                letterSpacing: TYPE.letterSpacing.caps
            }}
            className="hover:text-text-primary transition-colors"
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
