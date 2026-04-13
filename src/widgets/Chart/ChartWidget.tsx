import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { COLOR, BORDER, TYPE } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { useLayoutStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { isIsin } from '../../utils/liveSymbols';
import { WidgetSymbolSearch } from '../../components/WidgetSearch/WidgetSymbolSearch';
import { RotateCcw } from 'lucide-react';
import { Tooltip } from '../../ds/components/Tooltip';
import { NIFTY_50 } from '../../utils/defaultSymbol';

declare global {
  interface Window {
    TradingView: any;
  }
}

export const ChartWidget: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const { selectedSymbol: globalSymbol } = useSelectionStore();
  const [localSymbol, setLocalSymbol] = useState<any>(null);
  
  const selectedSymbol = localSymbol || globalSymbol || NIFTY_50;
  const { prices, setInstrumentMeta } = useUpstoxStore();
  const { openOrderModal } = useLayoutStore();

  const displayTicker = useMemo(() => {
    if (!selectedSymbol) return '--';
    return isIsin(selectedSymbol.ticker) ? (selectedSymbol.name || 'INSTRUMENT') : selectedSymbol.ticker;
  }, [selectedSymbol]);

  const liveFeed = selectedSymbol?.instrument_key ? prices[selectedSymbol.instrument_key] : undefined;
  const currentPrice = selectedSymbol?.instrument_key
    ? Number(liveFeed?.ltp ?? selectedSymbol?.ltp ?? 0)
    : Number(selectedSymbol?.ltp ?? 0);
  const liveChangePct = Number(liveFeed?.pChange ?? selectedSymbol?.changePct ?? 0);

  const isIndex = selectedSymbol?.instrument_key?.startsWith('NSE_INDEX');

  useEffect(() => {
    if (!containerRef.current || !window.TradingView) return;

    // Mapping Upstox ticker to TV Symbol
    // Upstox: "NSE_EQ|INE062A01020" -> "NSE:RELIANCE"
    let tvSymbol = 'NASDAQ:AAPL';
    if (selectedSymbol) {
      if (selectedSymbol.exchange === 'NSE') {
        tvSymbol = `NSE:${selectedSymbol.ticker}`;
      } else if (selectedSymbol.exchange === 'BSE') {
        tvSymbol = `BSE:${selectedSymbol.ticker}`;
      } else if (selectedSymbol.exchange === 'MCX') {
        tvSymbol = `MCX:${selectedSymbol.ticker}`;
      } else if (isIndex) {
        // Map common indices
        if (selectedSymbol.ticker.includes('Nifty 50')) tvSymbol = 'NSE:NIFTY';
        else if (selectedSymbol.ticker.includes('Bank')) tvSymbol = 'NSE:BANKNIFTY';
        else tvSymbol = `NSE:${selectedSymbol.ticker.split(' ')[0]}`;
      }
    }

    widgetRef.current = new window.TradingView.widget({
      autosize: true,
      symbol: tvSymbol,
      interval: '1',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: COLOR.bg.base,
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      container_id: 'tv_chart_container',
      loading_screen: { backgroundColor: COLOR.bg.base },
      disabled_features: ['header_saveload', 'use_localstorage_for_settings_events'],
      enabled_features: ['side_toolbar_in_compact_mode', 'header_widget_dom_node'],
      overrides: {
        'paneProperties.background': COLOR.bg.base,
        'paneProperties.vertGridProperties.color': 'rgba(255, 255, 255, 0.02)',
        'paneProperties.horzGridProperties.color': 'rgba(255, 255, 255, 0.02)',
      }
    });

    return () => {
      widgetRef.current = null;
    };
  }, [selectedSymbol]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.base, overflow: 'hidden' }}>
      {/* Dynamic Header */}
      <div style={{ height: '36px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: COLOR.bg.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.tight }}>{displayTicker}</span>
          <span style={{ fontSize: TYPE.size.md, color: COLOR.text.primary, fontWeight: TYPE.weight.bold, fontFamily: TYPE.family.mono }}>₹{currentPrice.toFixed(2)}</span>
          <Change value={liveChangePct} format="percent" size="sm" />
          {isIndex && <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.muted, padding: '1px 6px', border: BORDER.standard, fontWeight: TYPE.weight.black, letterSpacing: TYPE.letterSpacing.caps, borderRadius: '2px' }}>INDEX</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WidgetSymbolSearch 
            onSelect={(res) => {
              setLocalSymbol({ instrument_key: res.instrumentKey, ticker: res.ticker, exchange: res.exchange, name: res.name });
              setInstrumentMeta({ [res.instrumentKey]: { ticker: res.ticker, name: res.name, exchange: res.exchange } });
            }} 
            placeholder="SEARCH..." 
          />
          {localSymbol && (
            <Tooltip content="CLEAR_OVERRIDE" position="bottom">
                <button 
                onClick={() => setLocalSymbol(null)}
                style={{ background: 'transparent', border: 'none', color: COLOR.semantic.down, cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center' }}
                >
                <RotateCcw size={14} />
                </button>
            </Tooltip>
          )}

          {!isIndex && selectedSymbol && (
            <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
              <Button variant="buy" size="xs" onClick={() => openOrderModal('BUY')} style={{ padding: '0 12px', height: '24px' }}>BUY</Button>
              <Button variant="sell" size="xs" onClick={() => openOrderModal('SELL')} style={{ padding: '0 12px', height: '24px' }}>SELL</Button>
            </div>
          )}
        </div>
      </div>

      {/* TradingView Native Container */}
      <div id="tv_chart_container" ref={containerRef} style={{ flex: 1, position: 'relative' }} />
    </div>
  );
};
