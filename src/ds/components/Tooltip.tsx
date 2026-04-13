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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const margin = 8;
    let t = 0, l = 0;
    
    // Initial placement based on position prop
    if (position === 'bottom') {
      t = rect.bottom + scrollY + margin;
      l = rect.left + scrollX + rect.width / 2;
    } else if (position === 'top') {
      t = rect.top + scrollY - margin;
      l = rect.left + scrollX + rect.width / 2;
    } else if (position === 'left') {
      t = rect.top + scrollY + rect.height / 2;
      l = rect.left + scrollX - margin;
    } else if (position === 'right') {
      t = rect.top + scrollY + rect.height / 2;
      l = rect.right + scrollX + margin;
    }

    setCoords({ top: t, left: l });
  };

  useLayoutEffect(() => {
    if (isVisible && tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        
        let newTop = coords.top;
        let newLeft = coords.left;

        // Apply translations logic to initial coords to get real initial rect
        if (position === 'top' || position === 'bottom') {
            newLeft -= tooltipRect.width / 2;
            if (position === 'top') newTop -= tooltipRect.height;
        } else {
            newTop -= tooltipRect.height / 2;
            if (position === 'left') newLeft -= tooltipRect.width;
        }

        // Clamp to viewport
        const buffer = 10;
        newLeft = Math.max(buffer, Math.min(viewportW - tooltipRect.width - buffer, newLeft));
        newTop = Math.max(buffer, Math.min(viewportH - tooltipRect.height - buffer, newTop));

        tooltipRef.current.style.top = `${newTop}px`;
        tooltipRef.current.style.left = `${newLeft}px`;
    }
  }, [isVisible, coords]);

  const show = () => {
    updateCoords();
    timeoutId.current = setTimeout(() => setIsVisible(true), delay * 1000);
  };

  const hide = () => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    setIsVisible(false);
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
              ref={tooltipRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              style={{
                position: 'fixed', // Fixed is better for viewport-relative clamping
                top: -9999, // Initially hidden while measuring
                left: -9999,
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
