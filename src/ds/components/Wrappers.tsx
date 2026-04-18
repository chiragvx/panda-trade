import React from 'react';
import { BORDER, COLOR, MOTION, SIZE, SPACE, TYPE } from '../tokens';
import { Dot } from './Dot';
import { humanizeLabel, maybeHumanizeNode } from '../textFormat';

type WrapperTone = 'neutral' | 'accent' | 'semantic';
type WrapperSize = 'sm' | 'md' | 'lg';

const TONE_COLORS: Record<WrapperTone, { border: string; fg: string; bg: string }> = {
  neutral: {
    border: COLOR.bg.border,
    fg: COLOR.text.secondary,
    bg: COLOR.bg.elevated,
  },
  accent: {
    border: `${COLOR.semantic.info}66`,
    fg: COLOR.semantic.info,
    bg: `${COLOR.semantic.info}14`,
  },
  semantic: {
    border: `${COLOR.semantic.up}44`,
    fg: COLOR.semantic.up,
    bg: `${COLOR.semantic.up}14`,
  },
};

const BOX_SIZES: Record<WrapperSize, string> = {
  sm: SIZE.wrapper.icon,
  md: '1.5rem',
  lg: '2rem',
};

export interface IconWrapperProps {
  icon: React.ReactNode;
  tone?: WrapperTone;
  size?: WrapperSize;
  active?: boolean;
  style?: React.CSSProperties;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  icon,
  tone = 'neutral',
  size = 'sm',
  active = false,
  style,
}) => {
  const palette = active ? TONE_COLORS.accent : TONE_COLORS[tone];
  return (
    <div
      style={{
        width: BOX_SIZES[size],
        height: BOX_SIZES[size],
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: `border-color ${MOTION.duration.hover} ${MOTION.easing.standard}, color ${MOTION.duration.hover} ${MOTION.easing.standard}, background ${MOTION.duration.hover} ${MOTION.easing.standard}`,
        ...style,
      }}
    >
      {icon}
    </div>
  );
};

export interface LogoWrapperProps {
  src?: string;
  alt?: string;
  children?: React.ReactNode;
  tone?: WrapperTone;
  height?: string;
  style?: React.CSSProperties;
}

export const LogoWrapper: React.FC<LogoWrapperProps> = ({
  src,
  alt = 'logo',
  children,
  tone = 'accent',
  height = SIZE.wrapper.icon,
  style,
}) => {
  const palette = TONE_COLORS[tone];
  return (
    <div
      style={{
        minHeight: height,
        padding: `0 ${SPACE[2]}`,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      {src ? <img src={src} alt={alt} style={{ height, display: 'block', objectFit: 'contain' }} /> : children}
    </div>
  );
};

export interface HeaderStackProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  capsSubtitle?: boolean;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}

export const HeaderStack: React.FC<HeaderStackProps> = ({
  title,
  subtitle,
  capsSubtitle = false,
  align = 'left',
  style,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end',
      gap: SPACE[0.5],
      minWidth: 0,
      ...style,
    }}
  >
    <span
      style={{
        fontFamily: TYPE.family.mono,
        fontSize: TYPE.size.sm,
        fontWeight: TYPE.weight.bold,
        color: COLOR.text.primary,
        lineHeight: TYPE.lineHeight.tight,
        letterSpacing: TYPE.letterSpacing.tight,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
        {maybeHumanizeNode(title)}
      </span>
    {subtitle ? (
      <span
        style={{
          fontFamily: TYPE.family.mono,
          fontSize: TYPE.size.xs,
          fontWeight: TYPE.weight.medium,
          color: COLOR.text.muted,
          lineHeight: TYPE.lineHeight.tight,
          letterSpacing: capsSubtitle ? TYPE.letterSpacing.wide : TYPE.letterSpacing.normal,
          textTransform: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
          {maybeHumanizeNode(subtitle)}
        </span>
    ) : null}
  </div>
);

export interface BrandLockupProps {
  icon?: React.ReactNode;
  logo?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: WrapperTone;
  active?: boolean;
  style?: React.CSSProperties;
}

export const BrandLockup: React.FC<BrandLockupProps> = ({
  icon,
  logo,
  title,
  subtitle,
  tone = 'neutral',
  active = false,
  style,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: SPACE[3],
      minWidth: 0,
      ...style,
    }}
  >
    {logo ? <LogoWrapper tone={tone}>{logo}</LogoWrapper> : null}
    {!logo && icon ? <IconWrapper icon={icon} tone={tone} active={active} /> : null}
    <HeaderStack title={title} subtitle={subtitle} />
  </div>
);

export interface ActionWrapperProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: WrapperTone;
  size?: 'sm' | 'md';
  active?: boolean;
}

export const ActionWrapper = React.forwardRef<HTMLButtonElement, ActionWrapperProps>(
  ({ children, tone = 'neutral', size = 'sm', active = false, style, className, ...rest }, ref) => {
    const palette = active ? TONE_COLORS.accent : TONE_COLORS[tone];
    const box = size === 'sm' ? SIZE.wrapper.headerAction : SIZE.wrapper.headerActionLg;
    return (
      <button
        ref={ref}
        {...rest}
        className={`hover:bg-interactive-hover ${className ?? ''}`.trim()}
        style={{
          width: box,
          height: box,
          border: 'none',
          background: active ? palette.bg : 'transparent',
          color: palette.fg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: rest.disabled ? 'not-allowed' : 'pointer',
          opacity: rest.disabled ? 0.45 : 1,
          flexShrink: 0,
          padding: 0,
          transition: `background ${MOTION.duration.hover} ${MOTION.easing.standard}, color ${MOTION.duration.hover} ${MOTION.easing.standard}`,
          ...style,
        }}
      >
        {children}
      </button>
    );
  }
);

ActionWrapper.displayName = 'ActionWrapper';

interface FieldWrapperProps {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({ prefix, suffix, children, style }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'stretch',
      width: '100%',
      border: BORDER.standard,
      background: COLOR.bg.surface,
      minHeight: SIZE.shell.toolbar,
      ...style,
    }}
  >
    {prefix ? (
      <div style={{ display: 'inline-flex', alignItems: 'center', padding: `0 ${SPACE[3]}`, color: COLOR.text.muted }}>
        {prefix}
      </div>
    ) : null}
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>{children}</div>
    {suffix ? (
      <div style={{ display: 'inline-flex', alignItems: 'center', padding: `0 ${SPACE[3]}`, color: COLOR.text.muted }}>
        {suffix}
      </div>
    ) : null}
  </div>
);

interface MetricWrapperProps {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: WrapperTone;
  inline?: boolean;
  bare?: boolean;
  style?: React.CSSProperties;
}

export const MetricWrapper: React.FC<MetricWrapperProps> = ({
  label,
  value,
  tone = 'neutral',
  inline = true,
  bare = false,
  style,
}) => {
  const palette = TONE_COLORS[tone];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: inline ? 'row' : 'column',
        alignItems: inline ? 'center' : 'flex-start',
        gap: SPACE[2],
        minHeight: SIZE.wrapper.metric,
        padding: bare ? `0 ${SPACE[2]}` : `0 ${SPACE[3]}`,
        border: bare ? 'none' : BORDER.standard,
        background: bare ? 'transparent' : COLOR.bg.surface,
        color: palette.fg,
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: TYPE.family.mono,
          fontSize: TYPE.size.xs,
          fontWeight: TYPE.weight.bold,
          color: COLOR.text.muted,
          letterSpacing: TYPE.letterSpacing.caps,
          whiteSpace: 'nowrap',
        }}
      >
        {maybeHumanizeNode(label)}
      </span>
      <span
        style={{
          fontFamily: TYPE.family.mono,
          fontSize: TYPE.size.sm,
          fontWeight: TYPE.weight.bold,
          color: COLOR.text.primary,
          whiteSpace: 'nowrap',
        }}
      >
        {maybeHumanizeNode(value)}
      </span>
    </div>
  );
};

interface StatusWrapperProps {
  label: React.ReactNode;
  tone?: 'up' | 'down' | 'warning' | 'muted' | 'accent';
  withDot?: boolean;
  bare?: boolean;
  style?: React.CSSProperties;
}

export const StatusWrapper: React.FC<StatusWrapperProps> = ({
  label,
  tone = 'muted',
  withDot = true,
  bare = false,
  style,
}) => {
  const colorMap = {
    up: COLOR.semantic.up,
    down: COLOR.semantic.down,
    warning: COLOR.semantic.warning,
    muted: COLOR.text.muted,
    accent: COLOR.semantic.info,
  };
  const color = colorMap[tone];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACE[2],
        minHeight: SIZE.wrapper.metric,
        padding: bare ? `0 ${SPACE[2]}` : `0 ${SPACE[3]}`,
        border: bare ? 'none' : BORDER.standard,
        background: bare ? 'transparent' : COLOR.bg.surface,
        ...style,
      }}
    >
      {withDot ? <Dot color={tone === 'accent' ? 'info' : (tone as any)} size={6} /> : null}
      <span
        style={{
          fontFamily: TYPE.family.mono,
          fontSize: TYPE.size.xs,
          fontWeight: TYPE.weight.bold,
          color,
          letterSpacing: TYPE.letterSpacing.caps,
          whiteSpace: 'nowrap',
        }}
      >
        {typeof label === 'string' ? humanizeLabel(label) : label}
      </span>
    </div>
  );
};
