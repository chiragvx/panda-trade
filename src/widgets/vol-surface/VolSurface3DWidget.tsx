import React, { useState, useEffect } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { useVolSurfaceData } from './useVolSurfaceData';
import { VolSurface3DChart } from './VolSurface3DChart';
import { VolSurfaceControls } from './VolSurfaceControls';
import { COLOR, BORDER, TYPE, Button, Tooltip, WidgetShell } from '../../ds';
import { getDisplayTicker } from '../../utils/liveSymbols';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { NIFTY_50 } from '../../utils/defaultSymbol';

import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';

export const VolSurface3DWidget: React.FC = () => {
  const { selectedSymbol: globalSymbol } = useSelectionStore();
  const [localSymbol, setLocalSymbol] = useState<any>(null);
  const { setInstrumentMeta } = useUpstoxStore();
  
  const activeSymbol = localSymbol || globalSymbol || NIFTY_50;
  const { surfaceData, loading, error, hvData, refresh } = useVolSurfaceData(activeSymbol?.instrument_key || '');
  const [showHV, setShowHV] = useState(true);
  const [optionSide, setOptionSide] = useState<'CE' | 'PE' | 'BOTH'>('CE');
  const [isWireframe, setIsWireframe] = useState(false);
  const [isSmooth, setIsSmooth] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (surfaceData.length > 0) {
      setLastSync(new Date());
    }
  }, [surfaceData]);

  const displayName = getDisplayTicker({
    ticker: activeSymbol?.ticker,
    name: activeSymbol?.name,
    instrumentKey: activeSymbol?.instrument_key,
    fallback: 'INDEX',
  });

  return (
    <WidgetShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: COLOR.bg.base, overflow: 'hidden' }}>
        <VolSurfaceControls 
            symbolName={displayName || 'INDEX'} 
            lastSync={lastSync}
            optionSide={optionSide}
            setOptionSide={setOptionSide}
            isWireframe={isWireframe}
            setIsWireframe={setIsWireframe}
            isSmooth={isSmooth}
            setIsSmooth={setIsSmooth}
            searchElement={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <WidgetSymbolSearch 
                            onSelect={(res) => {
                            setLocalSymbol({ instrument_key: res.instrumentKey, ticker: res.ticker, name: res.name, exchange: res.exchange });
                            setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
                            }} 
                            placeholder="LOAD_ASSET..." 
                        />
                    </div>
                    {localSymbol && (
                        <Tooltip content="RESET_OVERRIDE" position="bottom">
                            <button 
                            onClick={() => setLocalSymbol(null)}
                            style={{ 
                                background: 'transparent', border: 'none', color: COLOR.semantic.down, 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0 8px'
                            }}
                            >
                            <RotateCcw size={14} />
                            </button>
                        </Tooltip>
                    )}
                </div>
            }
        />

        <div style={{ flex: 1, position: 'relative' }}>
          {loading && surfaceData.length === 0 ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `${COLOR.bg.base}cc`, gap: '16px' }}>
              <div style={{ width: '120px', height: '2px', background: COLOR.bg.border, position: 'relative', overflow: 'hidden' }}>
                <div 
                  style={{ position: 'absolute', inset: 0, background: COLOR.semantic.info, transform: 'translateX(-100%)', animation: 'progress 1s infinite linear' }}
                />
              </div>
              <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps, fontWeight: TYPE.weight.black }}>GENERATING_3D_SURFACE...</span>
            </div>
          ) : error ? (
             <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COLOR.bg.base, gap: '20px', color: COLOR.semantic.down }}>
                <AlertCircle size={40} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: COLOR.text.primary, fontWeight: TYPE.weight.black, fontSize: TYPE.size.sm, marginBottom: '8px', letterSpacing: TYPE.letterSpacing.caps }}>SURFACE_ERROR</div>
                  <div style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, fontWeight: TYPE.weight.bold }}>{error}</div>
                </div>
                <Button size="sm" onClick={refresh} variant="ghost" style={{ border: BORDER.standard, borderColor: COLOR.semantic.down }}>
                  <RefreshCw size={14} style={{ marginRight: '8px' }} />
                  RETRY LOAD
                </Button>
             </div>
          ) : surfaceData.length === 0 ? (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLOR.text.muted, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps }}>
                NO_OPTION_CHAIN_DETECTED: {displayName}
             </div>
          ) : (
            <>
              <VolSurface3DChart 
                data={surfaceData} 
                hv={hvData} 
                showHV={showHV}
                optionSide={optionSide}
                isWireframe={isWireframe}
                isSmooth={isSmooth}
              />
              {/* IV Legend Overlay */}
              <div style={{ position: 'absolute', bottom: '20px', right: '20px', padding: '12px', background: `${COLOR.bg.overlay}99`, border: BORDER.standard, borderRadius: '2px', display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'none' }}>
                <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.muted, textAlign: 'center', marginBottom: '4px', letterSpacing: TYPE.letterSpacing.caps }}>IV%_RANGE</span>
                <div style={{ width: '12px', height: '100px', background: 'linear-gradient(to top, #3388aa 0%, #33aa33 50%, #3333aa 100%)', border: BORDER.standard }} />
                <div style={{ position: 'absolute', right: '36px', top: '30px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: TYPE.size.xs, color: COLOR.text.primary, fontWeight: TYPE.weight.black, textAlign: 'right', whiteSpace: 'nowrap', fontFamily: TYPE.family.mono }}>
                  <span>80%</span>
                  <span>40%</span>
                  <span>0%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes progress { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
      `}</style>
    </WidgetShell>
  );
};
