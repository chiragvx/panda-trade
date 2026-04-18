import React from 'react';
import { COLOR, TYPE, LAYOUT, SPACE } from '../../ds/tokens';
import { LayoutPanelTop, MonitorPlay } from 'lucide-react';
import { Toolbar } from '../../ds/components/Toolbar';
import { SegmentedControl } from '../../ds/components/SegmentedControl';
import { Divider } from '../../ds/components/Divider';

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

const TOGGLE_STYLE = (active: boolean): React.CSSProperties => ({
  height: '100%',
  padding: `0 ${LAYOUT.cellPadH}`,
  display: 'inline-flex',
  alignItems: 'center',
  gap: SPACE[1],
  fontSize: TYPE.size.xs,
  fontWeight: TYPE.weight.black,
  fontFamily: TYPE.family.mono,
  letterSpacing: TYPE.letterSpacing.caps,
  background: active ? `${COLOR.semantic.info}15` : 'transparent',
  color: active ? COLOR.semantic.info : COLOR.text.muted,
  border: 'none',
  cursor: 'pointer',
});

const OPTION_SIDES = [
  { label: 'CE', value: 'CE' },
  { label: 'PE', value: 'PE' },
  { label: 'BOTH', value: 'BOTH' },
];

export const VolSurfaceControls: React.FC<VolSurfaceControlsProps> = ({
  symbolName,
  lastSync,
  optionSide,
  setOptionSide,
  isWireframe,
  setIsWireframe,
  isSmooth,
  setIsSmooth,
  searchElement,
}) => {
  return (
    <Toolbar stretch>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], padding: `0 ${LAYOUT.cellPadH}`, height: '100%' }}>
        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps }}>
          {symbolName}
        </span>
        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold, letterSpacing: TYPE.letterSpacing.tight }}>
          VOL_SURFACE_3D
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
        {lastSync && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', padding: `0 ${LAYOUT.cellPadH}` }}>
              <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontVariantNumeric: 'tabular-nums', fontWeight: TYPE.weight.black, fontFamily: TYPE.family.mono }}>
                {lastSync.toLocaleTimeString()}
              </span>
            </div>
            <Divider orientation="vertical" />
          </>
        )}

        <SegmentedControl
          options={OPTION_SIDES}
          value={optionSide}
          onChange={(v) => setOptionSide(v as 'CE' | 'PE' | 'BOTH')}
          style={{ border: 'none', background: 'transparent' }}
        />

        <Divider orientation="vertical" />

        <button style={TOGGLE_STYLE(isWireframe)} onClick={() => setIsWireframe(!isWireframe)}>
          <LayoutPanelTop size={12} />
          WIRE
        </button>

        <button style={TOGGLE_STYLE(isSmooth)} onClick={() => setIsSmooth(!isSmooth)}>
          <MonitorPlay size={12} />
          SMOOTH
        </button>

        {searchElement && (
          <>
            <Divider orientation="vertical" />
            <div style={{ width: '200px', display: 'flex', alignItems: 'center', padding: `0 ${LAYOUT.cellPadH}` }}>
              {searchElement}
            </div>
          </>
        )}
      </div>
    </Toolbar>
  );
};
