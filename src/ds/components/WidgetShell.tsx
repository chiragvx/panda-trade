import React from 'react';
import { COLOR, TYPE, BORDER } from '../tokens';

interface WidgetShellProps {
  children: React.ReactNode;
  variant?: 'base' | 'surface' | 'elevated';
  className?: string;
  style?: React.CSSProperties;
}

export const WidgetShell: React.FC<WidgetShellProps> & { Toolbar: React.FC<ToolbarProps> } = ({ 
  children, 
  variant = 'base',
  className,
  style
}) => {
  return (
    <div 
      className={className}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg[variant],
        fontFamily: TYPE.family.mono,
        overflow: 'hidden',
        ...style
      }}
    >
      {children}
    </div>
  );
};

interface ToolbarProps {
  children: React.ReactNode;
  height?: string;
  borderBottom?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  children, 
  height = '36px', 
  borderBottom = true,
  className,
  style
}) => (
  <div 
    className={className}
    style={{
      height,
      minHeight: height,
      padding: '0 12px',
      borderBottom: borderBottom ? BORDER.standard : 'none',
      background: COLOR.bg.surface,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      ...style
    }}
  >
    {children}
  </div>
);

WidgetShell.Toolbar = Toolbar;
