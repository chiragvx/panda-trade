import React from 'react';
import { BORDER, COLOR, LAYOUT, SPACE } from '../tokens';

const TONE_ACCENT: Record<string, string | undefined> = {
  accent:  COLOR.semantic.info,
  semantic: COLOR.semantic.up,
  neutral: undefined,
};

interface ToolbarProps {
  children: React.ReactNode;
  height?: string;
  borderBottom?: boolean;
  tone?: 'neutral' | 'accent' | 'semantic';
  stretch?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Toolbar: React.FC<ToolbarProps> & {
  Left: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }>;
  Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }>;
  Right: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }>;
} = ({
  children,
  height = LAYOUT.toolbarH,
  borderBottom = true,
  tone = 'neutral',
  stretch = false,
  className,
  style,
}) => {
  const accentColor = TONE_ACCENT[tone];
  return (
    <div
      className={className}
      style={{
        minHeight: height,
        height,
        display: 'flex',
        alignItems: stretch ? 'stretch' : 'center',
        justifyContent: stretch ? 'flex-start' : 'space-between',
        gap: stretch ? 0 : SPACE[1],
        padding: stretch ? 0 : `0 ${LAYOUT.cellPadH}`,
        background: COLOR.bg.surface,
        borderBottom: borderBottom ? BORDER.standard : 'none',
        borderLeft: accentColor ? `2px solid ${accentColor}` : undefined,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

Toolbar.Left = ({ children, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[1], minWidth: 0, ...style }}>{children}</div>
);

Toolbar.Center = ({ children, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE[1], flex: 1, minWidth: 0, ...style }}>{children}</div>
);

Toolbar.Right = ({ children, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: SPACE[1], minWidth: 0, ...style }}>{children}</div>
);
