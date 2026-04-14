import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { upstoxApi } from '../services/upstoxApi';
import { ShieldCheck, ShieldAlert, Loader2, Lock, ArrowRight, ServerCrash, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLOR, TYPE, SPACE, BORDER } from '../ds/tokens';

const UpstoxCallback: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { apiKey, apiSecret, setToken } = useUpstoxStore();
    const [status, setStatus] = useState<'exchanging' | 'success' | 'error'>('exchanging');
    const [errorMsg, setErrorMsg] = useState('');
    const [debugInfo, setDebugInfo] = useState<{ uri: string; port: string } | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');

        if (code && apiKey && apiSecret) {
            handleExchange(code);
        } else {
            setStatus('error');
            setErrorMsg('Missing authorization code or API credentials. Ensure your API Key and Secret are saved in the dashboard.');
        }
    }, [location]);

    const handleExchange = async (code: string) => {
        try {
            // Smooth reveal
            await new Promise(r => setTimeout(r, 1000));
            
            // CRITICAL: The redirect_uri must EXACTLY match the one sent to the authorize endpoint
            // and the one registered in the Upstox developer dashboard.
            const redirectUri = window.location.origin + window.location.pathname;
            setDebugInfo({ uri: redirectUri, port: window.location.port });

            console.log('[Upstox] Handshake Protocol Initiated', { 
                uri: redirectUri,
                hasKey: !!apiKey,
                hasSecret: !!apiSecret,
                codeLength: code?.length 
            });

            const data = await upstoxApi.exchangeCodeForToken(code, apiKey, apiSecret, redirectUri);
            
            if (data.access_token) {
                setToken(data.access_token, Number(data.expires_in || 86400));
                setStatus('success');
                setTimeout(() => navigate('/app'), 2000);
            } else {
                throw new Error(data.message || 'AUTHENTICATION_CREDENTIAL_MISMATCH');
            }
        } catch (err: any) {
            console.error('[Upstox] HANDSHAKE_FAULT:', err.response?.data || err.message);
            setStatus('error');
            
            const rawError = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
            setErrorMsg(rawError === 'invalid_grant' ? 'INVALID_OR_EXPIRED_CODE: The authorization code has already been used or has expired.' : rawError);
        }
    };

    return (
        <div 
            className="h-screen w-screen flex items-center justify-center p-6 relative overflow-hidden"
            style={{ background: `radial-gradient(circle at center, #0B0B0C 0%, #000000 100%)` }}
        >
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: `linear-gradient(${COLOR.bg.border} 1px, transparent 1px), linear-gradient(90deg, ${COLOR.bg.border} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full relative z-10"
            >
                <div 
                    className="p-10 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-8"
                    style={{ background: 'rgba(10, 10, 12, 0.9)' }}
                >
                    <AnimatePresence mode="wait">
                        {status === 'exchanging' && (
                            <motion.div key="exchanging" className="flex flex-col items-center space-y-6">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-2 border-accent-info/20 flex items-center justify-center">
                                        <Lock size={28} className="text-accent-info animate-pulse" />
                                    </div>
                                    <div className="absolute inset-0 w-16 h-16 rounded-full border-t-2 border-accent-info animate-spin" />
                                </div>
                                <div className="space-y-1">
                                    <Text variant="heading" size="sm" weight="black" block color="primary">TOKEN_EXCHANGE</Text>
                                    <Text size="xs" color="muted" weight="bold" block uppercase tracking="widest">Negotiating secure session...</Text>
                                </div>
                            </motion.div>
                        )}

                        {status === 'success' && (
                            <motion.div key="success" className="flex flex-col items-center space-y-6">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                    <ShieldCheck size={32} className="text-green-500" />
                                </div>
                                <div className="space-y-1">
                                    <Text variant="heading" size="sm" weight="black" block color="primary">ACCESS_GRANTED</Text>
                                    <Text size="xs" color="muted" weight="bold" block uppercase tracking="widest">Redirecting to terminal...</Text>
                                </div>
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div key="error" className="flex flex-col items-center space-y-6">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <ServerCrash size={32} className="text-red-500" />
                                </div>
                                <div className="space-y-4">
                                    <Text variant="heading" size="sm" weight="black" block color="down">HANDSHAKE_FAILED</Text>
                                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                                        <Text size="xs" color="muted" family="mono" block>{errorMsg}</Text>
                                    </div>
                                    
                                    {debugInfo && debugInfo.port !== '5173' && (
                                        <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                                            <AlertCircle size={14} className="text-yellow-500 shrink-0" />
                                            <Text size="xs" color="primary" weight="bold" style={{ textAlign: 'left' }}>
                                                PORT_MISMATCH: Detected port {debugInfo.port}. If your app is registered on 5173, exchange will fail.
                                            </Text>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => navigate('/api')}
                                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                                >
                                    <Text size="xs" weight="black" color="primary">RECONFIGURE_API</Text>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="mt-6 flex items-center justify-center gap-4 opacity-20">
                    <Globe size={10} color={COLOR.text.primary} />
                    <span className="text-[8px] font-mono text-white tracking-[0.4em] uppercase">UPSTOX_OAUTH_v2_TLS_1.3</span>
                </div>
            </motion.div>
        </div>
    );
};

export default UpstoxCallback;
