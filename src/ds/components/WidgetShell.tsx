import React from 'react';
import { COLOR, TYPE, BORDER, LAYOUT } from '../tokens';
import { Text } from './Text';

interface WidgetShellProps {
  children: React.ReactNode;
  variant?: 'base' | 'surface' | 'elevated';
  className?: string;
  style?: React.CSSProperties;
}

export const WidgetShell: React.FC<WidgetShellProps> & { 
  Toolbar: React.FC<ToolbarProps> & {
    Left: React.FC<{ children: React.ReactNode }>;
    Center: React.FC<{ children: React.ReactNode }>;
    Right: React.FC<{ children: React.ReactNode }>;
  } 
} = ({ 
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
  height = LAYOUT.toolbarH, 
  borderBottom = true,
  className,
  style
}) => (
  <div 
    className={className}
    style={{
      height,
      minHeight: height,
      padding: `0 ${LAYOUT.cellPadH}`,
      borderBottom: borderBottom ? BORDER.standard : 'none',
      background: COLOR.bg.surface,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      gap: '8px',
      ...style
    }}
  >
    {children}
  </div>
);

const ToolbarLeft: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
    {children}
  </div>
);

const ToolbarCenter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
    {children}
  </div>
);

const ToolbarRight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, justifyContent: 'flex-end' }}>
    {children}
  </div>
);

// Type assertion to support sub-components
const InternalToolbar = Toolbar as any;
InternalToolbar.Left = ToolbarLeft;
InternalToolbar.Center = ToolbarCenter;
InternalToolbar.Right = ToolbarRight;

WidgetShell.Toolbar = InternalToolbar;
