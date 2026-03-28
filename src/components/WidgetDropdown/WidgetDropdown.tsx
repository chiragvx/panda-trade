import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  useFloating, autoUpdate, offset, flip, shift,
  useClick, useDismiss, useRole, useInteractions,
  FloatingPortal, FloatingFocusManager
} from '@floating-ui/react';
import autoAnimate from '@formkit/auto-animate';
import { motion, AnimatePresence } from 'framer-motion';
import { WIDGET_REGISTRY } from '../../widgets/registry';
import * as Icons from 'lucide-react';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';

interface WidgetDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  anchorEl: HTMLElement | null;
}

const CATEGORIES = ['All', 'Market Data', 'Account', 'Institutional Intel', 'Charts & Analytics', 'Options', 'Tools', 'Take a Break'];

export const WidgetDropdown: React.FC<WidgetDropdownProps> = ({ isOpen, onOpenChange, anchorEl }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const contentRef = useRef<HTMLDivElement>(null);

  const { x, y, strategy, refs, context } = useFloating({
    open: isOpen,
    onOpenChange,
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate,
    elements: { reference: anchorEl }
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  useEffect(() => {
    if (contentRef.current) {
      autoAnimate(contentRef.current, { duration: 150, easing: 'linear' });
    }
  }, [isOpen]);

  const filteredWidgets = useMemo(() =>
    Object.values(WIDGET_REGISTRY).filter(w => {
      const matchSearch = w.displayName.toLowerCase().includes(search.toLowerCase()) || w.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || w.category === activeCategory;
      return matchSearch && matchCat;
    }), [search, activeCategory]);

  const sections = useMemo(() => {
    const grouped = filteredWidgets.reduce((acc, w) => {
      if (!acc[w.category]) acc[w.category] = [];
      acc[w.category].push(w);
      return acc;
    }, {} as Record<string, typeof filteredWidgets>);
    return Object.entries(grouped);
  }, [filteredWidgets]);

  const addWidget = (id: string, name: string) => {
    (window as any).addNodeToLayout(id, name);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <motion.div
              ref={refs.setFloating}
              initial={{ opacity: 0, scale: 0.98, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -4 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              style={{
                position: strategy, top: y ?? 0, left: x ?? 0,
                width: '440px', zIndex: 10000, pointerEvents: 'auto'
              }}
              {...getFloatingProps()}
            >
              <div style={{
                background: COLOR.bg.overlay, border: BORDER.standard,
                boxShadow: `0 16px 48px rgba(0,0,0,0.8)`,
                display: 'flex', flexDirection: 'column', maxHeight: '480px',
              }}>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '8px', borderBottom: BORDER.standard, background: COLOR.bg.elevated }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '4px 8px' }}>
                        <Icons.Search size={14} color={COLOR.text.muted} />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="SEARCH MODULES..."
                            style={{
                            flex: 1, background: 'transparent', border: 'none',
                            fontFamily: TYPE.family.mono, fontSize: '11px', color: COLOR.text.primary,
                            outline: 'none', caretColor: COLOR.semantic.info,
                            }}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', borderBottom: BORDER.standard, background: COLOR.bg.surface, padding: '2px 4px' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                      padding: '8px 12px', background: 'transparent', border: 'none',
                      borderBottom: activeCategory === cat ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent',
                      fontFamily: TYPE.family.mono, fontSize: '9px', textTransform: 'uppercase', cursor: 'pointer',
                      color: activeCategory === cat ? COLOR.text.primary : COLOR.text.muted,
                      transition: 'color 80ms linear', whiteSpace: 'nowrap'
                    }}>{cat}</button>
                  ))}
                </div>

                {/* Content */}
                <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                  {sections.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
                      <span style={{ fontFamily: TYPE.family.mono, fontSize: '10px', color: COLOR.text.muted }}>NO RESULTS</span>
                    </div>
                  ) : (
                    sections.map(([category, widgets]) => (
                      <div key={category} style={{ marginBottom: '12px' }}>
                        <div style={{
                          fontFamily: TYPE.family.mono, fontSize: '9px', color: COLOR.text.muted,
                          textTransform: 'uppercase', marginBottom: '6px', opacity: 0.6
                        }}>
                          {category}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                          {widgets.map(w => {
                            const Icon = (Icons as any)[w.icon] || Icons.Box;
                            return (
                              <button
                                key={w.id}
                                onClick={() => addWidget(w.id, w.displayName)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  padding: '8px', background: COLOR.bg.surface,
                                  border: BORDER.standard, borderRadius: 0, cursor: 'pointer', textAlign: 'left',
                                  transition: 'background 80ms linear, border-color 80ms linear',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = COLOR.interactive.hover; e.currentTarget.style.borderColor = COLOR.semantic.info; }}
                                onMouseLeave={e => { e.currentTarget.style.background = COLOR.bg.surface; e.currentTarget.style.borderColor = COLOR.bg.border; }}
                              >
                                <Icon size={14} color={COLOR.text.muted} />
                                <span style={{
                                  fontFamily: TYPE.family.mono, fontSize: '11px',
                                  color: COLOR.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {w.displayName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </AnimatePresence>
  );
};
