import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelectionStore } from '../../store/useStore';
import { useMockSymbols } from '../../mock/hooks';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Search, Command, Zap, ArrowRight, TrendingUp } from 'lucide-react';

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const symbols = useMockSymbols();
    const { setSelectedSymbol } = useSelectionStore();
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = useMemo(() => {
        if (!query) return symbols.slice(0, 8);
        return symbols.filter(s => 
            s.ticker.toLowerCase().includes(query.toLowerCase()) ||
            s.name?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
    }, [symbols, query]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
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
            setQuery('');
        }
    }, [isOpen]);

    const handleSelect = (symbol: any) => {
        setSelectedSymbol(symbol);
        setIsOpen(false);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filtered.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
        } else if (e.key === 'Enter') {
            if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} 
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            width: '500px', background: COLOR.bg.overlay, border: BORDER.standard,
                            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.8)', overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        {/* Search Input */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: BORDER.standard, gap: '12px' }}>
                            <Search size={20} color={COLOR.semantic.info} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Search symbols, commands (Ctrl + K)..."
                                style={{
                                    flex: 1, background: 'transparent', border: 'none',
                                    outline: 'none', color: COLOR.text.primary,
                                    fontFamily: TYPE.family.mono, fontSize: TYPE.size.lg,
                                }}
                            />
                            <div style={{ border: BORDER.standard, padding: '2px 6px', fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>ESC</div>
                        </div>

                        {/* Results */}
                        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
                            <div style={{ padding: '0 8px 8px 8px', fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>SYMBOLS</div>
                            {filtered.map((s, idx) => {
                                const active = idx === selectedIndex;
                                return (
                                    <div 
                                        key={s.ticker}
                                        onClick={() => handleSelect(s)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', cursor: 'pointer',
                                            background: active ? COLOR.interactive.selected : 'transparent',
                                            transition: 'background 80ms linear'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ background: COLOR.bg.border, padding: '4px 8px', fontFamily: TYPE.family.mono, fontSize: '12px', fontWeight: 'bold' }}>{s.ticker}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '13px', color: COLOR.text.primary, fontWeight: 'medium' }}>{s.name || s.ticker}</span>
                                                <span style={{ fontSize: '10px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>{s.exchange} • EQUITY</span>
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
                                <div style={{ padding: '20px', textAlign: 'center', color: COLOR.text.muted, fontSize: '12px' }}>NO RESULTS FOR "{query}"</div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '10px 16px', background: COLOR.bg.elevated, borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <TrendingUp size={12} color={COLOR.semantic.up} />
                                    <span style={{ fontSize: '10px', fontFamily: TYPE.family.mono, color: COLOR.text.muted }}>MARKETS OPEN</span>
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
