import React, { useState, useEffect, useRef } from 'react';
import { Model } from 'flexlayout-react';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { WidgetDropdown } from '../WidgetDropdown/WidgetDropdown';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Badge } from '../../ds/components/Badge';
import { Change } from '../../ds/components/Change';
import { Layout as LayoutIcon, Zap, Activity, PieChart, ShieldCheck, Clock, Search, Bell } from 'lucide-react';

interface TopBarProps {
  model: Model;
}

const TICKER_ITEMS = [
  { sym: 'NIFTY 50',   price: 23614.45, change: 104.20, pct: 0.44  },
  { sym: 'BANK NIFTY', price: 51242.10, change: -436.35, pct: -0.84  },
  { sym: 'FINNIFTY',   price: 24810.15, change: 108.50, pct: 0.44 },
  { sym: 'INDIA VIX',  price: 14.21, change: 0.45, pct: 3.27  },
];

const TickerTape: React.FC = () => {
    return (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
            {TICKER_ITEMS.map((item, i) => (
                <div key={i} style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px',
                    borderRight: BORDER.standard, height: '100%', fontFamily: TYPE.family.mono, fontSize: '11px'
                }}>
                    <span style={{ color: COLOR.text.muted, fontSize: '9px' }}>{item.sym}</span>
                    <span style={{ color: COLOR.text.primary, fontWeight: 'bold' }}>{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <Change value={item.pct} format="percent" size="xs" />
                </div>
            ))}
        </div>
    );
};

export const TopBar: React.FC<TopBarProps> = ({ model }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWidgetDropdownOpen, setIsWidgetDropdownOpen] = useState(false);
  const widgetBtnRef = useRef<HTMLButtonElement>(null);
  const { openOrderModal, workspace, setWorkspace } = useLayoutStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cell: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '0 12px', borderRight: BORDER.standard,
    height: '100%', flexShrink: 0,
  };

  const workspaceBtn = (id: 'INTRADAY' | 'RESEARCH' | 'F&O', icon: any) => {
    const active = workspace === id;
    const Icon = icon;
    return (
        <button 
            onClick={() => setWorkspace(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px', height: '100%',
                padding: '0 12px', background: active ? COLOR.interactive.selected : 'transparent',
                border: 'none', borderRight: BORDER.standard, cursor: 'pointer',
                fontFamily: TYPE.family.mono, fontSize: '11px', fontWeight: active ? 'bold' : 'normal',
                color: active ? COLOR.semantic.info : COLOR.text.muted,
                borderBottom: active ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent',
                transition: 'all 80ms linear',
            }}
        >
            <Icon size={12} />
            {id}
        </button>
    );
  };

  return (
    <header style={{
      height: '32px', display: 'flex', alignItems: 'stretch',
      background: COLOR.bg.elevated, borderBottom: BORDER.standard,
      userSelect: 'none', position: 'relative', zIndex: 1000, flexShrink: 0,
    }}>
      {/* Branding */}
      <div style={{ ...cell, background: COLOR.bg.surface, gap: '4px' }}>
        <Zap size={14} color={COLOR.semantic.info} fill={COLOR.semantic.info} />
        <span style={{ fontFamily: TYPE.family.mono, fontSize: '13px', fontWeight: '900', color: COLOR.text.primary, letterSpacing: '-0.05em' }}>OPENTRADER</span>
        <span style={{ fontSize: '9px', background: COLOR.semantic.info, color: 'black', padding: '0 2px', fontWeight: 'bold', marginLeft: '2px' }}>PRO</span>
      </div>

      {/* Workspaces */}
      <div style={{ display: 'flex' }}>
        {workspaceBtn('INTRADAY', Activity)}
        {workspaceBtn('RESEARCH', PieChart)}
        {workspaceBtn('F&O', ShieldCheck)}
        {workspaceBtn('ECOSYSTEM' as any, LayoutIcon)}
      </div>


      {/* Ticker tape */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TickerTape />
      </div>

      {/* Status Indicators */}
      <div style={cell}>
         <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLOR.semantic.up }} />
         <span style={{ fontSize: '9px', fontFamily: TYPE.family.mono, color: COLOR.semantic.up }}>LIVE</span>
      </div>

      <div style={cell}>
         <Clock size={12} color={COLOR.text.muted} />
         <span style={{ fontSize: '11px', fontFamily: TYPE.family.mono, color: COLOR.text.secondary }}>
            {currentTime.toLocaleTimeString([], { hour12: false })}
         </span>
      </div>

      <div style={cell}>
         <span style={{ fontSize: '9px', fontFamily: TYPE.family.mono, color: COLOR.text.muted }}>FUNDS:</span>
         <span style={{ fontSize: '11px', fontFamily: TYPE.family.mono, color: COLOR.text.primary, marginRight: '8px' }}>₹124,500</span>
         <div style={{ display: 'flex', gap: '2px' }}>
            <button 
                onClick={() => openOrderModal('BUY')}
                style={{ 
                    background: COLOR.semantic.up, border: 'none', color: 'black', 
                    fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', cursor: 'pointer',
                    fontFamily: TYPE.family.mono 
                }}
            >B</button>
            <button 
                onClick={() => openOrderModal('SELL')}
                style={{ 
                    background: COLOR.semantic.down, border: 'none', color: 'white', 
                    fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', cursor: 'pointer',
                    fontFamily: TYPE.family.mono 
                }}
            >S</button>
         </div>
      </div>

      <div style={cell}>
         <Badge label="GTT: 4" variant="default" />
         <Bell size={14} color={COLOR.text.muted} />
      </div>

      {/* Widgets button */}
      <div style={{ ...cell, borderRight: 'none', padding: '0 8px' }}>
        <button
          ref={widgetBtnRef}
          onClick={() => setIsWidgetDropdownOpen(p => !p)}
          style={{
            background: isWidgetDropdownOpen ? COLOR.semantic.info + '22' : 'transparent',
            border: `1px solid ${isWidgetDropdownOpen ? COLOR.semantic.info : COLOR.bg.border}`,
            padding: '2px 8px', cursor: 'pointer', fontFamily: TYPE.family.mono,
            fontSize: '10px', color: isWidgetDropdownOpen ? COLOR.semantic.info : COLOR.text.primary,
          }}
        >
          + ADD MODULE
        </button>
        <WidgetDropdown
          isOpen={isWidgetDropdownOpen}
          onOpenChange={setIsWidgetDropdownOpen}
          anchorEl={widgetBtnRef.current}
        />
      </div>
    </header>
  );
};
