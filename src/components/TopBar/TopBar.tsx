import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Model } from 'flexlayout-react';
import { motion, useAnimation } from 'framer-motion';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { WidgetDropdown } from '../WidgetDropdown/WidgetDropdown';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Change } from '../../ds/components/Change';
import { Layout as LayoutIcon, Zap, Activity, Clock, ShieldAlert } from 'lucide-react';
import { WorkspaceSelector } from './WorkspaceSelector';
import logoSvg from '../../../svg/Pandatrade.svg';

interface TopBarProps {
  model: Model;
}

const INDEX_ITEMS = [
  { sym: 'NIFTY 50', key: 'NSE_INDEX|Nifty 50' },
  { sym: 'BANK NIFTY', key: 'NSE_INDEX|Nifty Bank' },
  { sym: 'FINNIFTY', key: 'NSE_INDEX|Nifty Fin Service' },
  { sym: 'INDIA VIX', key: 'NSE_INDEX|India VIX' },
  { sym: 'GOLD', key: 'MCX_FO|GOLD24JUNFUT' },
  { sym: 'SILVER', key: 'MCX_FO|SILVER24JULBIT' },
  { sym: 'CRUDE OIL', key: 'MCX_FO|CRUDEOIL24MAYFUT' },
  { sym: 'DOW JONES', key: 'NYSE|DJI' }, // Illustrative if available
];

export const TopBar: React.FC<TopBarProps> = ({ model }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWidgetDropdownOpen, setIsWidgetDropdownOpen] = useState(false);
  const widgetBtnRef = useRef<HTMLButtonElement>(null);

  const { openOrderModal, workspace, setWorkspace } = useLayoutStore();
  const { status, checkTokenValidity, prices, funds, instrumentMeta } = useUpstoxStore();
  const { setSelectedSymbol } = useSelectionStore();
  const controls = useAnimation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    checkTokenValidity();
    return () => clearInterval(timer);
  }, [checkTokenValidity]);

  useEffect(() => {
    controls.start({
      x: ["0%", "-33.33%"],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 35,
          ease: "linear",
        },
      },
    });
  }, [controls]);

  const cell: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 12px',
    borderRight: BORDER.standard,
    height: '100%',
    flexShrink: 0,
  };

  const liveIndices = useMemo(
    () =>
      INDEX_ITEMS.map((item) => {
        const live = prices[item.key];
        return {
          sym: item.sym,
          price: Number(live?.ltp ?? 0),
          pct: Number(live?.pChange ?? 0),
        };
      }),
    [prices]
  );

  const advDec = useMemo(() => {
    const values = Object.values(prices) as Array<{ pChange?: number }>;
    let adv = 0;
    let dec = 0;
    values.forEach((entry) => {
      const pct = Number(entry?.pChange ?? 0);
      if (pct > 0) adv += 1;
      if (pct < 0) dec += 1;
    });
    return { adv, dec };
  }, [prices]);

  const margin = Number(funds?.available_margin ?? 0);

  return (
    <header
      style={{
        height: '80px',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg.elevated,
        borderBottom: BORDER.standard,
        userSelect: 'none',
        position: 'relative',
        zIndex: 1000,
        flexShrink: 0,
      }}
    >
      <div style={{ height: '40px', display: 'flex', alignItems: 'stretch', background: '#000', borderBottom: BORDER.standard, overflow: 'hidden' }}>

        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <motion.div 
            animate={controls}
            drag="x"
            dragConstraints={{ left: -2000, right: 0 }}
            onDragStart={() => controls.stop()}
            onDragEnd={() => {
              controls.start({
                x: ["-33.33%"], // Resume loop
                transition: { repeat: Infinity, repeatType: "loop", duration: 35, ease: "linear" }
              });
            }}
            style={{ display: 'flex', gap: '40px', padding: '0 20px', whiteSpace: 'nowrap', cursor: 'grab' }}
          >
            {[...liveIndices, ...liveIndices, ...liveIndices].map((item, i) => (
              <div 
                key={`${item.sym}-${i}`} 
                onClick={() => {
                  const meta = Object.values(instrumentMeta).find(m => m.ticker === item.sym) || { ticker: item.sym, exchange: item.sym.includes('NIFTY') ? 'NSE' : 'MCX', name: item.sym };
                  setSelectedSymbol({
                    ticker: item.sym,
                    name: meta.name,
                    exchange: meta.exchange,
                    instrument_key: INDEX_ITEMS.find(idx => idx.sym === item.sym)?.key || '',
                    ltp: item.price,
                    change: 0,
                    changePct: item.pct,
                    volume: 0,
                    open: 0, high: 0, low: 0, close: 0
                  });
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: TYPE.family.mono, cursor: 'pointer', padding: '0 4px' }}
              >
                <span style={{ color: COLOR.text.muted, fontSize: '11px', fontWeight: 'bold' }}>{item.sym}</span>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: '900' }}>{item.price.toFixed(2)}</span>
                <Change value={item.pct} format="percent" size="xs" weight="bold" />
              </div>
            ))}
          </motion.div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px', borderLeft: BORDER.standard, background: '#000000' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
            <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: 'bold' }}>ADV/DEC</span>
            <span style={{ fontSize: '13px', color: COLOR.semantic.up, fontWeight: '900' }}>{advDec.adv}</span>
            <span style={{ fontSize: '11px', color: '#666666' }}>/</span>
            <span style={{ fontSize: '13px', color: COLOR.semantic.down, fontWeight: '900' }}>{advDec.dec}</span>
          </div>
        </div>
      </div>

      <div style={{ height: '40px', display: 'flex', alignItems: 'stretch' }}>
        <div style={{ ...cell, background: 'transparent', gap: '6px', borderRight: 'none', padding: '0 16px' }}>
          <img src={logoSvg} alt="PandaTrade" style={{ height: '17px', objectFit: 'contain', opacity: 1 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          <WorkspaceSelector model={model} />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <button
            onClick={() => {
              localStorage.setItem(`opentrader_layout_${workspace}`, JSON.stringify(model.toJson()));
            }}
            style={{
              ...cell,
              background: 'transparent',
              borderLeft: BORDER.standard,
              color: COLOR.semantic.info,
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '900',
              fontFamily: TYPE.family.mono,
              padding: '0 16px',
            }}
          >
            SAVE_VIEW
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('opentrader_layout');
              window.location.reload();
            }}
            style={{
              ...cell,
              background: 'transparent',
              borderLeft: BORDER.standard,
              color: COLOR.text.muted,
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '900',
              fontFamily: TYPE.family.mono,
              padding: '0 16px',
            }}
          >
            RESET_SYS
          </button>
        </div>

        {status === 'expired' && (
          <div style={{ ...cell, background: '#450a0a', borderRight: 'none', cursor: 'pointer' }} onClick={() => setWorkspace('API')}>
            <ShieldAlert size={14} color={COLOR.semantic.down} />
            <span style={{ fontSize: '10px', fontWeight: '900', color: COLOR.semantic.down }}>TOKEN_EXPIRED</span>
          </div>
        )}

        <div style={cell}>
          <div style={{ width: '4px', height: '4px', background: status === 'connected' ? COLOR.semantic.up : COLOR.text.muted }} />
          <span style={{ fontSize: '9px', fontFamily: TYPE.family.mono, color: status === 'connected' ? COLOR.semantic.up : COLOR.text.muted }}>
            {status === 'connected' ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        <div style={cell}>
          <Clock size={12} color={COLOR.text.muted} />
          <span style={{ fontSize: '11px', fontFamily: TYPE.family.mono, color: COLOR.text.secondary }}>
            {currentTime.toLocaleTimeString([], { hour12: false })}
          </span>
        </div>

        <div style={cell}>
          <span style={{ fontSize: '9px', color: COLOR.text.muted }}>FUNDS:</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLOR.text.primary, marginRight: '8px' }}>
            ₹{margin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <button 
            onClick={() => window.open('https://pro.upstox.com/funds/securities/wallet', '_blank')}
            style={{ 
              background: 'transparent', 
              border: `1px solid ${COLOR.semantic.info}`, 
              color: COLOR.semantic.info, 
              fontSize: '8px', 
              fontWeight: 'bold', 
              padding: '2px 6px', 
              cursor: 'pointer',
              fontFamily: TYPE.family.mono
            }}
          >
            ADD_FUNDS
          </button>
        </div>

        <div style={{ ...cell, borderRight: 'none', padding: '0 8px' }}>
          <button
            ref={widgetBtnRef}
            onClick={() => setIsWidgetDropdownOpen((p) => !p)}
            style={{
              background: isWidgetDropdownOpen ? `${COLOR.semantic.info}22` : 'transparent',
              border: `1px solid ${isWidgetDropdownOpen ? COLOR.semantic.info : COLOR.bg.border}`,
              padding: '2px 8px',
              cursor: 'pointer',
              fontFamily: TYPE.family.mono,
              fontSize: '10px',
              color: isWidgetDropdownOpen ? COLOR.semantic.info : COLOR.text.primary,
            }}
          >
            + ADD
          </button>
          <WidgetDropdown isOpen={isWidgetDropdownOpen} onOpenChange={setIsWidgetDropdownOpen} anchorEl={widgetBtnRef.current} />
        </div>
      </div>
    </header>
  );
};
