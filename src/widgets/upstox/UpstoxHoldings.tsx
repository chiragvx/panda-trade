import React, { useMemo } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Price } from '../../ds/components/Price';
import { Change } from '../../ds/components/Change';
import { Badge } from '../../ds/components/Badge';
import { Wallet, BarChart3 } from 'lucide-react';

type HoldingRow = {
  symbol: string;
  exchange: string;
  quantity: number;
  avgCost: number;
  ltp: number;
  marketValue: number;
  pnl: number;
  pnlPct: number;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const UpstoxHoldings: React.FC = () => {
  const rawHoldings = useUpstoxStore((s) => s.holdings);
  const prices = useUpstoxStore((s) => s.prices);

  const holdings = useMemo<HoldingRow[]>(
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

        return {
          symbol: String(h?.trading_symbol || h?.tradingsymbol || h?.symbol || '--'),
          exchange: String(h?.exchange || 'NSE'),
          quantity: qty,
          avgCost,
          ltp,
          marketValue,
          pnl,
          pnlPct,
        };
      }),
    [prices, rawHoldings]
  );

  const totalValue = useMemo(() => holdings.reduce((acc, h) => acc + h.marketValue, 0), [holdings]);
  const totalPnL = useMemo(() => holdings.reduce((acc, h) => acc + h.pnl, 0), [holdings]);
  const totalPnLPct = totalValue > totalPnL ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLOR.bg.base }}>
      <div style={{ display: 'flex', gap: '32px', padding: '12px 16px', background: COLOR.bg.elevated, borderBottom: BORDER.standard }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: '900', letterSpacing: '0.05em' }}>TOTAL_MARKET_VALUE</span>
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff', fontFamily: TYPE.family.mono }}>
            ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10px', color: COLOR.text.muted, fontWeight: '900', letterSpacing: '0.05em' }}>UNREALIZED_PNL</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '900', color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down, fontFamily: TYPE.family.mono }}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
              ({totalPnLPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }} className="custom-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: TYPE.family.mono }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, background: COLOR.bg.surface, borderBottom: BORDER.standard, zIndex: 10 }}>
              <th style={thStyle}>INSTRUMENT</th>
              <th style={thStyle}>QTY</th>
              <th style={thStyle}>AVG_COST</th>
              <th style={thStyle}>LTP</th>
              <th style={thStyle}>CUR_VALUE</th>
              <th style={thStyle}>PNL</th>
              <th style={thStyle}>%CHG</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '24px 12px', color: COLOR.text.muted }}>
                  NO HOLDINGS DATA
                </td>
              </tr>
            ) : (
              holdings.map((h, i) => (
                <tr
                  key={`${h.symbol}-${i}`}
                  style={{
                    borderBottom: '1px solid #1a1a1a',
                    height: '28px',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                  className="hover:bg-interactive-hover transition-colors"
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge label={h.exchange} variant={h.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
                      <span style={{ fontWeight: 'bold', color: '#fff' }}>{h.symbol || '--'}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: COLOR.text.primary }}>{h.quantity}</td>
                  <td style={tdStyle}>{h.avgCost.toFixed(2)}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                    <Price value={h.ltp} weight="bold" />
                  </td>
                  <td style={{ ...tdStyle, color: '#fff' }}>{h.marketValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  <td style={{ ...tdStyle, fontWeight: '900', color: h.pnl >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                    {h.pnl >= 0 ? '+' : ''}{h.pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td style={tdStyle}>
                    <Change value={h.pnlPct} format="percent" weight="bold" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '6px 12px', background: COLOR.bg.surface, borderTop: BORDER.standard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: COLOR.text.muted, fontWeight: 'bold' }}>SOURCE: UPSTOX_LIVE_V2</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <BarChart3 size={12} color={COLOR.text.muted} />
          <Wallet size={12} color={COLOR.text.muted} />
        </div>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0 12px',
  fontSize: '9px',
  fontWeight: '900',
  color: COLOR.text.muted,
  height: '24px',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '0 12px',
  fontSize: '11px',
  color: COLOR.text.secondary,
};

export default UpstoxHoldings;
