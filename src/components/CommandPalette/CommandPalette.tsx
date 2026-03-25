import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelectionStore, useLayoutStore, useWatchlistStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { buildSymbolFromFeed } from '../../utils/liveSymbols';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Search, Zap, ArrowRight, TrendingUp } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setSelectedSymbol } = useSelectionStore();
  const { setWorkspace } = useLayoutStore();
  const { watchlists } = useWatchlistStore();
  const { prices, instrumentMeta } = useUpstoxStore();

  const symbols = useMemo(() => {
    const allKeys = Array.from(new Set(watchlists.flatMap(w => w.keys)));
    return allKeys.map((key) => buildSymbolFromFeed(key, prices[key], instrumentMeta[key]));
  }, [watchlists, prices, instrumentMeta]);

  const parseCommand = (input: string) => {
    const parts = input.toUpperCase().trim().split(/\s+/);
    const first = parts[0];
    const symbol = symbols.find((s) => s.ticker === first);

    if (parts[1] === '<GO>' || parts[1] === 'GO') {
      const target = first.toUpperCase();
      if (target === 'CASUAL') setWorkspace('CASUAL');
      if (target === 'OPTIONS' || target === 'OPT' || target === 'DERIVATIVES') setWorkspace('OPTIONS');
      if (target === 'RESEARCH' || target === 'RES' || target === 'ANALYSIS') setWorkspace('RESEARCH');
      if (target === 'PM' || target === 'PORTFOLIO') setWorkspace('PM');
      if (target === 'QUANT' || target === 'QNT') setWorkspace('QUANT');
      if (target === 'CHART' || target === 'CHT') setWorkspace('CHART');
      if (target === 'PSYCHO') setWorkspace('PSYCHO');
      if (target === 'API') setWorkspace('API');
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
    return symbols
      .filter((s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 10);
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              width: '500px',
              background: COLOR.bg.overlay,
              border: BORDER.standard,
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.8)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: BORDER.standard, gap: '12px' }}>
              <Search size={20} color={COLOR.semantic.info} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search symbols, commands (Ctrl + K)..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: COLOR.text.primary,
                  fontFamily: TYPE.family.mono,
                  fontSize: TYPE.size.lg,
                }}
              />
              <div style={{ border: BORDER.standard, padding: '2px 6px', fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>ESC</div>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
              <div style={{ padding: '0 8px 8px 8px', fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>SYMBOLS</div>
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
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: active ? COLOR.interactive.selected : 'transparent',
                      transition: 'background 80ms linear',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: COLOR.bg.border, padding: '4px 8px', fontFamily: TYPE.family.mono, fontSize: '12px', fontWeight: 'bold' }}>{s.ticker || '--'}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', color: COLOR.text.primary, fontWeight: 'medium' }}>{s.name || s.ticker || '--'}</span>
                        <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>{s.exchange} • {s.instrument_key || '--'}</span>
                      </div>
                    </div>
                    {active && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLOR.semantic.info }}>
                        <span style={{ fontSize: '10px', fontFamily: TYPE.family.mono }}>SELECT</span>
                        <ArrowRight size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: COLOR.text.muted, fontSize: '12px' }}>NO SYMBOLS AVAILABLE</div>
              )}
            </div>

            <div style={{ padding: '10px 16px', background: COLOR.bg.elevated, borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={12} color={COLOR.semantic.up} />
                  <span style={{ fontSize: '10px', fontFamily: TYPE.family.mono, color: COLOR.text.muted }}>LIVE DATA ONLY</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} color={COLOR.semantic.info} />
                  <span style={{ fontSize: '10px', fontFamily: TYPE.family.mono, color: COLOR.text.muted }}>READY</span>
                </div>
              </div>
              <div style={{ fontSize: '10px', color: COLOR.text.muted, display: 'flex', gap: '10px' }}>
                <span>↑↓ NAVIGATE</span>
                <span>↵ ENTER</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
