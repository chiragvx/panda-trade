import React from 'react';
import { COLOR, TYPE } from '../tokens';
import { Toolbar } from './Toolbar';

interface WidgetShellProps {
  children: React.ReactNode;
  variant?: 'base' | 'surface' | 'elevated';
  className?: string;
  style?: React.CSSProperties;
}

export const WidgetShell: React.FC<WidgetShellProps> & {
  Toolbar: typeof Toolbar;
} = ({ children, variant = 'base', className, style }) => (
  <div
    className={className}
    style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: COLOR.bg[variant],
      fontFamily: TYPE.family.mono,
      overflow: 'hidden',
      minHeight: 0,
      ...style,
    }}
  >
    {children}
  </div>
);

WidgetShell.Toolbar = Toolbar;
