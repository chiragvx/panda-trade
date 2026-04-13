import React, { useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { ShieldCheck, ShieldAlert, Key, Globe, LogIn, ExternalLink, HelpCircle, Lock } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

const UpstoxConnect: React.FC = () => {
    const { apiKey, apiSecret, accessToken, status, isSandbox, setCredentials, logout, toggleSandbox } = useUpstoxStore();
    const [tempKey, setTempKey] = useState(apiKey);
    const [tempSecret, setTempSecret] = useState(apiSecret);
    const [redirectUrl, setRedirectUrl] = useState('https://panda-trade-nine.vercel.app/callback');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setCredentials(tempKey, tempSecret);
        setTimeout(() => setIsSaving(false), 800);
    };

    const handleLogin = () => {
        if (!apiKey) {
            alert('Please save API Key first');
            return;
        }
        const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
        window.location.href = authUrl;
    };

    const statusMap = {
        'connected': { color: COLOR.semantic.up, icon: ShieldCheck, label: 'CONNECTED' },
        'disconnected': { color: COLOR.semantic.down, icon: ShieldAlert, label: 'DISCONNECTED' },
        'expired': { color: COLOR.semantic.warning, icon: ShieldAlert, label: 'SESSION EXPIRED' },
    };

    const config = statusMap[status];

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: COLOR.bg.surface,
        border: BORDER.standard,
        padding: '8px 10px',
        fontSize: TYPE.size.md,
        fontFamily: TYPE.family.mono,
        color: COLOR.text.primary,
        outline: 'none',
        borderRadius: 0,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: TYPE.size.xs,
        fontWeight: TYPE.weight.bold,
        color: COLOR.text.secondary,
        
        letterSpacing: TYPE.letterSpacing.caps,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '6px',
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, padding: SPACE[4], fontFamily: TYPE.family.mono }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE[6] }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted,  letterSpacing: TYPE.letterSpacing.caps, marginBottom: '2px' }}>Broker Configuration</span>
                    <h2 style={{ fontSize: TYPE.size.xl, fontWeight: TYPE.weight.bold, color: COLOR.text.primary, margin: 0 }}>UPSTOX TERMINAL BRIDGE</h2>
                </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '4px 12px', 
                    border: `1px solid ${config.color}40`,
                    background: COLOR.bg.surface,
                    color: config.color,
                    fontSize: TYPE.size.xs,
                    fontWeight: TYPE.weight.bold,
                    letterSpacing: TYPE.letterSpacing.caps
                }}>
                    <config.icon size={12} />
                    {config.label}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: SPACE[6], flex: 1 }}>
                {/* Credentials */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
                    <div>
                        <label style={labelStyle}><Key size={12} /> API KEY</label>
                        <input 
                            type="text" 
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            style={inputStyle}
                            placeholder="Client ID / API Key"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}><Lock size={12} /> API SECRET</label>
                        <input 
                            type="password" 
                            value={tempSecret}
                            onChange={(e) => setTempSecret(e.target.value)}
                            style={inputStyle}
                            placeholder="••••••••••••••••"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}><Globe size={12} /> REDIRECT URL</label>
                        <input 
                            type="text" 
                            value={redirectUrl}
                            onChange={(e) => setRedirectUrl(e.target.value)}
                            style={{ ...inputStyle, color: COLOR.text.muted, fontSize: TYPE.size.xs }}
                        />
                    </div>

                    <div style={{ marginTop: SPACE[2] }}>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{ 
                                width: '100%',
                                height: '32px',
                                background: COLOR.bg.elevated,
                                border: BORDER.standard,
                                color: COLOR.text.primary,
                                fontSize: TYPE.size.xs,
                                fontWeight: TYPE.weight.bold,
                                
                                letterSpacing: TYPE.letterSpacing.wide,
                                cursor: 'pointer',
                                transition: 'all 0.1s'
                            }}
                            className="hover:bg-bg-overlay"
                        >
                            {isSaving ? 'UPDATING...' : 'STORE CREDENTIALS'}
                        </button>
                    </div>
                </div>

                {/* Session Control */}
                <div style={{ 
                    background: COLOR.bg.surface, 
                    border: BORDER.standard, 
                    padding: SPACE[4], 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center'
                }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        border: BORDER.standard, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: SPACE[4],
                        color: COLOR.semantic.info
                    }}>
                        <LogIn size={24} />
                    </div>
                    
                    <div style={{ marginBottom: SPACE[6] }}>
                        <h4 style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: COLOR.text.primary, margin: '0 0 8px 0',  }}>Session Management</h4>
                        <p style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, lineHeight: '1.5', margin: 0, maxWidth: '240px' }}>
                            Auth required every 24h as per SEBI regulations. Ensure API Key is saved before connecting.
                        </p>
                    </div>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
                         <button 
                            onClick={handleLogin}
                            style={{ 
                                width: '100%',
                                height: '40px',
                                background: COLOR.semantic.info,
                                color: COLOR.text.inverse,
                                border: 'none',
                                fontSize: TYPE.size.sm,
                                fontWeight: TYPE.weight.bold,
                                letterSpacing: TYPE.letterSpacing.caps,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                            className="hover:opacity-90"
                        >
                            INITIATE AUTH <ExternalLink size={14} />
                        </button>

                        <button 
                            onClick={() => toggleSandbox(!isSandbox)}
                            style={{ 
                                width: '100%',
                                height: '32px',
                                background: isSandbox ? `${COLOR.semantic.warning}20` : COLOR.bg.elevated,
                                border: isSandbox ? `1px solid ${COLOR.semantic.warning}` : BORDER.standard,
                                color: isSandbox ? COLOR.semantic.warning : COLOR.text.muted,
                                fontSize: TYPE.size.xs,
                                fontWeight: TYPE.weight.bold,
                                cursor: 'pointer',
                                
                            }}
                        >
                            {isSandbox ? 'SANDBOX ACTIVE' : 'SWITCH TO SANDBOX'}
                        </button>

                        {accessToken && (
                            <button 
                                onClick={logout}
                                style={{ 
                                    background: 'none',
                                    border: 'none',
                                    color: COLOR.semantic.down,
                                    fontSize: TYPE.size.xs,
                                    fontWeight: TYPE.weight.bold,
                                    
                                    marginTop: SPACE[4],
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                               Terminate Connection
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: SPACE[4], borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: TYPE.size.xs }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLOR.text.muted }}>
                    <Lock size={10} style={{ color: COLOR.semantic.up }} />
                    SECURE LOCAL DATA STORE
                 </div>
                 <a href="https://account.upstox.com/developer/apps" target="_blank" style={{ color: COLOR.semantic.info, textDecoration: 'none', fontWeight: TYPE.weight.bold }}>
                    API DASHBOARD <ExternalLink size={10} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                 </a>
            </div>
        </div>
    );
};

export default UpstoxConnect;
