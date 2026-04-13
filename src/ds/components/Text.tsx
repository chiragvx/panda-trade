import React from 'react';
import { COLOR, TYPE } from '../tokens';

type TextVariant = 'label' | 'value' | 'caption' | 'heading';
type TextColor = 'primary' | 'secondary' | 'muted' | 'up' | 'down' | 'info' | 'warning' | 'purple';
type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type TextWeight = keyof typeof TYPE.weight;
type TextTag = 'span' | 'div' | 'p' | 'label' | 'h1' | 'h2' | 'h3';

const COLOR_MAP: Record<TextColor, string> = {
  primary:   COLOR.text.primary,
  secondary: COLOR.text.secondary,
  muted:     COLOR.text.muted,
  up:        COLOR.semantic.up,
  down:      COLOR.semantic.down,
  info:      COLOR.semantic.info,
  warning:   COLOR.semantic.warning,
  purple:    COLOR.semantic.purple,
};

const VARIANT_BASE: Record<TextVariant, React.CSSProperties> = {
  label: {
    fontSize:      TYPE.size.xs,
    fontWeight:    TYPE.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: TYPE.letterSpacing.caps,
    color:         COLOR.text.muted,
    lineHeight:    TYPE.lineHeight.tight,
  },
  value: {
    fontSize:   TYPE.size.sm,
    fontWeight: TYPE.weight.medium,
    color:      COLOR.text.primary,
    lineHeight: TYPE.lineHeight.tight,
  },
  caption: {
    fontSize:   TYPE.size.xs,
    fontWeight: TYPE.weight.regular,
    color:      COLOR.text.muted,
    fontStyle:  'italic',
    lineHeight: TYPE.lineHeight.standard,
  },
  heading: {
    fontSize:      TYPE.size.xl,
    fontWeight:    TYPE.weight.black,
    textTransform: 'uppercase',
    letterSpacing: TYPE.letterSpacing.wide,
    color:         COLOR.text.primary,
    lineHeight:    TYPE.lineHeight.tight,
  },
};

interface TextProps {
  variant?:   TextVariant;
  size?:      TextSize;
  color?:     TextColor;
  weight?:    TextWeight;
  uppercase?: boolean;
  noWrap?:    boolean;
  block?:     boolean;
  ellipsis?:  boolean;
  family?:    string;
  as?:        TextTag;
  className?: string;
  style?:     React.CSSProperties;
  children:   React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant,
  size,
  color,
  weight,
  uppercase,
  noWrap,
  block,
  ellipsis,
  family,
  as: Tag = 'span',
  className,
  style,
  children,
}) => {
  const variantStyles = variant ? VARIANT_BASE[variant] : {};

  return (
    <Tag
      className={className}
      style={{
        fontFamily: TYPE.family.mono,
        lineHeight: TYPE.lineHeight.tight,
        ...variantStyles,
        ...(size    && { fontSize:      TYPE.size[size] }),
        ...(color   && { color:         COLOR_MAP[color] }),
        ...(weight  && { fontWeight:    TYPE.weight[weight] }),
        ...(uppercase && { textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }),
        ...(noWrap  && { whiteSpace:    'nowrap' }),
        ...(block   && { display:       'block' }),
        ...(ellipsis && { 
          display: 'block', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }),
        ...(family  && { fontFamily:    family }),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};
