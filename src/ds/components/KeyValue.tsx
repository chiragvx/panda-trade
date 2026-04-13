import React from 'react';
import { COLOR, TYPE, BORDER, ROW_HEIGHT } from '../tokens';

type KVLayout     = 'inline' | 'stacked';
type KVValueColor = 'primary' | 'secondary' | 'muted' | 'up' | 'down' | 'info' | 'warning';

const VALUE_COLOR: Record<KVValueColor, string> = {
  primary:   COLOR.text.primary,
  secondary: COLOR.text.secondary,
  muted:     COLOR.text.muted,
  up:        COLOR.semantic.up,
  down:      COLOR.semantic.down,
  info:      COLOR.semantic.info,
  warning:   COLOR.semantic.warning,
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily:    TYPE.family.mono,
  fontSize:      TYPE.size.xs,
  fontWeight:    TYPE.weight.bold,
  
  letterSpacing: TYPE.letterSpacing.caps,
  color:         COLOR.text.muted,
  whiteSpace:    'nowrap',
  flexShrink:    0,
};

interface KeyValueProps {
  label:       string;
  value:       React.ReactNode;
  layout?:     KVLayout;
  valueColor?: KVValueColor;
  divider?:    boolean;
  className?:  string;
  style?:      React.CSSProperties;
}

/**
 * KeyValue — the #1 most reinvented pattern in the codebase.
 * inline:  label → value side-by-side (32px row height, border-bottom)
 * stacked: label above value (flexible height)
 */
export const KeyValue: React.FC<KeyValueProps> = ({
  label,
  value,
  layout     = 'inline',
  valueColor = 'primary',
  divider    = true,
  className,
  style,
}) => {
  if (layout === 'stacked') {
    return (
      <div
        className={className}
        style={{
          display:      'flex',
          flexDirection: 'column',
          gap:          '4px',
          paddingBottom: divider ? '8px' : 0,
          borderBottom:  divider ? BORDER.standard : 'none',
          ...style,
        }}
      >
        <span style={LABEL_STYLE}>{label}</span>
        <span
          style={{
            fontFamily: TYPE.family.mono,
            fontSize:   TYPE.size.sm,
            fontWeight: TYPE.weight.medium,
            color:      VALUE_COLOR[valueColor],
            lineHeight: TYPE.lineHeight.tight,
          }}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        height:         ROW_HEIGHT.default,
        borderBottom:   divider ? BORDER.standard : 'none',
        gap:            '16px',
        ...style,
      }}
    >
      <span style={LABEL_STYLE}>{label}</span>
      <span
        style={{
          fontFamily: TYPE.family.mono,
          fontSize:   TYPE.size.sm,
          fontWeight: TYPE.weight.medium,
          color:      VALUE_COLOR[valueColor],
          lineHeight: TYPE.lineHeight.tight,
          textAlign:  'right',
        }}
      >
        {value}
      </span>
    </div>
  );
};
