import React, { useEffect, useRef, useState } from 'react';
import { useSelectionStore } from '../../store/useStore';
import { COLOR, BORDER } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Button } from '../../ds/components/Button';
import { useLayoutStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';

declare global {
  interface Window {
    TradingView: any;
  }
}

export const ChartWidget: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const { selectedSymbol } = useSelectionStore();
  const { prices } = useUpstoxStore();
  const { openOrderModal } = useLayoutStore();

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
    let tvSymbol = 'NSE:NIFTY';
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
      toolbar_bg: '#0a0a0b',
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      container_id: 'tv_chart_container',
      loading_screen: { backgroundColor: '#0a0a0b' },
      disabled_features: ['header_saveload', 'use_localstorage_for_settings_events'],
      enabled_features: ['side_toolbar_in_compact_mode', 'header_widget_dom_node'],
      overrides: {
        'paneProperties.background': '#0a0a0b',
        'paneProperties.vertGridProperties.color': 'rgba(255, 255, 255, 0.02)',
        'paneProperties.horzGridProperties.color': 'rgba(255, 255, 255, 0.02)',
      }
    });

    return () => {
      widgetRef.current = null;
    };
  }, [selectedSymbol]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0b', overflow: 'hidden' }}>
      {/* Dynamic Header */}
      <div style={{ height: '36px', borderBottom: BORDER.standard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: '#0a0a0b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{selectedSymbol?.ticker || '--'}</span>
          <span style={{ fontSize: '14px', color: '#fff' }}>₹{currentPrice.toFixed(2)}</span>
          <Change value={liveChangePct} format="percent" size="sm" />
          {isIndex && <span style={{ fontSize: '9px', color: COLOR.text.muted, padding: '1px 4px', border: BORDER.standard }}>INDEX</span>}
        </div>

        {!isIndex && selectedSymbol && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="buy" size="xs" onClick={() => openOrderModal('BUY')} style={{ padding: '2px 16px', fontWeight: '900' }}>BUY</Button>
            <Button variant="sell" size="xs" onClick={() => openOrderModal('SELL')} style={{ padding: '2px 16px', fontWeight: '900' }}>SELL</Button>
          </div>
        )}
      </div>

      {/* TradingView Native Container */}
      <div id="tv_chart_container" ref={containerRef} style={{ flex: 1, position: 'relative' }} />
    </div>
  );
};
