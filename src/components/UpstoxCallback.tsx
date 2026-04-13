import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { upstoxApi } from '../services/upstoxApi';
import { ShieldCheck, ShieldAlert, Loader2, Lock, ArrowRight, ServerCrash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLOR, TYPE, SPACE, BORDER } from '../ds/tokens';

const UpstoxCallback: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { apiKey, apiSecret, setToken } = useUpstoxStore();
    const [status, setStatus] = useState<'exchanging' | 'success' | 'error'>('exchanging');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');

        if (code && apiKey && apiSecret) {
            handleExchange(code);
        } else {
            setStatus('error');
            setErrorMsg('Missing authorization code or API credentials. Please restart the connection process from the API Dashboard.');
        }
    }, [location]);

    const handleExchange = async (code: string) => {
        try {
            // Initial delay for smooth transition
            await new Promise(r => setTimeout(r, 1200));
            
            const redirectUri = window.location.origin + window.location.pathname;
            const data = await upstoxApi.exchangeCodeForToken(code, apiKey, apiSecret, redirectUri);
            
            if (data.access_token) {
                setToken(data.access_token, Number(data.expires_in || 86400));
                setStatus('success');
                setTimeout(() => navigate('/'), 2000);
            } else {
                throw new Error(data.message || 'Token exchange failed: No access token received');
            }
        } catch (err: any) {
            console.error('Upstox Handshake Error:', err);
            setStatus('error');
            setErrorMsg(err.response?.data?.message || err.message || 'Failed to establish secure connection with Upstox API.');
        }
    };

    return (
        <div 
            className="h-screen w-screen flex items-center justify-center p-6 relative overflow-hidden"
            style={{ background: `radial-gradient(circle at center, #0F0F0F 0%, #000000 100%)` }}
        >
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-accent-info/10 blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent-info/5 blur-[120px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-md w-full relative z-10"
            >
                <div 
                    className="p-10 rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col items-center text-center space-y-8"
                    style={{ background: 'rgba(5, 5, 5, 0.8)' }}
                >
                    <AnimatePresence mode="wait">
                        {status === 'exchanging' && (
                            <motion.div 
                                key="exchanging"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center space-y-6"
                            >
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-2 border-white/5 flex items-center justify-center">
                                        <Lock size={32} className="text-accent-info animate-pulse" />
                                    </div>
                                    <div className="absolute inset-0 w-20 h-20 rounded-full border-t-2 border-accent-info animate-spin" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-white tracking-widest font-mono italic uppercase">
                                        Secure Handshake
                                    </h2>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.3em] leading-relaxed">
                                        Validating API Credentials &<br/>Establishing Encrypted Session
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {status === 'success' && (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center space-y-6"
                            >
                                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                                    <ShieldCheck size={40} className="text-green-500" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-green-500 tracking-widest font-mono italic uppercase">
                                        Access Granted
                                    </h2>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.3em] leading-relaxed">
                                        Identity Verified. Initializing<br/>Terminal Systems.
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-[10px] text-green-500/60 font-mono font-bold uppercase tracking-widest animate-pulse">
                                    Redirecting <ArrowRight size={10} />
                                </div>
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div 
                                key="error"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center space-y-6"
                            >
                                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                                    <ServerCrash size={40} className="text-red-500" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-red-500 tracking-widest font-mono italic uppercase">
                                        Handshake Failed
                                    </h2>
                                    <p className="text-[11px] text-text-muted font-medium px-4">
                                        {errorMsg}
                                    </p>
                                </div>

                                <button 
                                    onClick={() => navigate('/')}
                                    className="group relative mt-4 px-8 py-3 bg-[#0A0A0A] overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
                                >
                                    <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <span className="relative text-[10px] font-black text-white uppercase tracking-[0.25em]">
                                        Back to Terminal
                                    </span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Footer Metadata */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 select-none">
                    <div className="h-[1px] w-12 bg-white" />
                    <span className="text-[8px] font-mono text-white tracking-[0.4em] uppercase">Secure_OAuth_v2.0</span>
                    <div className="h-[1px] w-12 bg-white" />
                </div>
            </motion.div>
        </div>
    );
};

export default UpstoxCallback;
