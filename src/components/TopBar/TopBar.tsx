import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Model } from 'flexlayout-react';
import { motion, useAnimation } from 'framer-motion';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { WidgetDropdown } from '../WidgetDropdown/WidgetDropdown';
import { COLOR, TYPE, BORDER, Text, Tooltip } from '../../ds';
import { Change } from '../../ds/components/Change';
import { Layout as LayoutIcon, Zap, Activity, Clock, ShieldAlert, Settings, Save, RotateCcw, Wallet, Plus, PlusSquare, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoSvg from '../../../svg/Pandatrade.svg';
import { useContextMenuStore } from '../../store/useContextMenuStore';

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
  { sym: 'DOW JONES', key: 'NYSE|DJI' }, 
];

export const TopBar: React.FC<TopBarProps> = ({ model }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWidgetDropdownOpen, setIsWidgetDropdownOpen] = useState(false);
  const widgetBtnRef = useRef<HTMLButtonElement>(null);

  const { status, checkTokenValidity, prices, funds, instrumentMeta } = useUpstoxStore();
  const { setSelectedSymbol } = useSelectionStore();
  const controls = useAnimation();
  const navigate = useNavigate();

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

  const margin = Number(funds?.available_margin ?? 0);

  return (
    <header
      style={{
        height: '40px',
        display: 'flex',
        alignItems: 'stretch',
        background: COLOR.bg.base,
        borderBottom: BORDER.standard,
        userSelect: 'none',
        position: 'relative',
        zIndex: 1000,
        flexShrink: 0,
      }}
    >
        <div style={{ ...cell, background: 'transparent', gap: '6px', borderRight: BORDER.standard, padding: '0 16px' }}>
          <img src={logoSvg} alt="PandaTrade" style={{ height: '17px', objectFit: 'contain', opacity: 1 }} />
        </div>

        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <motion.div 
            animate={controls}
            drag="x"
            dragConstraints={{ left: -2000, right: 0 }}
            onDragStart={() => controls.stop()}
            onDragEnd={() => {
              controls.start({
                x: ["-33.33%"], 
                transition: { repeat: Infinity, repeatType: "loop", duration: 35, ease: "linear" }
              });
            }}
            style={{ display: 'flex', gap: '32px', padding: '0 20px', whiteSpace: 'nowrap', cursor: 'grab' }}
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
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: TYPE.family.mono, cursor: 'pointer' }}
              >
                <Text size="xs" color="muted" weight="black">{item.sym}</Text>
                <Text size="xs" weight="black" color="primary">{item.price.toFixed(2)}</Text>
                <Change value={item.pct} format="percent" size="xs" weight="black" />
              </div>
            ))}
          </motion.div>
        </div>

        {status === 'expired' && (
          <div style={{ ...cell, background: `${COLOR.semantic.down}22`, borderRight: 'none', borderLeft: BORDER.standard, cursor: 'pointer' }} onClick={() => navigate('/api')}>
            <ShieldAlert size={14} color={COLOR.semantic.down} />
            <Text size="xs" color="down" weight="black">TOKEN_EXPIRED</Text>
          </div>
        )}

        <div style={{ ...cell, borderLeft: BORDER.standard }}>
          <div style={{ width: '4px', height: '4px', background: status === 'connected' ? COLOR.semantic.up : COLOR.text.muted }} />
          <Text size="xs" color={status === 'connected' ? 'up' : 'muted'} weight="black" family="mono">
            {status === 'connected' ? 'LIVE' : 'OFFLINE'}
          </Text>
        </div>

        <div style={cell}>
          <Clock size={12} color={COLOR.text.muted} />
          <span style={{ fontSize: '11px', fontFamily: TYPE.family.mono, color: COLOR.text.secondary }}>
            {currentTime.toLocaleTimeString([], { hour12: false })}
          </span>
        </div>

        <div style={cell}>
          <Text size="xs" color="muted" weight="bold" style={{ marginRight: '4px' }}>FUNDS:</Text>
          <Text size="sm" weight="black" color="primary" style={{ marginRight: '8px' }}>
            ₹{margin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Tooltip content="ADD_FUNDS_PORTAL" position="bottom">
            <button 
              onClick={() => window.open('https://pro.upstox.com/funds/securities/wallet', '_blank')}
              style={{ 
                background: 'transparent', 
                border: `1px solid ${COLOR.semantic.info}`, 
                color: COLOR.semantic.info, 
                padding: '2px 8px', 
                cursor: 'pointer',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '2px'
              }}
            >
              <Wallet size={14} />
            </button>
          </Tooltip>
        </div>

        <div style={{ ...cell, borderRight: BORDER.standard, padding: '0 8px' }}>
          <Tooltip content="ADD_NEW_WIDGET" position="bottom">
            <button
              ref={widgetBtnRef}
              onClick={() => setIsWidgetDropdownOpen((p) => !p)}
              style={{
                background: isWidgetDropdownOpen ? `${COLOR.semantic.info}22` : 'transparent',
                border: `1px solid ${isWidgetDropdownOpen ? COLOR.semantic.info : COLOR.bg.border}`,
                padding: '4px 8px',
                cursor: 'pointer',
                color: isWidgetDropdownOpen ? COLOR.semantic.info : COLOR.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '2px',
                height: '28px'
              }}
            >
              <PlusSquare size={16} />
            </button>
          </Tooltip>
          <WidgetDropdown isOpen={isWidgetDropdownOpen} onOpenChange={setIsWidgetDropdownOpen} anchorEl={widgetBtnRef.current} />
        </div>

        <div style={{ ...cell, borderRight: 'none', padding: '0 12px' }}>
           <Tooltip content="SYSTEM_CONTROLS" position="bottom">
                <button
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        useContextMenuStore.getState().openContextMenu(rect.left - 120, rect.bottom + 4, [
                            { 
                                label: 'API_SETTINGS', 
                                icon: <Settings size={14} />, 
                                onClick: () => navigate('/api') 
                            },
                            { 
                                label: 'RESET_VIEWPORT', 
                                icon: <RotateCcw size={14} />, 
                                onClick: () => {
                                    localStorage.removeItem('opentrader_layout');
                                    window.location.reload();
                                } 
                            },
                            {
                                label: 'SAVE_LAYOUT',
                                icon: <Save size={14} />,
                                onClick: () => {
                                    localStorage.setItem('opentrader_layout', JSON.stringify(model.toJson()));
                                }
                            }
                        ]);
                    }}
                    style={{
                        background: 'transparent',
                        border: `1px solid ${COLOR.bg.border}`,
                        color: COLOR.text.secondary,
                        cursor: 'pointer',
                        padding: '0 8px',
                        borderRadius: '2px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <MoreHorizontal size={16} />
                </button>
           </Tooltip>
        </div>
    </header>
  );
};
