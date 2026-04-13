import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Zap } from 'lucide-react';
import { ApiDashboard } from './ApiDashboard';
import { COLOR, TYPE, BORDER } from '../ds/tokens';

export const ApiPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: COLOR.bg.base,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <header style={{
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                borderBottom: `1px solid ${COLOR.bg.border}`,
                background: COLOR.bg.secondary,
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/app')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: COLOR.text.secondary,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '10px',
                            fontWeight: '900',
                            fontFamily: TYPE.family.mono,
                            padding: '4px 12px',
                            borderRadius: '2px',
                            border: `1px solid ${COLOR.bg.border}`,
                            transition: 'all 0.1s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = COLOR.text.primary;
                            e.currentTarget.style.borderColor = COLOR.semantic.info;
                            e.currentTarget.style.background = `${COLOR.semantic.info}11`;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = COLOR.text.secondary;
                            e.currentTarget.style.borderColor = COLOR.bg.border;
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <ArrowLeft size={14} />
                        <span>RETURN_TO_TERMINAL</span>
                    </button>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '2px 8px',
                        background: '#ffffff05',
                        border: `1px solid ${COLOR.bg.border}`,
                        borderRadius: '2px'
                    }}>
                        <Zap size={12} color={COLOR.semantic.info} />
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>SYSTEM_READY_V3</span>
                    </div>
                    <div style={{
                        fontSize: '10px',
                        fontWeight: '900',
                        letterSpacing: '0.15em',
                        color: COLOR.text.primary,
                        fontFamily: TYPE.family.mono
                    }}>
                        CONNECTIVITY_DASHBOARD
                    </div>
                </div>

                <div style={{ width: '140px', display: 'flex', justifyContent: 'flex-end' }}>
                     <span style={{ fontSize: '9px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>v4.6.2_STABLE</span>
                </div>
            </header>

            <main style={{ flex: 1, overflow: 'auto' }}>
                <ApiDashboard />
            </main>
            
            <footer style={{
                height: '24px',
                background: COLOR.bg.secondary,
                borderTop: `1px solid ${COLOR.bg.border}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ fontSize: '8px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>ENDPOINT: https://api.upstox.com/v2</span>
                    <span style={{ fontSize: '8px', color: COLOR.text.muted, fontFamily: TYPE.family.mono }}>SOCKET: wss://smartapi.upstox.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLOR.semantic.up }} />
                     <span style={{ fontSize: '8px', fontWeight: 'bold', color: COLOR.text.secondary, fontFamily: TYPE.family.mono }}>DATA_INTEGRITY_VERIFIED</span>
                </div>
            </footer>
        </div>
    );
};
