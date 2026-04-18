import React from 'react';
import { BORDER, COLOR, LAYOUT, SPACE, Z } from '../tokens';
import { HeaderMode } from '../../widgets/types';
import { BrandLockup } from './Wrappers';

const TONE_ACCENT: Record<string, string | undefined> = {
  accent: COLOR.semantic.info,
  semantic: COLOR.semantic.up,
  neutral: undefined,
};

interface BaseShellProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface HeaderContentProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  logo?: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'semantic';
  headerMode?: HeaderMode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  headerStyle?: React.CSSProperties;
}

const HeaderContent: React.FC<HeaderContentProps> = ({
  title,
  subtitle,
  icon,
  logo,
  tone = 'neutral',
  headerMode = 'stacked',
  actions,
  meta,
  headerStyle,
}) => {
  if (headerMode === 'hidden') return null;

  const modeHeight = headerMode === 'minimal' ? LAYOUT.toolbarH : LAYOUT.widgetHeaderH;
  const accentColor = TONE_ACCENT[tone];

  return (
    <div
      style={{
        minHeight: modeHeight,
        height: modeHeight,
        padding: `0 ${LAYOUT.cellPadH}`,
        borderBottom: BORDER.standard,
        background: COLOR.bg.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACE[2],
        flexShrink: 0,
        ...headerStyle,
      }}
    >
      <BrandLockup
        icon={icon}
        logo={logo}
        title={title}
        subtitle={headerMode === 'minimal' ? undefined : subtitle}
        tone={tone}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[1], minWidth: 0 }}>
        {meta}
        {actions}
      </div>
    </div>
  );
};

interface PanelShellProps extends BaseShellProps, HeaderContentProps {
  variant?: 'base' | 'surface' | 'elevated';
}

export const PanelShell: React.FC<PanelShellProps> = ({
  children,
  variant = 'base',
  title,
  subtitle,
  icon,
  logo,
  tone = 'neutral',
  headerMode = 'stacked',
  actions,
  meta,
  headerStyle,
  className,
  style,
}) => (
  <div
    className={className}
    style={{
      height: '100%',
      width: '100%',
      background: COLOR.bg[variant],
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ...style,
    }}
  >
    <HeaderContent
      title={title}
      subtitle={subtitle}
      icon={icon}
      logo={logo}
      tone={tone}
      headerMode={headerMode}
      actions={actions}
      meta={meta}
      headerStyle={headerStyle}
    />
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: COLOR.bg[variant] }}>
      {children}
    </div>
  </div>
);

interface PageShellProps extends BaseShellProps, HeaderContentProps {
  footer?: React.ReactNode;
  fullViewport?: boolean;
}

export const PageShell: React.FC<PageShellProps> = ({
  children,
  title,
  subtitle,
  icon,
  logo,
  tone = 'accent',
  headerMode = 'stacked',
  actions,
  meta,
  headerStyle,
  footer,
  fullViewport = true,
  className,
  style,
}) => (
  <div
    className={className}
    style={{
      minHeight: fullViewport ? '100vh' : '100%',
      height: fullViewport ? 'auto' : '100%',
      width: '100%',
      background: COLOR.bg.base,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    <HeaderContent
      title={title}
      subtitle={subtitle}
      icon={icon}
      logo={logo}
      tone={tone}
      headerMode={headerMode}
      actions={actions}
      meta={meta}
      headerStyle={headerStyle}
    />
    <div style={{ flex: 1, minHeight: 0, padding: LAYOUT.pagePad, display: 'flex', flexDirection: 'column' }}>{children}</div>
    {footer ? <div style={{ borderTop: BORDER.standard, minHeight: '2rem', padding: `0 ${LAYOUT.pagePad}`, display: 'flex', alignItems: 'center' }}>{footer}</div> : null}
  </div>
);

interface ModalShellProps extends BaseShellProps, HeaderContentProps {
  footer?: React.ReactNode;
  width?: string;
  height?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  children,
  title,
  subtitle,
  icon,
  logo,
  tone = 'accent',
  headerMode = 'stacked',
  actions,
  meta,
  headerStyle,
  footer,
  width = '50rem',
  height = '31.25rem',
  style,
  className,
}) => (
  <div
    className={className}
    style={{
      width,
      height,
      background: COLOR.bg.overlay,
      border: BORDER.standard,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ...style,
    }}
  >
    <HeaderContent
      title={title}
      subtitle={subtitle}
      icon={icon}
      logo={logo}
      tone={tone}
      headerMode={headerMode}
      actions={actions}
      meta={meta}
      headerStyle={headerStyle}
    />
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: LAYOUT.pagePad }}>{children}</div>
    {footer ? <div style={{ minHeight: '2.5rem', borderTop: BORDER.standard, padding: `0 ${LAYOUT.pagePad}`, display: 'flex', alignItems: 'center' }}>{footer}</div> : null}
  </div>
);

interface OverlayShellProps extends BaseShellProps {
  onClick?: () => void;
}

export const OverlayShell: React.FC<OverlayShellProps> = ({ children, onClick, className, style }) => (
  <div
    className={className}
    onClick={onClick}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: Z.modal,
      background: 'rgba(5,5,5,0.88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: LAYOUT.pagePad,
      ...style,
    }}
  >
    {children}
  </div>
);

interface CommandSurfaceProps extends BaseShellProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const CommandSurface: React.FC<CommandSurfaceProps> = ({
  children,
  header,
  footer,
  width = '31.25rem',
  className,
  style,
}) => (
  <div
    className={className}
    style={{
      width,
      background: COLOR.bg.overlay,
      border: BORDER.standard,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ...style,
    }}
  >
    {header ? <div style={{ borderBottom: BORDER.standard }}>{header}</div> : null}
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    {footer ? <div style={{ borderTop: BORDER.standard }}>{footer}</div> : null}
  </div>
);
