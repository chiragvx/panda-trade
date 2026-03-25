import React, { useEffect, useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { Target, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';

const UpstoxGTT: React.FC = () => {
    const { accessToken, status } = useUpstoxStore();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (accessToken && status === 'connected') {
            fetchGTT();
        }
    }, [accessToken, status]);

    const fetchGTT = async () => {
        return;
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLOR.bg.base, overflow: 'hidden', fontFamily: TYPE.family.mono }}>
            
            {/* Connection Status Banner */}
            {status !== 'connected' && (
                <div style={{ 
                    padding: '2px 8px', background: '#450a0a', borderBottom: BORDER.standard,
                    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'
                }}>
                    <AlertCircle size={10} color={COLOR.semantic.down} />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: COLOR.semantic.down, letterSpacing: '0.05em' }}>
                        DISCONNECTED - GTT TRIGGER ENGINE OFFLINE
                    </span>
                </div>
            )}

            <div style={{ padding: '8px 12px', borderBottom: BORDER.standard, background: COLOR.bg.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, color: COLOR.text.primary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    GTT_ENGINE [UPSTOX]
                 </span>
                 <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }} className="hover:text-text-primary">
                        <Plus size={12} />
                    </button>
                    <button onClick={fetchGTT} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }} className={loading ? 'animate-spin' : 'hover:text-text-primary'}>
                        <RefreshCw size={12} />
                    </button>
                 </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLOR.bg.base }}>
                 <div style={{ textAlign: 'center', padding: SPACE[6] }}>
                    <div style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, marginBottom: '8px' }}>Institutional Engine Offline</div>
                    <div style={{ fontSize: '9px', color: COLOR.text.muted, fontStyle: 'italic', maxWidth: '240px' }}>GTT scope requires enhanced API permissions. Enable from Upstox console to activate trigger-based orders.</div>
                 </div>
            </div>
        </div>
    );
};

export default UpstoxGTT;
