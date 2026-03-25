import React, { useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { ShieldCheck, ShieldAlert, Key, Globe, LogIn, ExternalLink, HelpCircle, Lock } from 'lucide-react';

const UpstoxConnect: React.FC = () => {
    const { apiKey, apiSecret, accessToken, status, isSandbox, setCredentials, logout, toggleSandbox } = useUpstoxStore();
    const [tempKey, setTempKey] = useState(apiKey);
    const [tempSecret, setTempSecret] = useState(apiSecret);
    const [redirectUrl, setRedirectUrl] = useState('http://localhost:5173/callback');
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
        // Redirect to Upstox OAuth
        const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
        window.location.href = authUrl;
    };

    const statusMap = {
        'connected': { color: 'text-green-500', icon: ShieldCheck, label: 'CONNECTED' },
        'disconnected': { color: 'text-red-500', icon: ShieldAlert, label: 'DISCONNECTED' },
        'expired': { color: 'text-amber-500', icon: ShieldAlert, label: 'SESSION EXPIRED' },
    };

    const config = statusMap[status];
    const Icon = config.icon;

    return (
        <div className="h-full flex flex-col bg-[#050505] p-5">
            <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Broker Integration</span>
                    <h2 className="text-xl font-black italic text-white leading-none">UPSTOX × OPENTRADER</h2>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[#0A0A0A] ${status === 'connected' ? 'border-green-500/20' : 'border-red-500/20'}`}>
                    <Icon size={14} className={config.color} />
                    <span className={`text-[10px] font-black tracking-widest ${config.color}`}>{config.label}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {/* Credentials Side */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pr-2">
                             <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-2">
                                <Key size={12} /> API KEY
                             </label>
                             <HelpCircle size={12} className="text-text-muted hover:text-white cursor-help" />
                        </div>
                        <input 
                            type="text" 
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-[#1A1A1A] p-3 rounded-lg text-sm font-mono text-white focus:border-accent-info focus:ring-1 focus:ring-accent-info/20 outline-none transition-all placeholder:text-[#222]" 
                            placeholder="Enter Client ID / API Key"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-2">
                            <Lock size={12} /> API SECRET
                        </label>
                        <input 
                            type="password" 
                            value={tempSecret}
                            onChange={(e) => setTempSecret(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-[#1A1A1A] p-3 rounded-lg text-sm font-mono text-white focus:border-accent-info focus:ring-1 focus:ring-accent-info/20 outline-none transition-all" 
                             placeholder="••••••••••••••••"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-2">
                            <Globe size={12} /> REDIRECT URL
                        </label>
                        <input 
                            type="text" 
                            value={redirectUrl}
                            onChange={(e) => setRedirectUrl(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-[#1A1A1A] p-3 rounded-lg text-xs font-mono text-text-muted focus:border-accent-info outline-none transition-all" 
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 bg-white hover:bg-[#EEE] text-black text-[11px] font-black h-10 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? 'UPDATING...' : 'SAVE ENCRYPTED'}
                        </button>
                    </div>
                </div>

                {/* Status/Login Side */}
                <div className="bg-[#0A0A0A] rounded-2xl border border-[#111] p-6 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent-info/20 to-transparent flex items-center justify-center border border-accent-info/30">
                        <LogIn size={28} className="text-accent-info" />
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">DAILY AUTHENTICATION</h4>
                        <p className="text-[11px] text-text-muted font-medium leading-relaxed max-w-[200px]">
                            Connect your session once per day to enable live trading and portfolio monitoring.
                        </p>
                    </div>

                    <div className="w-full space-y-3">
                         <button 
                            onClick={handleLogin}
                            className="w-full bg-accent-info hover:bg-accent-info/90 text-white text-[11px] font-black h-11 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent-info/10"
                        >
                            CONNECT NOW <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <button 
                            onClick={() => toggleSandbox(!isSandbox)}
                            className={`w-full text-[10px] font-black h-9 rounded-lg border transition-all ${isSandbox ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' : 'bg-[#141414] border-[#222] text-text-muted hover:border-[#444] hover:text-white'}`}
                        >
                            {isSandbox ? 'SANDBOX ACTIVE (SAFE MODE)' : 'ENTER SANDBOX MODE'}
                        </button>
                    </div>

                    {accessToken && (
                        <button 
                            onClick={logout}
                            className="text-[10px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest underline decoration-2 underline-offset-4"
                        >
                           Terminate Session
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Help */}
            <div className="mt-8 border-t border-[#111] pt-4 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="bg-green-500/10 p-1.5 rounded-md">
                        <Lock size={12} className="text-green-500" />
                    </div>
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">AES-256 Local Encryption Active</span>
                 </div>
                 <a href="https://account.upstox.com/developer/apps" target="_blank" className="text-[9px] font-black text-accent-info hover:underline flex items-center gap-1 group">
                    OPEN UPSTOX DEVELOPER PORTAL
                    <ExternalLink size={10} />
                 </a>
            </div>
        </div>
    );
};

export default UpstoxConnect;
