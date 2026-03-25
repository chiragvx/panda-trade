import React, { useEffect, useRef } from 'react';
import { useContextMenuStore, ContextMenuOption } from '../../store/useContextMenuStore';
import { COLOR, TYPE } from '../../ds/tokens';

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
        zIndex: 100000,
        background: '#0D0D0D',
        border: `1px solid #222222`,
        padding: '4px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
        minWidth: '160px',
        borderRadius: '2px'
      }}
    >
      {options.map((opt: ContextMenuOption, idx: number) => {
        const getColor = () => {
            if (opt.variant === 'danger') return '#f43f5e';
            if (opt.variant === 'primary') return '#FF7722';
            if (opt.variant === 'info') return '#3b82f6';
            if (opt.variant === 'muted') return '#666';
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
                gap: '8px',
                padding: '8px 12px',
                color: getColor(),
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: TYPE.family.mono,
                cursor: 'pointer',
                textAlign: 'left',
                textTransform: 'uppercase',
                transition: 'background 0.1s linear'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FFFFFF0A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {opt.icon}
              {opt.label}
            </button>
        );
      })}
    </div>
  );
};
