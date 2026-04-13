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
          <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, textTransform: 'uppercase', color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps }}>{symbolName}</span>
          <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold, letterSpacing: TYPE.letterSpacing.tight }}>VOL_SURFACE_3D</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {lastSync && (
            <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontVariantNumeric: 'tabular-nums', fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono }}>
                {lastSync.toLocaleTimeString()}
            </span>
        )}
        
        <div style={{ height: '16px', width: '1px', background: COLOR.bg.border, margin: '0 4px' }} />

        {/* Option Side Toggle */}
        <div style={{ display: 'flex', background: COLOR.bg.elevated, border: BORDER.standard, borderRadius: '2px', overflow: 'hidden' }}>
            {(['CE', 'PE', 'BOTH'] as const).map(s => (
                <button 
                    key={s} 
                    onClick={() => setOptionSide(s)}
                    style={{ 
                        padding: '2px 10px', 
                        fontSize: TYPE.size.xs, 
                        fontWeight: TYPE.weight.black,
                        background: optionSide === s ? COLOR.semantic.info : 'transparent',
                        color: optionSide === s ? COLOR.text.inverse : COLOR.text.muted,
                        border: 'none',
                        cursor: 'pointer',
                        letterSpacing: TYPE.letterSpacing.caps
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
                borderColor: isWireframe ? COLOR.semantic.info : 'transparent',
                fontWeight: TYPE.weight.black,
                fontSize: TYPE.size.xs
            }}
        >
            <LayoutPanelTop size={12} />
            <span style={{ marginLeft: '4px', letterSpacing: TYPE.letterSpacing.caps }}>WIRE</span>
        </Button>

        <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => setIsSmooth(!isSmooth)}
            style={{ 
                color: isSmooth ? COLOR.semantic.info : COLOR.text.muted,
                background: isSmooth ? `${COLOR.semantic.info}15` : 'transparent',
                borderColor: isSmooth ? COLOR.semantic.info : 'transparent',
                fontWeight: TYPE.weight.black,
                fontSize: TYPE.size.xs
            }}
        >
            <MonitorPlay size={12} />
            <span style={{ marginLeft: '4px', letterSpacing: TYPE.letterSpacing.caps }}>SMOOTH</span>
        </Button>

        <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => setShowHV(!showHV)}
            style={{ 
                color: showHV ? COLOR.semantic.info : COLOR.text.muted,
                background: showHV ? `${COLOR.semantic.info}15` : 'transparent',
                borderColor: showHV ? COLOR.semantic.info : 'transparent',
                fontWeight: TYPE.weight.black,
                fontSize: TYPE.size.xs
            }}
        >
            {showHV ? <Eye size={12} /> : <EyeOff size={12} />}
            <span style={{ marginLeft: '4px', letterSpacing: TYPE.letterSpacing.caps }}>HV</span>
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

        <Button variant="ghost" size="xs" onClick={() => (window as any).dispatchEvent(new Event('RESET_VOL_CAMERA'))} style={{ fontWeight: TYPE.weight.black, fontSize: TYPE.size.xs }}>
            <RotateCcw size={12} />
            <span style={{ marginLeft: '4px', letterSpacing: TYPE.letterSpacing.caps }}>VIEW</span>
        </Button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
