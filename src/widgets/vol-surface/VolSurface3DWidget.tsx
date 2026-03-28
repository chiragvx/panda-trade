import React, { useState, useEffect } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { useVolSurfaceData } from './useVolSurfaceData';
import { VolSurface3DChart } from './VolSurface3DChart';
import { VolSurfaceControls } from './VolSurfaceControls';
import { COLOR, BORDER, TYPE } from '../../ds/tokens';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../ds/components/Button';
import { isIsin } from '../../utils/liveSymbols';

export const VolSurface3DWidget: React.FC = () => {
  const { selectedSymbol } = useSelectionStore();
  const { surfaceData, loading, error, hvData, refresh } = useVolSurfaceData(selectedSymbol?.instrument_key || '');
  const [showHV, setShowHV] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (surfaceData.length > 0) {
      setLastSync(new Date());
    }
  }, [surfaceData]);

  const displayName = isIsin(selectedSymbol?.ticker || '') ? selectedSymbol?.name : selectedSymbol?.ticker;

  if (!selectedSymbol) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLOR.text.muted, fontSize: '12px' }}>
        SELECT SYMBOL TO VIEW SURFACE
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', overflow: 'hidden' }}>
      <VolSurfaceControls 
        symbolName={displayName || 'INDEX'} 
        onRefresh={refresh} 
        showHV={showHV} 
        setShowHV={setShowHV} 
        loading={loading}
        lastSync={lastSync}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        {loading && surfaceData.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', gap: '16px' }}>
            <div style={{ width: '120px', height: '2px', background: COLOR.bg.border, position: 'relative', overflow: 'hidden' }}>
              <div 
                style={{ position: 'absolute', inset: 0, background: COLOR.semantic.info, transform: 'translateX(-100%)', animation: 'progress 1s infinite linear' }}
              />
            </div>
            <span style={{ fontSize: '10px', color: COLOR.text.muted, letterSpacing: '0.1em' }}>GENERATING 3D SURFACE...</span>
          </div>
        ) : error ? (
           <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', gap: '20px', color: COLOR.semantic.down }}>
              <AlertCircle size={40} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>SURFACE ERROR</div>
                <div style={{ fontSize: '11px', color: COLOR.text.muted }}>{error}</div>
              </div>
              <Button size="sm" onClick={refresh} variant="ghost" style={{ border: BORDER.standard, borderColor: COLOR.semantic.down }}>
                <RefreshCw size={14} style={{ marginRight: '8px' }} />
                RETRY LOAD
              </Button>
           </div>
        ) : surfaceData.length === 0 ? (
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLOR.text.muted, fontSize: '11px' }}>
              NO OPTION CHAIN DATA FOR {selectedSymbol.ticker}
           </div>
        ) : (
          <VolSurface3DChart data={surfaceData} hv={hvData} showHV={showHV} />
        )}
      </div>

      <style>{`
        @keyframes progress { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};
