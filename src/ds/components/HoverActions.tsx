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
  const itemStyle = (color: string, isExecution: boolean = false): React.CSSProperties => ({
    width: isExecution ? '32px' : '32px',
    height: isExecution ? '30px' : '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    boxSizing: 'border-box',
    border: isExecution ? `1px solid ${color}` : 'none',
    borderRadius: '0', 
    margin: isExecution ? '0 2px' : '0',
    color: color,
    fontSize: '12px',
    fontWeight: 900,
    background: 'transparent',
    padding: 0,
    outline: 'none',
    verticalAlign: 'top',
    appearance: 'none',
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
          transition={{ duration: 0.1 }}
          className={className}
          style={{
            position: position as any,
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            background: COLOR.bg.surface,
            borderLeft: `1px solid ${COLOR.bg.border}`,
            padding: '0 4px',
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

          {extraActions && (
             <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                {extraActions}
             </div>
          )}

          <div style={{ width: '1px', height: '14px', background: COLOR.bg.border, margin: '0 4px' }} />

          {onBuy && (
            <button 
                onClick={(e) => { e.stopPropagation(); onBuy(); }}
                style={itemStyle(COLOR.semantic.up, true)}
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
                style={itemStyle(COLOR.semantic.down, true)}
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
