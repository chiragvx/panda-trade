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
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '0 8px',
            background: COLOR.bg.base,
            borderLeft: `1px solid ${COLOR.bg.border}`,
            zIndex: Z.overlay,
            marginLeft: 'auto',
            ...style
          }}
        >
          {onInfo && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onInfo(); }} 
              style={{ color: COLOR.text.muted, border: 'none', background: 'transparent' }}
              title="View Fundamentals"
            >
              <Info size={16} />
            </Button>
          )}
          
          {onChart && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onChart(); }} 
              style={{ color: COLOR.text.muted, border: 'none', background: 'transparent' }}
              title="Open Chart"
            >
              <BarChart3 size={16} />
            </Button>
          )}

          {(onBuy || onSell) && (
            <div style={{ width: '1px', height: '12px', background: COLOR.bg.border, margin: '0 4px' }} />
          )}

          {onBuy && (
            <Button 
              variant="buy" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onBuy(); }}
            >
              BUY
            </Button>
          )}

          {onSell && (
            <Button 
              variant="sell" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onSell(); }}
            >
              SELL
            </Button>
          )}

          {extraActions}

          {onDelete && (
             <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              style={{ color: COLOR.semantic.down, border: 'none', background: 'transparent' }}
              title="Remove"
             >
                <Trash2 size={16} />
             </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
