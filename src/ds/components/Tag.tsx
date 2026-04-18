import React from 'react';
import { COLOR, TYPE } from '../tokens';
import { humanizeLabel } from '../textFormat';

type TagVariant = 'up' | 'down' | 'info' | 'warning' | 'muted' | 'nse' | 'bse';

const VARIANT_COLORS: Record<TagVariant, { text: string; border: string; bg: string }> = {
  up:      { text: COLOR.semantic.up,        border: `${COLOR.semantic.up}44`,      bg: `${COLOR.semantic.up}08`      },
  down:    { text: COLOR.semantic.down,      border: `${COLOR.semantic.down}44`,    bg: `${COLOR.semantic.down}08`    },
  info:    { text: COLOR.semantic.info,      border: `${COLOR.semantic.info}44`,    bg: `${COLOR.semantic.info}08`    },
  warning: { text: COLOR.semantic.warning,   border: `${COLOR.semantic.warning}44`, bg: `${COLOR.semantic.warning}08` },
  muted:   { text: COLOR.text.muted,         border: COLOR.bg.border,               bg: 'transparent'                 },
  nse:     { text: 'rgba(74,158,255,0.85)',  border: 'rgba(74,158,255,0.3)',        bg: 'rgba(74,158,255,0.05)'       },
  bse:     { text: 'rgba(245,166,35,0.85)',  border: 'rgba(245,166,35,0.3)',        bg: 'rgba(245,166,35,0.05)'       },
};

interface TagProps {
  label:    string;
  variant?: TagVariant;
  style?:   React.CSSProperties;
  onClick?: () => void;
}

/**
 * Tag — compact pill label for exchange names, order types, statuses.
 * Standard height 16px. Sharp corners (borderRadius: 0).
 */
export const Tag: React.FC<TagProps> = ({ label, variant = 'muted', style, onClick }) => {
  const { text, border, bg } = VARIANT_COLORS[variant];
  return (
    <span
      onClick={onClick}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        height:        '16px',
        padding:       '0 4px',
        border:        `1px solid ${border}`,
        borderRadius:  '0',
        background:    bg,
        fontFamily:    TYPE.family.mono,
        fontSize:      TYPE.size.xs,
        fontWeight:    TYPE.weight.bold,
        letterSpacing: TYPE.letterSpacing.caps,
        color:         text,
        
        whiteSpace:    'nowrap',
        lineHeight:     1,
        flexShrink:     0,
        ...style,
      }}
    >
      {humanizeLabel(label)}
    </span>
  );
};
