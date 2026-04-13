import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLOR, TYPE, BORDER, SPACE } from '../ds/tokens';
import { Button } from '../ds/components/Button';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const DisclaimerModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeen = sessionStorage.getItem('panda_disclaimer_seen');
        if (!hasSeen) {
            setIsOpen(true);
        }
    }, []);

    const handleDismiss = () => {
        sessionStorage.setItem('panda_disclaimer_seen', 'true');
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 20000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(4px)',
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{
                            width: '500px',
                            background: COLOR.bg.base,
                            border: `1px solid ${COLOR.semantic.down}80`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            boxShadow: '0 20px 80px rgba(0,0,0,1), 0 0 120px rgba(255,59,87,0.1)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Hazard Strip Marquee */}
                        <div style={{
                            width: '100%',
                            height: '24px',
                            background: COLOR.bg.base,
                            overflow: 'hidden',
                            position: 'relative',
                            borderBottom: BORDER.standard,
                        }}>
                             <motion.div 
                                animate={{ x: [0, -56.57] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                style={{ 
                                    width: 'calc(100% + 60px)', 
                                    height: '100%',
                                    background: `repeating-linear-gradient(45deg, ${COLOR.semantic.warning}, ${COLOR.semantic.warning} 20px, ${COLOR.bg.base} 20px, ${COLOR.bg.base} 40px)`,
                                }}
                             />
                        </div>

                        <div style={{ padding: '40px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: `${COLOR.semantic.down}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px auto',
                                border: `1px solid ${COLOR.semantic.down}30`,
                            }}>
                                <ShieldAlert size={28} color={COLOR.semantic.down} />
                            </div>

                            <h2 style={{
                                fontSize: '18px',
                                fontWeight: '900',
                                color: COLOR.text.primary,
                                letterSpacing: '0.3em',
                                textTransform: 'uppercase',
                                marginBottom: '24px',
                                fontFamily: TYPE.family.mono,
                            }}>
                                TERMINAL DISCLOSURE
                            </h2>

                            <p style={{
                                fontSize: '15px',
                                lineHeight: '1.7',
                                color: COLOR.text.primary,
                                marginBottom: '40px',
                                fontFamily: TYPE.family.mono,
                                letterSpacing: '0.01em',
                                fontWeight: '500',
                            }}>
                                This is not a real trading platform. <span style={{ color: COLOR.semantic.down, fontWeight: '900' }}>Panda Trade is a vibe-coded experiment</span> — 
                                it is not regulated, not audited, and not verified by any security firm. 
                                Treat it accordingly. <span style={{ textDecoration: 'underline' }}>If you don't understand what that means, 
                                close this tab.</span> You have been warned.
                            </p>

                            <Button 
                                variant="ghost" 
                                size="md" 
                                onClick={handleDismiss}
                                style={{ 
                                    width: '100%', 
                                    height: '46px',
                                    border: `1px solid ${COLOR.text.primary}`,
                                    color: COLOR.text.primary,
                                    fontSize: '12px',
                                    fontWeight: '900'
                                }}
                            >
                                I UNDERSTAND
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
