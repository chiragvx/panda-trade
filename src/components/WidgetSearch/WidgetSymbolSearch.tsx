import React, { useState, useEffect } from 'react';
import { Search, X, BadgeInfo } from 'lucide-react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxSearch, UpstoxSearchResult } from '../../services/upstoxSearch';
import { COLOR, TYPE, BORDER, Tooltip } from '../../ds';
import { motion, AnimatePresence } from 'framer-motion';

interface WidgetSymbolSearchProps {
    onSelect: (result: UpstoxSearchResult) => void;
    placeholder?: string;
}

export const WidgetSymbolSearch: React.FC<WidgetSymbolSearchProps> = ({ onSelect, placeholder = "SEARCH..." }) => {
    const { accessToken } = useUpstoxStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UpstoxSearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!query.trim() || !accessToken || query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const hits = await upstoxSearch.searchSymbols(accessToken, query);
                setResults(hits);
                setIsOpen(hits.length > 0);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, accessToken]);

    return (
        <div style={{ position: 'relative', width: '200px' }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: COLOR.bg.elevated, 
                border: BORDER.standard, 
                height: '24px', 
                padding: '0 8px', 
                gap: '8px',
                borderRadius: '2px'
            }}>
                <Search size={12} color={COLOR.text.muted} />
                <input 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(results.length > 0)}
                    placeholder={placeholder}
                    style={{ 
                        flex: 1, 
                        background: 'transparent', 
                        border: 'none', 
                        color: COLOR.text.primary, 
                        fontSize: TYPE.size.xs, 
                        outline: 'none', 
                        fontFamily: TYPE.family.mono,
                        fontWeight: TYPE.weight.bold,
                        letterSpacing: TYPE.letterSpacing.caps
                    }}
                />
                {query && (
                    <Tooltip content="CLEAR_SEARCH" position="right">
                        <X size={10} color={COLOR.text.muted} onClick={() => setQuery('')} style={{ cursor: 'pointer' }} />
                    </Tooltip>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }} 
                        style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: 0, 
                            minWidth: '280px', 
                            background: COLOR.bg.overlay, 
                            border: BORDER.standard, 
                            zIndex: 1000, 
                            maxHeight: '300px', 
                            overflowY: 'auto',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
                            marginTop: '6px',
                            backdropFilter: 'blur(12px)'
                        }}
                        className="custom-scrollbar"
                    >
                        {results.length === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
                                <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>NO_RESULTS</span>
                            </div>
                        ) : (
                            results.map((res) => (
                                <div 
                                    key={res.instrumentKey} 
                                    onClick={() => {
                                        onSelect(res);
                                        setQuery('');
                                        setIsOpen(false);
                                    }} 
                                    style={{ 
                                        padding: '6px 10px', 
                                        borderBottom: '1px solid #111', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center' 
                                    }} 
                                    className="hover:bg-zinc-900"
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, fontFamily: TYPE.family.mono, letterSpacing: TYPE.letterSpacing.caps }}>{res.ticker}</span>
                                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold, opacity: 0.8, letterSpacing: TYPE.letterSpacing.caps }}>{res.exchange}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
