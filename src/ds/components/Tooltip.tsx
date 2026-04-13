import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let t = 0, l = 0;
    
    // Simplistic center-alignment logic for portals
    if (position === 'bottom') {
      t = rect.bottom + scrollY + 8;
      l = rect.left + scrollX + rect.width / 2;
    } else if (position === 'top') {
      t = rect.top + scrollY - 8;
      l = rect.left + scrollX + rect.width / 2;
    } else if (position === 'left') {
      t = rect.top + scrollY + rect.height / 2;
      l = rect.left + scrollX - 8;
    } else if (position === 'right') {
      t = rect.top + scrollY + rect.height / 2;
      l = rect.right + scrollX + 8;
    }

    setCoords({ top: t, left: l });
  };

  const show = () => {
    updateCoords();
    timeoutId.current = setTimeout(() => setIsVisible(true), delay * 1000);
  };

  const hide = () => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    setIsVisible(false);
  };

  const translate = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  };

  return (
    <div 
      ref={containerRef}
      style={{ display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: coords.top,
                left: coords.left,
                transform: translate[position],
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
                fontWeight: TYPE.weight.bold,
                fontFamily: TYPE.family.mono,
                pointerEvents: 'none'
              }}>
                {content}
              </span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
