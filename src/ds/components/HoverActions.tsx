import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Info, BarChart3, Trash2 } from 'lucide-react';
import { COLOR, BORDER, Z } from '../tokens';

interface HoverActionsProps {
  isVisible: boolean;
  onBuy?: () => void;
  onSell?: () => void;
  onInfo?: () => void;
  onChart?: () => void;
  onDelete?: () => void;
  extraActions?: React.ReactNode;
  position?: 'sticky' | 'absolute';
  className?: string;
  style?: React.CSSProperties;
}

export const HoverActions: React.FC<HoverActionsProps> = ({ 
  isVisible, 
  onBuy, 
  onSell, 
  onInfo, 
  onChart, 
  onDelete,
  extraActions,
  position = 'absolute',
  className,
  style
}) => {
  const itemStyle = (color: string, isOutline: boolean = false): React.CSSProperties => ({
    width: '32px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.1s ease, color 0.1s ease',
    boxSizing: 'border-box',
    boxShadow: isOutline ? `inset 0 0 0 1px ${color}` : 'none',
    color: color,
    fontSize: '11px',
    fontWeight: 900,
    background: 'transparent',
    padding: 0,
    margin: 0,
    border: 'none',
    outline: 'none',
    // Root cause fix: UA stylesheet sets vertical-align: baseline on <button>,
    // causing sub-pixel glyph differences between adjacent letters (e.g. 'B' vs 'S').
    // verticalAlign: top + appearance: none strips all browser-native button rendering.
    verticalAlign: 'top',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none' as any,
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.1 }}
          className={className}
          style={{
            position: position as any,
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'stretch',
            background: COLOR.bg.base,
            borderLeft: `1px solid ${COLOR.bg.border}`,
            zIndex: Z.overlay,
            ...style
          }}
        >
          {onInfo && (
            <button 
                onClick={(e) => { e.stopPropagation(); onInfo(); }} 
                style={itemStyle(COLOR.text.muted)}
                title="View Fundamentals"
            >
                <Info size={14} />
            </button>
          )}
          
          {onChart && (
            <button 
                onClick={(e) => { e.stopPropagation(); onChart(); }} 
                style={itemStyle(COLOR.text.muted)}
                title="Open Chart"
            >
                <BarChart3 size={14} />
            </button>
          )}

          {onBuy && (
            <button 
                onClick={(e) => { e.stopPropagation(); onBuy(); }}
                style={{
                    ...itemStyle(COLOR.semantic.up, true),
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = COLOR.semantic.up;
                    e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = COLOR.semantic.up;
                }}
            >
                B
            </button>
          )}

          {onSell && (
            <button 
                onClick={(e) => { e.stopPropagation(); onSell(); }}
                style={{
                    ...itemStyle(COLOR.semantic.down, true),
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = COLOR.semantic.down;
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = COLOR.semantic.down;
                }}
            >
                S
            </button>
          )}

          {extraActions && (
             <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                {extraActions}
             </div>
          )}

          {onDelete && (
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                style={itemStyle(COLOR.semantic.down)}
                title="Remove"
             >
                <Trash2 size={14} />
             </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
