import React, { useEffect, useRef } from 'react';
import { useContextMenuStore, ContextMenuOption } from '../../store/useContextMenuStore';
import { BORDER, COLOR, MOTION, SPACE, TYPE, Z } from '../../ds/tokens';
import { humanizeLabel } from '../textFormat';

export const ContextMenu: React.FC = () => {
  const { isOpen, x, y, options, closeContextMenu } = useContextMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeContextMenu]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: Z.modalTop,
        background: COLOR.bg.overlay,
        border: BORDER.standard,
        padding: SPACE[1],
        minWidth: '160px',
        borderRadius: 0
      }}
    >
      {options.map((opt: ContextMenuOption, idx: number) => {
        const getColor = () => {
            if (opt.variant === 'danger') return COLOR.semantic.down;
            if (opt.variant === 'primary') return COLOR.semantic.info;
            if (opt.variant === 'info') return COLOR.semantic.info;
            if (opt.variant === 'muted') return COLOR.text.muted;
            return COLOR.text.primary;
        };

        return (
            <button
              key={idx}
              onClick={() => {
                opt.onClick();
                closeContextMenu();
              }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: SPACE[2],
                padding: `${SPACE[2]} ${SPACE[3]}`,
                color: getColor(),
                fontSize: TYPE.size.xs,
                fontWeight: TYPE.weight.bold,
                fontFamily: TYPE.family.mono,
                cursor: 'pointer',
                textAlign: 'left',
                transition: `background ${MOTION.duration.hover} ${MOTION.easing.standard}, color ${MOTION.duration.hover} ${MOTION.easing.standard}`
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = COLOR.interactive.hover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {opt.icon}
              {humanizeLabel(opt.label)}
            </button>
        );
      })}
    </div>
  );
};
