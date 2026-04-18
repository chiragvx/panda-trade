import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BORDER, COLOR, MOTION, SPACE, TYPE, Z } from '../tokens';
import { humanizeLabel } from '../textFormat';

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
  delay = 0.12
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
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.12, ease: 'linear' }}
              style={{
                position: 'fixed', // Fixed is better for viewport-relative clamping
                top: -9999, // Initially hidden while measuring
                left: -9999,
                zIndex: Z.tooltip,
                background: COLOR.bg.overlay,
                border: BORDER.standard,
                padding: `${SPACE[1]} ${SPACE[2]}`,
                borderRadius: '0',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ 
                fontSize: TYPE.size.xs, 
                color: COLOR.text.secondary, 
                fontWeight: TYPE.weight.bold,
                fontFamily: TYPE.family.mono,
                pointerEvents: 'none'
              }}>
                {humanizeLabel(content)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
