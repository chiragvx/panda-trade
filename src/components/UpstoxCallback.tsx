import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { upstoxApi } from '../services/upstoxApi';
import { ShieldCheck, Loader2, ShieldAlert } from 'lucide-react';

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
            setErrorMsg('Missing code or credentials. Please retry connection.');
        }
    }, [location]);

    const handleExchange = async (code: string) => {
        try {
            // Wait for 1s to show the cool animation
            await new Promise(r => setTimeout(r, 1000));
            
            const redirectUri = window.location.origin + '/callback';
            const data = await upstoxApi.exchangeCodeForToken(code, apiKey, apiSecret, redirectUri);
            
            if (data.access_token) {
                setToken(data.access_token, Number(data.expires_in || 86400));
                setStatus('success');
                setTimeout(() => navigate('/'), 1500);
            } else {
                throw new Error('Exchange failed: No token received');
            }
        } catch (err: any) {
            console.error('Upstox connection error:', err);
            setStatus('error');
            setErrorMsg(err.response?.data?.message || err.message || 'Unknown integration error');
        }
    };

    return (
        <div className="h-screen w-screen bg-[#050505] flex items-center justify-center">
            <div className="max-w-md w-full p-8 rounded-3xl bg-[#0A0A0A] border border-[#111] shadow-2xl flex flex-col items-center text-center space-y-6">
                
                {status === 'exchanging' && (
                    <>
                        <div className="w-16 h-16 rounded-full border-4 border-[#1A1A1A] border-t-accent-info animate-spin" />
                        <div>
                             <h2 className="text-lg font-black text-white uppercase tracking-widest mb-2 font-mono italic">Authenticating Securely...</h2>
                             <p className="text-[11px] text-text-muted font-medium uppercase tracking-[0.2em]">Exchanging Auth Code with Upstox</p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                            <ShieldCheck size={32} className="text-green-500" />
                        </div>
                        <div>
                             <h2 className="text-lg font-black text-green-500 uppercase tracking-widest mb-2 font-mono italic">Access Granted</h2>
                             <p className="text-[11px] text-text-muted font-medium uppercase tracking-[0.2em]">Session secured. Redirecting to terminal...</p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                            <ShieldAlert size={32} className="text-red-500" />
                        </div>
                        <div>
                             <h2 className="text-lg font-black text-red-500 uppercase tracking-widest mb-2 font-mono italic">Integration Failed</h2>
                             <p className="text-[11px] text-text-muted font-medium uppercase tracking-[0.2em] mb-6">{errorMsg}</p>
                             <button 
                                onClick={() => navigate('/')}
                                className="bg-[#141414] hover:bg-[#1A1A1A] text-white text-[10px] font-black px-6 py-2.5 rounded-lg border border-[#222] uppercase tracking-[0.2em] transition-all"
                             >
                                 Back to Terminal
                             </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default UpstoxCallback;
