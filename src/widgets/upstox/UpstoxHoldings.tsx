import React, { useMemo, useState } from 'react';
import { isIsin } from '../../utils/liveSymbols';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { useLayoutStore, useSelectionStore } from '../../store/useStore';
import { useContextMenuStore, ContextMenuOption } from '../../store/useContextMenuStore';
import { COLOR, TYPE, BORDER, ROW_HEIGHT } from '../../ds/tokens';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';
import { Badge } from '../../ds/components/Badge';
import { Button } from '../../ds/components/Button';
import { Wallet, BarChart3, Info, Plus, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const HOLDING_COL_WIDTHS: Record<string, number> = {
  'SYMBOL': 160,
  'QTY': 80,
  'AVG_COST': 100,
  'LTP': 100,
  'CUR_VALUE': 120,
  'PNL': 120,
  '%CHG': 100
};

const HoldingRowComp: React.FC<{ holding: any }> = ({ holding }) => {
  const [hovered, setHovered] = useState(false);
  const { openOrderModal, openHoldingDetails } = useLayoutStore();
  const { setSelectedSymbol } = useSelectionStore();
  const { openContextMenu } = useContextMenuStore();

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const options: ContextMenuOption[] = [
      { 
        label: 'BUY MORE', 
        icon: <ArrowUpCircle size={14} />, 
        variant: 'info' as const,
        onClick: () => { 
            setSelectedSymbol({ ticker: holding.symbol, instrument_key: holding.raw.instrument_token } as any);
            setTimeout(() => openOrderModal('BUY'), 0);
        } 
      },
      { 
        label: 'EXIT POSITION', 
        icon: <ArrowDownCircle size={14} />, 
        variant: 'danger' as const,
        onClick: () => { 
            setSelectedSymbol({ ticker: holding.symbol, instrument_key: holding.raw.instrument_token } as any);
            setTimeout(() => openOrderModal('SELL'), 0);
        } 
      },
      { 
        label: 'HOLDING DETAILS', 
        icon: <Info size={14} />, 
        variant: 'muted' as const,
        onClick: () => { openHoldingDetails(holding.raw); } 
      }
    ];
    openContextMenu(e.clientX, e.clientY, options);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={handleRightClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: ROW_HEIGHT.default,
        borderBottom: BORDER.standard,
        position: 'relative',
        background: hovered ? COLOR.interactive.hover : 'transparent',
        transition: 'background 80ms linear',
        minWidth: 'fit-content'
      }}
    >
      <div style={{ width: HOLDING_COL_WIDTHS['SYMBOL'], minWidth: HOLDING_COL_WIDTHS['SYMBOL'], padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px', position: 'sticky', left: 0, background: hovered ? COLOR.interactive.hover : COLOR.bg.surface, zIndex: 10 }}>
        <Badge label={holding.exchange} variant={holding.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
        <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '11px', fontFamily: TYPE.family.mono }}>{holding.symbol}</span>
      </div>
      
      <div style={{ width: HOLDING_COL_WIDTHS['QTY'], minWidth: HOLDING_COL_WIDTHS['QTY'], textAlign: 'right', paddingRight: '12px', fontFamily: TYPE.family.mono, fontSize: '11px', color: COLOR.text.primary }}>
        {holding.quantity}
      </div>
      
      <div style={{ width: HOLDING_COL_WIDTHS['AVG_COST'], minWidth: HOLDING_COL_WIDTHS['AVG_COST'], textAlign: 'right', paddingRight: '12px', fontFamily: TYPE.family.mono, fontSize: '11px', color: COLOR.text.secondary }}>
        {holding.avgCost.toFixed(2)}
      </div>

      <div style={{ width: HOLDING_COL_WIDTHS['LTP'], minWidth: HOLDING_COL_WIDTHS['LTP'], textAlign: 'right', paddingRight: '12px' }}>
        <Price value={holding.ltp} size="sm" weight="bold" />
      </div>

      <div style={{ width: HOLDING_COL_WIDTHS['CUR_VALUE'], minWidth: HOLDING_COL_WIDTHS['CUR_VALUE'], textAlign: 'right', paddingRight: '12px', fontFamily: TYPE.family.mono, fontSize: '11px', color: '#fff' }}>
        ₹{holding.marketValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </div>

      <div style={{ width: HOLDING_COL_WIDTHS['PNL'], minWidth: HOLDING_COL_WIDTHS['PNL'], textAlign: 'right', paddingRight: '12px', fontFamily: TYPE.family.mono, fontSize: '11px', fontWeight: '900', color: holding.pnl >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
        {holding.pnl >= 0 ? '+' : ''}{holding.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </div>

      <div style={{ width: HOLDING_COL_WIDTHS['%CHG'], minWidth: HOLDING_COL_WIDTHS['%CHG'], textAlign: 'right', paddingRight: '12px' }}>
        <Change value={holding.pnlPct} format="percent" weight="bold" size="sm" />
      </div>

      {/* Action Overlay on Hover */}
      {hovered && (
        <div style={{ 
            position: 'sticky', 
            right: 0, 
            height: '100%',
            width: 120,
            zIndex: 30, 
            background: COLOR.interactive.hover, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '6px', 
            borderLeft: `1px solid #333333`,
            padding: '0 8px'
        }}>
            <Button size="sm" variant="buy" onClick={(e) => { e.stopPropagation(); setSelectedSymbol({ ticker: holding.symbol, instrument_key: holding.raw.instrument_token } as any); setTimeout(() => openOrderModal('BUY'), 0); }} style={{ height: '22px', fontSize: '9px', padding: '0 6px' }}>BUY</Button>
            <Button size="sm" variant="sell" onClick={(e) => { e.stopPropagation(); setSelectedSymbol({ ticker: holding.symbol, instrument_key: holding.raw.instrument_token } as any); setTimeout(() => openOrderModal('SELL'), 0); }} style={{ height: '22px', fontSize: '9px', padding: '0 6px' }}>SELL</Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openHoldingDetails(holding.raw); }} style={{ height: '22px', color: '#888', padding: '0 4px' }}><Info size={14} /></Button>
        </div>
      )}
    </div>
  );
};

const UpstoxHoldings: React.FC = () => {
  const rawHoldings = useUpstoxStore((s) => s.holdings);
  const prices = useUpstoxStore((s) => s.prices);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const holdings = useMemo(
    () =>
      rawHoldings.map((h: any) => {
        const qty = toNumber(h?.quantity);
        const avgCost = toNumber(h?.average_price ?? h?.avg_price);
        const instrumentKey = String(h?.instrument_token || '');
        const liveLtp = toNumber(prices[instrumentKey]?.ltp, NaN);
        const fallbackLtp = toNumber(h?.last_price ?? h?.ltp);
        const ltp = Number.isFinite(liveLtp) ? liveLtp : fallbackLtp;
        const marketValue = qty * ltp;
        const pnl = toNumber(h?.pnl, (ltp - avgCost) * qty);
        const pnlPct = avgCost > 0 && qty > 0 ? (pnl / (avgCost * qty)) * 100 : 0;

        const rawSymbol = String(h?.trading_symbol || h?.tradingsymbol || h?.symbol || '--');
        const name = String(h?.name || h?.company_name || '');
        const symbol = isIsin(rawSymbol) && name ? name : rawSymbol;

        return {
          symbol,
          exchange: String(h?.exchange || 'NSE'),
          quantity: qty,
          avgCost,
          ltp,
          marketValue,
          pnl,
          pnlPct,
          raw: h
        };
      }),
    [prices, rawHoldings]
  );

  const totalValue = useMemo(() => holdings.reduce((acc, h) => acc + h.marketValue, 0), [holdings]);
  const totalPnL = useMemo(() => holdings.reduce((acc, h) => acc + h.pnl, 0), [holdings]);
  const totalPnLPct = totalValue > totalPnL ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

  const syncScroll = () => {
    if (contentRef.current && headerRef.current) {
        headerRef.current.scrollLeft = contentRef.current.scrollLeft;
    }
  };

  const cols = ['SYMBOL', 'QTY', 'AVG_COST', 'LTP', 'CUR_VALUE', 'PNL', '%CHG'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.base, overflow: 'hidden' }}>
      {/* Portfolio Summary Summary */}
      <div style={{ display: 'flex', gap: '32px', padding: '12px 16px', background: '#000', borderBottom: BORDER.standard, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: '900', letterSpacing: '0.1em' }}>TOTAL_MARKET_VALUE</span>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#fff', fontFamily: TYPE.family.mono }}>
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: '900', letterSpacing: '0.1em' }}>UNREALIZED_PNL</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: '900', color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down, fontFamily: TYPE.family.mono }}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
              ({totalPnLPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div 
        ref={headerRef}
        style={{ display: 'flex', height: ROW_HEIGHT.header, background: COLOR.bg.surface, borderBottom: BORDER.standard, flexShrink: 0, overflow: 'hidden' }}
      >
        {cols.map(c => (
            <div 
                key={c} 
                style={{ 
                    width: HOLDING_COL_WIDTHS[c], 
                    minWidth: HOLDING_COL_WIDTHS[c], 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: c === 'SYMBOL' ? 'flex-start' : 'flex-end',
                    fontFamily: TYPE.family.mono,
                    fontSize: '9px',
                    fontWeight: '900',
                    color: COLOR.text.muted,
                    letterSpacing: '0.1em',
                    padding: '0 12px',
                    position: c === 'SYMBOL' ? 'sticky' : 'static',
                    left: c === 'SYMBOL' ? 0 : 'auto',
                    zIndex: c === 'SYMBOL' ? 20 : 1,
                    background: '#000000',
                    borderRight: '1px solid #111111'
                }}
            >
                {c}
            </div>
        ))}
        {/* Actions Spacer */}
        <div style={{ width: 120, minWidth: 120, flexShrink: 0, background: '#000000' }} />
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        onScroll={syncScroll}
        style={{ flex: 1, overflow: 'auto', background: COLOR.bg.base }}
        className="custom-scrollbar"
      >
        <div style={{ minWidth: 'fit-content' }}>
            {holdings.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: COLOR.text.muted, fontSize: '11px', fontFamily: TYPE.family.mono }}>NO HOLDINGS FOUND</div>
            ) : (
                holdings.map((h, i) => (
                    <HoldingRowComp key={`${h.symbol}-${i}`} holding={h} />
                ))
            )}
        </div>
      </div>

      <div style={{ height: '24px', padding: '0 12px', background: COLOR.bg.surface, borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: 'bold', fontFamily: TYPE.family.mono }}>SOURCE: UPSTOX_HOLDINGS_V2</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <BarChart3 size={12} color={COLOR.text.muted} />
          <Wallet size={12} color={COLOR.text.muted} />
        </div>
      </div>
    </div>
  );
};

export default UpstoxHoldings;
