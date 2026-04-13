import React, { useEffect, useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { Plus, RefreshCw, Target } from 'lucide-react';
import { COLOR, TYPE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { StatusBanner } from '../../ds/components/StatusBanner';
import { EmptyState } from '../../ds/components/EmptyState';

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
        <WidgetShell>
            {status !== 'connected' && (
                <StatusBanner 
                    variant="disconnected" 
                    message="DISCONNECTED - GTT TRIGGER ENGINE OFFLINE" 
                />
            )}

            <WidgetShell.Toolbar>
                 <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold,  letterSpacing: TYPE.letterSpacing.caps, display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            </WidgetShell.Toolbar>

            <EmptyState 
                icon={<Target size={32} />} 
                message="Institutional Engine Offline" 
                subMessage="GTT scope requires enhanced API permissions. Enable from Upstox console to activate trigger-based orders."
            />
        </WidgetShell>
    );
};

export default UpstoxGTT;

