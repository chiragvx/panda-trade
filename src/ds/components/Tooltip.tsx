import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLOR, TYPE, BORDER, Z } from '../tokens';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'bottom',
  delay = 0.3
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const show = () => {
    const id = setTimeout(() => setIsVisible(true), delay * 1000);
    setTimeoutId(id);
  };

  const hide = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positions = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
  };

  return (
    <div 
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              ...positions[position],
              zIndex: Z.tooltip,
              background: '#111',
              border: BORDER.standard,
              padding: '4px 8px',
              borderRadius: '2px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <span style={{ 
              fontSize: TYPE.size.xs, 
              color: COLOR.text.primary, 
              fontWeight: TYPE.weight.black,
              fontFamily: TYPE.family.mono,
              letterSpacing: TYPE.letterSpacing.caps,
              pointerEvents: 'none'
            }}>
              {content}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
