import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelectionStore, useWatchlistStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import {
  COLOR,
  CommandSurface,
  FieldWrapper,
  KeyBadge,
  LAYOUT,
  OverlayShell,
  SPACE,
  TYPE,
} from '../../ds';
import { ArrowRight, Search, TrendingUp, Zap } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setSelectedSymbol } = useSelectionStore();
  const navigate = useNavigate();
  const { watchlists } = useWatchlistStore();
  const { prices, instrumentMeta } = useUpstoxStore();

  const symbols = useMemo(() => {
    const allKeys = Array.from(new Set(watchlists.flatMap((w) => w.keys)));
    return allKeys.map((key) => buildSymbolFromFeed(key, prices[key], instrumentMeta[key]));
  }, [watchlists, prices, instrumentMeta]);

  const parseCommand = (input: string) => {
    const parts = input.toUpperCase().trim().split(/\s+/);
    const first = parts[0];
    const symbol = symbols.find((s) => s.ticker === first);

    if (parts[1] === '<GO>' || parts[1] === 'GO') {
      if (first.toUpperCase() === 'API') navigate('/api');
      setIsOpen(false);
      return true;
    }

    if (symbol) {
      setSelectedSymbol(symbol);
      setIsOpen(false);
      return true;
    }

    return false;
  };

  const filtered = useMemo(() => {
    if (!query) return symbols.slice(0, 10);
    const q = query.split(' ')[0].toLowerCase();
    return symbols.filter((s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 10);
  }, [symbols, query]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (index: number) => {
    const selected = filtered[index];
    if (!selected) return;
    setSelectedSymbol(selected);
    setIsOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length > 0) setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length > 0) setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      if (parseCommand(query)) return;
      handleSelect(selectedIndex);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <OverlayShell onClick={() => setIsOpen(false)} style={{ alignItems: 'flex-start', paddingTop: '15vh' }}>
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.16, ease: 'linear' }}
            onClick={(e) => e.stopPropagation()}
          >
            <CommandSurface
              width="31.25rem"
              header={
                <div style={{ padding: SPACE[3], display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
                  <FieldWrapper prefix={<Search size={16} color={COLOR.semantic.info} />} suffix={<KeyBadge keys="ESC" />}>
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Search symbols, commands (Ctrl + K)..."
                      style={{
                        width: '100%',
                        height: LAYOUT.filterH,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: COLOR.text.primary,
                        fontFamily: TYPE.family.mono,
                        fontSize: TYPE.size.lg,
                        padding: `0 ${SPACE[3]}`,
                      }}
                    />
                  </FieldWrapper>
                </div>
              }
              footer={
                <div
                  style={{
                    padding: `${SPACE[2]} ${SPACE[3]}`,
                    background: COLOR.bg.elevated,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: SPACE[3],
                  }}
                >
                  <div style={{ display: 'flex', gap: SPACE[3], alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[1] }}>
                      <TrendingUp size={12} color={COLOR.semantic.up} />
                      <span style={{ fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>
                        Live data only
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[1] }}>
                      <Zap size={12} color={COLOR.semantic.info} />
                      <span style={{ fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>
                        Ready
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, display: 'flex', gap: SPACE[3], fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>
                    <span>↑↓ Navigate</span>
                    <span>↵ Select</span>
                  </div>
                </div>
              }
            >
              <div style={{ maxHeight: '25rem', overflowY: 'auto', padding: SPACE[2] }}>
                <div
                  style={{
                    padding: `0 ${SPACE[2]} ${SPACE[2]} ${SPACE[2]}`,
                    fontSize: TYPE.size.xs,
                    color: COLOR.text.muted,
                    fontFamily: TYPE.family.mono,
                    fontWeight: TYPE.weight.bold,
                    letterSpacing: TYPE.letterSpacing.caps,
                  }}
                >
                  Symbols
                </div>
                {filtered.map((s, idx) => {
                  const active = idx === selectedIndex;
                  return (
                    <div
                      key={`${s.instrument_key || s.ticker}-${idx}`}
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '2.25rem',
                        padding: `${SPACE[2]} ${SPACE[3]}`,
                        cursor: 'pointer',
                        background: active ? COLOR.interactive.selected : 'transparent',
                        transition: 'background 80ms linear',
                        boxSizing: 'border-box',
                        borderLeft: active ? `1px solid ${COLOR.semantic.info}` : '1px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], minWidth: 0 }}>
                        <div
                          style={{
                            background: COLOR.bg.surface,
                            border: `1px solid ${COLOR.bg.border}`,
                            padding: `${SPACE[1]} ${SPACE[2]}`,
                            fontFamily: TYPE.family.mono,
                            fontSize: TYPE.size.xs,
                            fontWeight: TYPE.weight.bold,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.ticker || '--'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: TYPE.size.md, color: COLOR.text.primary, fontWeight: TYPE.weight.bold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.name || s.ticker || '--'}
                          </span>
                          <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.exchange} • {s.instrument_key || '--'}
                          </span>
                        </div>
                      </div>
                      {active && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], color: COLOR.semantic.info, flexShrink: 0 }}>
                          <span style={{ fontSize: TYPE.size.xs, fontFamily: TYPE.family.mono, fontWeight: TYPE.weight.bold }}>Select</span>
                          <ArrowRight size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div style={{ padding: SPACE[5], textAlign: 'center', color: COLOR.text.muted, fontSize: TYPE.size.xs }}>No symbols available</div>
                )}
              </div>
            </CommandSurface>
          </motion.div>
        </OverlayShell>
      )}
    </AnimatePresence>
  );
};
