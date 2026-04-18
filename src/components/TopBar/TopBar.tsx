import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Model } from 'flexlayout-react';
import { motion, useAnimation } from 'framer-motion';
import { useSelectionStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { WidgetDropdown } from '../WidgetDropdown/WidgetDropdown';
import { ActionWrapper, COLOR, Divider, LAYOUT, LogoWrapper, MetricWrapper, MOTION, NAV_BTN, StatusWrapper, Text, Tooltip, TYPE } from '../../ds';
import { Change } from '../../ds/components/Change';
import { Clock3, MoreHorizontal, Plus, RotateCcw, Save, Settings, ShieldAlert } from 'lucide-react';
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
  const widgetBtnRef = useRef<HTMLElement>(null);

  const { status, checkTokenValidity, prices, funds, positions, instrumentMeta } = useUpstoxStore();
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
      x: ['0%', '-33.33%'],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop',
          duration: 35,
          ease: 'linear',
        },
      },
    });
  }, [controls]);

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
  const totalPnl = positions.reduce((sum: number, p: any) => sum + (Number(p.pnl) || 0), 0);
  const openCount = positions.filter((p: any) => Number(p.quantity) !== 0).length;
  const pnlFormatted = `${totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const railSection: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    flexShrink: 0,
    padding: '0 14px',
  };

  return (
    <header
      style={{
        height: LAYOUT.topbarH,
        display: 'flex',
        alignItems: 'stretch',
        background: COLOR.bg.base,
        borderBottom: `1px solid ${COLOR.bg.border}`,
        userSelect: 'none',
        position: 'relative',
        zIndex: 1000,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          ...railSection,
          minWidth: '160px',
          padding: '0 12px',
          background: COLOR.bg.surface,
          borderRight: `1px solid ${COLOR.bg.border}`,
        }}
      >
        <button
          onClick={() => navigate('/app')}
          title="Go to app"
          aria-label="Go to app"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '1.5rem',
            height: '1.5rem',
            padding: '0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <LogoWrapper
            tone="accent"
            style={{
              minHeight: '1.5rem',
              height: '1.5rem',
              padding: '0 8px',
              background: 'transparent',
              border: 'none',
            }}
          >
            <img src={logoSvg} alt="PandaTrade" style={{ height: '16px', objectFit: 'contain', display: 'block' }} />
          </LogoWrapper>
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={controls}
          drag="x"
          dragConstraints={{ left: -2000, right: 0 }}
          onDragStart={() => controls.stop()}
          onDragEnd={() => {
            controls.start({
              x: ['-33.33%'],
              transition: { repeat: Infinity, repeatType: 'loop', duration: 35, ease: 'linear' },
            });
          }}
          style={{
            display: 'flex',
            gap: '20px',
            padding: '0 12px',
            whiteSpace: 'nowrap',
            cursor: 'grab',
          }}
        >
          {[...liveIndices, ...liveIndices, ...liveIndices].map((item, i) => (
            <div
              key={`${item.sym}-${i}`}
              onClick={() => {
                const meta = Object.values(instrumentMeta).find((m) => m.ticker === item.sym) || {
                  ticker: item.sym,
                  exchange: item.sym.includes('NIFTY') ? 'NSE' : 'MCX',
                  name: item.sym,
                };
                setSelectedSymbol({
                  ticker: item.sym,
                  name: meta.name,
                  exchange: meta.exchange,
                  instrument_key: INDEX_ITEMS.find((idx) => idx.sym === item.sym)?.key || '',
                  ltp: item.price,
                  change: 0,
                  changePct: item.pct,
                  volume: 0,
                  open: 0,
                  high: 0,
                  low: 0,
                  close: 0,
                });
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }}
            >
              <Text size="xs" color="muted" weight="medium">
                {item.sym}
              </Text>
              <Text size="xs" color="primary" weight="bold">
                {item.price.toFixed(2)}
              </Text>
              <Change value={item.pct} format="percent" size="xs" weight="bold" />
            </div>
          ))}
        </motion.div>
      </div>

      <Divider orientation="vertical" length="8px" />

      {status === 'expired' && (
        <>
          <div style={{ ...railSection, padding: '0 12px', cursor: 'pointer' }} onClick={() => navigate('/api')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={12} color={COLOR.semantic.down} />
              <Text size="xs" color="down" weight="bold">Token expired</Text>
            </div>
          </div>
          <Divider orientation="vertical" length="8px" />
        </>
      )}

      {/* Live/Offline — bare, no box */}
      <div style={{ ...railSection, padding: '0 12px', flexShrink: 0 }}>
        <StatusWrapper
          label={status === 'connected' ? 'Live' : 'Offline'}
          tone={status === 'connected' ? 'up' : 'muted'}
          bare
        />
      </div>

      <Divider orientation="vertical" length="8px" />

      {/* Clock — bare text */}
      <div style={{ ...railSection, padding: '0 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock3 size={12} color={COLOR.text.muted} />
          <Text size="xs" color="secondary" weight="bold">
            {currentTime.toLocaleTimeString([], { hour12: false })}
          </Text>
        </div>
      </div>

      <Divider orientation="vertical" length="8px" />

      {/* Right data — bare metrics, boxed actions */}
      <div style={{ ...railSection, gap: '4px', padding: '0 10px', flexShrink: 0 }}>

        {/* P&L — bare text */}
        <MetricWrapper
          bare
          label="P&L"
          value={
            <span style={{ color: totalPnl >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
              {pnlFormatted}
            </span>
          }
        />

        <Divider orientation="vertical" length="8px" />

        {/* Open — bare text */}
        <MetricWrapper bare label="Open" value={String(openCount)} />

        <Divider orientation="vertical" length="8px" />

        {/* Funds — bare text + boxed action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px' }}>
          <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, color: COLOR.text.muted, letterSpacing: TYPE.letterSpacing.caps }}>
            Funds
          </span>
          <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xs, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>
            ₹{margin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <Tooltip content="Add funds" position="bottom">
            <ActionWrapper
              onClick={() => window.open('https://pro.upstox.com/funds/securities/wallet', '_blank')}
              tone="accent"
              style={{ width: NAV_BTN, height: NAV_BTN, flexShrink: 0 }}
            >
              <Plus size={11} />
            </ActionWrapper>
          </Tooltip>
        </div>

        <Divider orientation="vertical" length="8px" />

        {/* Widgets — boxed action button */}
        <div ref={widgetBtnRef as React.RefObject<HTMLDivElement>} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setIsWidgetDropdownOpen((p) => !p)}
            className="hover:bg-interactive-hover"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: NAV_BTN,
              padding: '0 12px',
              background: isWidgetDropdownOpen ? COLOR.interactive.selected : 'transparent',
              border: 'none',
              cursor: 'pointer',
              gap: '6px',
              whiteSpace: 'nowrap',
              fontFamily: TYPE.family.mono,
              fontSize: TYPE.size.xs,
              fontWeight: TYPE.weight.bold,
              color: isWidgetDropdownOpen ? COLOR.semantic.info : COLOR.text.secondary,
              transition: `background ${MOTION.duration.hover} linear, color ${MOTION.duration.hover} linear`,
            }}
          >
            <Plus size={11} color={isWidgetDropdownOpen ? COLOR.semantic.info : COLOR.text.secondary} />
            Widgets
          </button>
          <WidgetDropdown isOpen={isWidgetDropdownOpen} onOpenChange={setIsWidgetDropdownOpen} anchorEl={widgetBtnRef.current} />
        </div>

      </div>

      <Divider orientation="vertical" length="8px" />

      {/* System controls — boxed action */}
      <div style={{ ...railSection, padding: '0 8px' }}>
        <Tooltip content="System controls" position="bottom">
          <ActionWrapper
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              useContextMenuStore.getState().openContextMenu(rect.left - 120, rect.bottom + 4, [
                {
                  label: 'API settings',
                  icon: <Settings size={14} />,
                  onClick: () => navigate('/api'),
                },
                {
                  label: 'Reset viewport',
                  icon: <RotateCcw size={14} />,
                  onClick: () => {
                    localStorage.removeItem('opentrader_layout');
                    window.location.reload();
                  },
                },
                {
                  label: 'Save layout',
                  icon: <Save size={14} />,
                  onClick: () => {
                    localStorage.setItem('opentrader_layout', JSON.stringify(model.toJson()));
                  },
                },
              ]);
            }}
            style={{ width: NAV_BTN, height: NAV_BTN, color: COLOR.text.secondary }}
          >
            <MoreHorizontal size={14} />
          </ActionWrapper>
        </Tooltip>
      </div>

    </header>
  );
};
