import React from 'react';
import { COLOR, BORDER, TYPE } from '../../ds/tokens';
import { RotateCcw, Eye, EyeOff, LayoutPanelTop, MonitorPlay } from 'lucide-react';
import { Button } from '../../ds/components/Button';

interface VolSurfaceControlsProps {
  symbolName: string;
  onRefresh: () => void;
  showHV: boolean;
  setShowHV: (v: boolean) => void;
  loading: boolean;
  lastSync: Date | null;
  optionSide: 'CE' | 'PE' | 'BOTH';
  setOptionSide: (v: 'CE' | 'PE' | 'BOTH') => void;
  isWireframe: boolean;
  setIsWireframe: (v: boolean) => void;
  isSmooth: boolean;
  setIsSmooth: (v: boolean) => void;
}

export const VolSurfaceControls: React.FC<VolSurfaceControlsProps> = ({ 
  symbolName, 
  onRefresh, 
  showHV, 
  setShowHV, 
  loading,
  lastSync,
  optionSide,
  setOptionSide,
  isWireframe,
  setIsWireframe,
  isSmooth,
  setIsSmooth
}) => {
  return (
    <div style={{ 
      height: '36px', 
      borderBottom: BORDER.standard, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 12px', 
      background: COLOR.bg.surface,
      userSelect: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MonitorPlay size={14} color={COLOR.semantic.info} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{symbolName}</span>
          <span style={{ fontSize: '11px', color: COLOR.text.muted }}>Volatility Surface (3D)</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {lastSync && (
            <span style={{ fontSize: '9px', color: COLOR.text.muted, fontVariantNumeric: 'tabular-nums' }}>
                {lastSync.toLocaleTimeString()}
            </span>
        )}
        
        <div style={{ height: '16px', width: '1px', background: COLOR.bg.border, margin: '0 4px' }} />

        {/* Option Side Toggle */}
        <div style={{ display: 'flex', background: COLOR.bg.elevated, border: BORDER.standard, borderRadius: '4px', overflow: 'hidden' }}>
            {(['CE', 'PE', 'BOTH'] as const).map(s => (
                <button 
                    key={s} 
                    onClick={() => setOptionSide(s)}
                    style={{ 
                        padding: '2px 8px', 
                        fontSize: '9px', 
                        background: optionSide === s ? COLOR.semantic.info : 'transparent',
                        color: optionSide === s ? '#fff' : COLOR.text.muted,
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {s}
                </button>
            ))}
        </div>

        <div style={{ height: '16px', width: '1px', background: COLOR.bg.border, margin: '0 4px' }} />

        <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => setIsWireframe(!isWireframe)}
            style={{ 
                color: isWireframe ? COLOR.semantic.info : COLOR.text.muted,
                background: isWireframe ? `${COLOR.semantic.info}15` : 'transparent',
                borderColor: isWireframe ? COLOR.semantic.info : 'transparent'
            }}
        >
            <LayoutPanelTop size={12} />
            <span style={{ marginLeft: '4px' }}>WIRE</span>
        </Button>

        <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => setIsSmooth(!isSmooth)}
            style={{ 
                color: isSmooth ? COLOR.semantic.info : COLOR.text.muted,
                background: isSmooth ? `${COLOR.semantic.info}15` : 'transparent',
                borderColor: isSmooth ? COLOR.semantic.info : 'transparent'
            }}
        >
            <MonitorPlay size={12} />
            <span style={{ marginLeft: '4px' }}>SMOOTH</span>
        </Button>

        <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => setShowHV(!showHV)}
            style={{ 
                color: showHV ? COLOR.semantic.info : COLOR.text.muted,
                background: showHV ? `${COLOR.semantic.info}15` : 'transparent',
                borderColor: showHV ? COLOR.semantic.info : 'transparent'
            }}
        >
            {showHV ? <Eye size={12} /> : <EyeOff size={12} />}
            <span style={{ marginLeft: '4px' }}>HV</span>
        </Button>

        <Button 
            variant="ghost" 
            size="xs" 
            onClick={onRefresh}
            disabled={loading}
        >
            <RotateCcw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </Button>

        <div style={{ height: '16px', width: '1px', background: COLOR.bg.border, margin: '0 4px' }} />

        <Button variant="ghost" size="xs" onClick={() => (window as any).dispatchEvent(new Event('RESET_VOL_CAMERA'))}>
            <RotateCcw size={12} />
            <span style={{ marginLeft: '4px' }}>VIEW</span>
        </Button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
