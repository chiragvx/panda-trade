import React from 'react';
import { COLOR, BORDER, TYPE } from '../../ds/tokens';
import { LayoutPanelTop, MonitorPlay } from 'lucide-react';
import { Button } from '../../ds/components/Button';

interface VolSurfaceControlsProps {
  symbolName: string;
  lastSync: Date | null;
  optionSide: 'CE' | 'PE' | 'BOTH';
  setOptionSide: (v: 'CE' | 'PE' | 'BOTH') => void;
  isWireframe: boolean;
  setIsWireframe: (v: boolean) => void;
  isSmooth: boolean;
  setIsSmooth: (v: boolean) => void;
  searchElement?: React.ReactNode;
}

export const VolSurfaceControls: React.FC<VolSurfaceControlsProps> = ({ 
  symbolName, 
  lastSync,
  optionSide,
  setOptionSide,
  isWireframe,
  setIsWireframe,
  isSmooth,
  setIsSmooth,
  searchElement
}) => {
  return (
    <div style={{ 
      height: '32px', 
      borderBottom: BORDER.standard, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 12px', 
      background: COLOR.bg.surface,
      userSelect: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black,  color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps }}>{symbolName}</span>
        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold, letterSpacing: TYPE.letterSpacing.tight }}>VOL_SURFACE_3D</span>
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

        {searchElement && (
            <>
               <div style={{ height: '16px', width: '1px', background: COLOR.bg.border, margin: '0 4px' }} />
               <div style={{ width: '200px' }}>
                   {searchElement}
               </div>
            </>
        )}
      </div>
    </div>
  );
};
