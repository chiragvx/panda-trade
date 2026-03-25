import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { COLOR, TYPE, BORDER } from '../ds/tokens';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type: Toast['type']) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        // Auto-dismiss after 4 seconds
        setTimeout(() => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })), 4000);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

const TYPE_COLOR: Record<string, string> = {
    success: COLOR.semantic.up,
    error:   COLOR.semantic.down,
    info:    COLOR.semantic.info,
};

const TYPE_PREFIX: Record<string, string> = {
    success: 'EXEC',
    error:   'ERR',
    info:    'INFO',
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div style={{
            position: 'fixed', bottom: '16px', right: '16px',
            zIndex: 2000, display: 'flex', flexDirection: 'column',
            alignItems: 'flex-end', gap: '4px', pointerEvents: 'none',
        }}>
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.12, ease: 'easeOut' }}
                        style={{ pointerEvents: 'auto', willChange: 'transform, opacity' }}
                    >
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '6px 10px', minWidth: '280px',
                            background: COLOR.bg.overlay,
                            border: `1px solid ${TYPE_COLOR[toast.type]}`,
                            borderLeft: `3px solid ${TYPE_COLOR[toast.type]}`,
                        }}>
                            <span style={{
                                fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs,
                                color: TYPE_COLOR[toast.type], letterSpacing: TYPE.letterSpacing.caps,
                                flexShrink: 0,
                            }}>
                                [{TYPE_PREFIX[toast.type]}]
                            </span>
                            <span style={{
                                flex: 1, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm,
                                color: COLOR.text.primary, overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {toast.message}
                            </span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs,
                                    color: COLOR.text.muted, padding: '0 2px', flexShrink: 0,
                                    transition: 'color 80ms linear',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = COLOR.text.primary)}
                                onMouseLeave={e => (e.currentTarget.style.color = COLOR.text.muted)}
                            >
                                ×
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
