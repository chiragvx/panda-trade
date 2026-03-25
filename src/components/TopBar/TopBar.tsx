import React, { useState, useEffect, useRef } from 'react';
import { Model } from 'flexlayout-react';
import { useLayoutStore } from '../../store/useStore';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { WidgetDropdown } from '../WidgetDropdown/WidgetDropdown';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Badge } from '../../ds/components/Badge';
import { Change } from '../../ds/components/Change';
import { Layout as LayoutIcon, Zap, Activity, PieChart, ShieldCheck, Clock, Search, Bell, AlertTriangle, ShieldAlert } from 'lucide-react';

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
    const { prices } = useUpstoxStore();
    
    return (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
            {TICKER_ITEMS.map((item, i) => {
                const key = item.sym === 'NIFTY 50' ? 'NSE_INDEX|Nifty 50' : item.sym === 'BANK NIFTY' ? 'NSE_INDEX|Nifty Bank' : null;
                const live = key ? prices[key] : null;
                const price = live?.ltp || item.price;
                const pChange = live?.pChange || item.pct;

                return (
                    <div key={i} style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px',
                        borderRight: BORDER.standard, height: '100%', fontFamily: TYPE.family.mono, fontSize: '11px'
                    }}>
                        <span style={{ color: COLOR.text.muted, fontSize: '9px' }}>{item.sym}</span>
                        <span style={{ color: COLOR.text.primary, fontWeight: 'bold' }}>{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <Change value={pChange} format="percent" size="xs" />
                    </div>
                );
            })}
        </div>
    );
};

export const TopBar: React.FC<TopBarProps> = ({ model }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWidgetDropdownOpen, setIsWidgetDropdownOpen] = useState(false);
  const widgetBtnRef = useRef<HTMLButtonElement>(null);
  const { openOrderModal, workspace, setWorkspace } = useLayoutStore();
  const { status, checkTokenValidity, prices } = useUpstoxStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    checkTokenValidity();
    return () => clearInterval(timer);
  }, []);

  const cell: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '0 12px', borderRight: BORDER.standard,
    height: '100%', flexShrink: 0,
  };

  const workspaceBtn = (id: 'EXECUTION' | 'ANALYSIS' | 'DERIVATIVES' | 'API', icon: any) => {
    const active = workspace === id;
    const Icon = icon;
    return (
        <button 
            key={id}
            onClick={() => setWorkspace(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px', height: '100%',
                padding: '0 16px', background: active ? COLOR.interactive.selected : 'transparent',
                border: 'none', borderRight: BORDER.standard, cursor: 'pointer',
                fontFamily: TYPE.family.mono, fontSize: '11px', fontWeight: active ? '900' : '500',
                color: active ? COLOR.semantic.info : COLOR.text.muted,
                borderBottom: active ? `2px solid ${COLOR.semantic.info}` : '2px solid transparent',
                transition: 'none'
            }}
        >
            <Icon size={14} />
            <span style={{ letterSpacing: '0.05em' }}>{id}</span>
        </button>
    );
  };

  const IndexComponent = ({ sym, key_token, fallback_price, fallback_pct }: any) => {
      const live = prices[key_token];
      const price = live?.ltp || fallback_price;
      const pct = live?.pChange || fallback_pct;
      const isUp = pct >= 0;

      return (
          <div style={{ 
              display: 'flex', flexDirection: 'column', gap: '2px',
              padding: '0 24px', borderRight: BORDER.standard, height: '100%',
              minWidth: '180px', justifyContent: 'center'
          }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: COLOR.text.muted, fontSize: '10px', fontWeight: '900' }}>{sym}</span>
                  <span style={{ color: isUp ? COLOR.semantic.up : COLOR.semantic.down, fontSize: '11px', fontWeight: '900' }}>
                      {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
                  </span>
              </div>
              <div style={{ 
                  color: '#fff', fontSize: '20px', 
                  fontWeight: '900', fontFamily: TYPE.family.mono,
                  letterSpacing: '-0.02em', lineHeight: 1
              }}>
                  {price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
          </div>
      );
  };

  return (
    <header style={{
      height: '72px', display: 'flex', flexDirection: 'column',
      background: COLOR.bg.elevated, borderBottom: BORDER.standard,
      userSelect: 'none', position: 'relative', zIndex: 1000, flexShrink: 0,
    }}>
      {/* Row 1: War Room & Scrolling Marquee */}
      <div style={{ height: '40px', display: 'flex', alignItems: 'stretch', background: '#000', borderBottom: BORDER.standard, overflow: 'hidden' }}>
          <IndexComponent sym="NIFTY 50" key_token="NSE_INDEX|Nifty 50" fallback_price={23614.45} fallback_pct={0.44} />
          <IndexComponent sym="BANK NIFTY" key_token="NSE_INDEX|Nifty Bank" fallback_price={51242.10} fallback_pct={-0.84} />
          
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div className="marquee-container" style={{ display: 'flex', gap: '40px', padding: '0 20px', whiteSpace: 'nowrap' }}>
                  {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: TYPE.family.mono }}>
                          <span style={{ color: COLOR.text.muted, fontSize: '11px', fontWeight: 'bold' }}>{item.sym}</span>
                          <span style={{ color: '#fff', fontSize: '13px', fontWeight: '900' }}>{item.price.toFixed(2)}</span>
                          <Change value={item.pct} format="percent" size="xs" weight="bold" />
                      </div>
                  ))}
              </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px', borderLeft: BORDER.standard, background: '#0a0a0a' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: 'bold' }}>ADV/DEC</span>
                  <span style={{ fontSize: '13px', color: COLOR.semantic.up, fontWeight: '900' }}>32</span>
                  <span style={{ fontSize: '11px', color: '#444' }}>/</span>
                  <span style={{ fontSize: '13px', color: COLOR.semantic.down, fontWeight: '900' }}>18</span>
              </div>
          </div>
      </div>

      {/* Row 2: Controls & Status */}
      <div style={{ height: '32px', display: 'flex', alignItems: 'stretch' }}>
          {/* Branding */}
          <div style={{ ...cell, background: COLOR.bg.surface, gap: '6px', borderRight: BORDER.standard }}>
            <Zap size={14} color={COLOR.semantic.info} fill={COLOR.semantic.info} />
            <span style={{ fontFamily: TYPE.family.mono, fontSize: '12px', fontWeight: '900', color: '#fff', letterSpacing: '0.1em' }}>OT_PRO</span>
          </div>

          {/* Workspaces */}
          <div style={{ display: 'flex' }}>
            {workspaceBtn('EXECUTION', Activity)}
            {workspaceBtn('DERIVATIVES', ShieldCheck)}
            {workspaceBtn('ANALYSIS', PieChart)}
            {workspaceBtn('API', LayoutIcon)}
          </div>

          <div style={{ flex: 1 }} />

          {/* Persistent Layout Controls */}
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <button 
                onClick={() => {
                    localStorage.setItem(`opentrader_layout_${workspace}`, JSON.stringify(model.toJson()));
                    console.log(`Layout saved for ${workspace}`);
                }}
                style={{
                  ...cell, background: 'transparent', borderLeft: BORDER.standard,
                  color: COLOR.semantic.info, cursor: 'pointer', fontSize: '10px',
                  fontWeight: '900', fontFamily: TYPE.family.mono, padding: '0 16px'
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
                  ...cell, background: 'transparent', borderLeft: BORDER.standard,
                  color: COLOR.text.muted, cursor: 'pointer', fontSize: '10px',
                  fontWeight: '900', fontFamily: TYPE.family.mono, padding: '0 16px'
                }}
              >
                RESET_SYS
              </button>
          </div>

          {/* Upstox Session Status */}
          {status === 'expired' && (
            <div style={{ ...cell, background: '#450a0a', borderRight: 'none', cursor: 'pointer' }} onClick={() => setWorkspace('API')}>
                <ShieldAlert size={14} color={COLOR.semantic.down} />
                <span style={{ fontSize: '10px', fontWeight: '900', color: COLOR.semantic.down }}>TOKEN_EXPIRED</span>
            </div>
          )}

          {/* Status Indicators */}
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
             <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLOR.text.primary, marginRight: '8px' }}>₹124,500</span>
             <div style={{ display: 'flex', gap: '2px' }}>
                <button onClick={() => openOrderModal('BUY')} style={{ background: COLOR.semantic.up, border: 'none', color: 'black', fontSize: '9px', fontWeight: 'bold', padding: '1px 4px', cursor: 'pointer' }}>B</button>
                <button onClick={() => openOrderModal('SELL')} style={{ background: COLOR.semantic.down, border: 'none', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '1px 4px', cursor: 'pointer' }}>S</button>
             </div>
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
              + ADD
            </button>
            <WidgetDropdown isOpen={isWidgetDropdownOpen} onOpenChange={setIsWidgetDropdownOpen} anchorEl={widgetBtnRef.current} />
          </div>
      </div>
    </header>
  );
};
