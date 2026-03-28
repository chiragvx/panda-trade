import React, { useState, useEffect, useMemo } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { useMarketHours } from '../../hooks/useMarketHours';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Clock, AlertTriangle } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { EmptyState } from '../../ds/components/EmptyState';

interface FIIDIIEntry {
  category: string;
  buyValue: number;
  sellValue: number;
  netValue: number;
  date: string;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const FIIDIITracker: React.FC = () => {
  const { isMarketOpen } = useMarketHours();
  const { data, isLoading, error } = useNSEData<any>('/api/fiidiiTradeReact', {
    pollingInterval: 5 * 60 * 1000,
    enabled: true,
  });

  const [flashAmber, setFlashAmber] = useState(false);
  const [lastFiiNet, setLastFiiNet] = useState<number | null>(null);

  const rows = useMemo<FIIDIIEntry[]>(() => {
    const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    return raw.map((entry: any) => ({
      category: String(entry.category || ''),
      buyValue: toNumber(entry.buyValue ?? entry.buy),
      sellValue: toNumber(entry.sellValue ?? entry.sell),
      netValue: toNumber(entry.netValue ?? entry.net),
      date: String(entry.date || ''),
    }));
  }, [data]);

  useEffect(() => {
    if (rows.length > 0) {
      const fii = rows.find((d) => d.category === 'FII/FPI');
      if (fii) {
        if (lastFiiNet !== null && lastFiiNet > 0 && fii.netValue < 0) {
          setFlashAmber(true);
          const timer = setTimeout(() => setFlashAmber(false), 5000);
          return () => clearTimeout(timer);
        }
        setLastFiiNet(fii.netValue);
      }
    }
  }, [rows, lastFiiNet]);

  const fii = rows.find((d) => d.category === 'FII/FPI') || { buyValue: 0, sellValue: 0, netValue: 0, date: '' };
  const dii = rows.find((d) => d.category === 'DII') || { buyValue: 0, sellValue: 0, netValue: 0, date: '' };

  const chartData = rows.map((entry, index) => ({
    time: entry.date || String(index + 1),
    fiiNet: entry.netValue,
    nifty: 0,
  }));

  const formatCr = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })} CR`;

  const DataRow = ({ label, buy, sell, net }: any) => {
    const isNetPositive = net >= 0;
    const netColor = isNetPositive ? COLOR.semantic.up : COLOR.semantic.down;

    return (
      <div style={{ marginBottom: SPACE[3], borderLeft: `2px solid ${netColor}`, padding: '8px 12px', background: COLOR.bg.surface, borderRight: BORDER.standard, borderTop: BORDER.standard, borderBottom: BORDER.standard }} className="hover:bg-bg-elevated transition-colors">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.secondary, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps }}>{label}</span>
          <span style={{ fontSize: TYPE.size.sm, fontWeight: TYPE.weight.bold, color: netColor, fontVariantNumeric: 'tabular-nums' }}>
            {isNetPositive ? '+' : ''}{formatCr(net)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '10px' }}>
          <div style={{ borderRight: BORDER.standard, paddingRight: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: COLOR.text.muted, fontWeight: TYPE.weight.bold, fontSize: '9px' }}>BUY</span>
            <span style={{ color: COLOR.text.primary, fontVariantNumeric: 'tabular-nums', fontWeight: TYPE.weight.bold }}>{formatCr(buy)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: COLOR.text.muted, fontWeight: TYPE.weight.bold, fontSize: '9px' }}>SELL</span>
            <span style={{ color: COLOR.text.primary, fontVariantNumeric: 'tabular-nums', fontWeight: TYPE.weight.bold }}>{formatCr(sell)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <WidgetShell style={{ 
        background: flashAmber ? `${COLOR.semantic.warning}10` : COLOR.bg.base,
        border: flashAmber ? `1px solid ${COLOR.semantic.warning}` : 'none',
        transition: 'all 0.5s',
    }}>
        <WidgetShell.Toolbar>
            <h4 style={{ fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: TYPE.letterSpacing.caps, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: TYPE.weight.bold }}>
                {isMarketOpen ? <span style={{ width: '6px', height: '6px', background: COLOR.semantic.up, borderRadius: '50%' }} /> : <Clock size={10} />}
                {isMarketOpen ? 'LIVE MARKET' : 'PRIOR SESSION'} | {fii.date || 'NO_DATE'}
            </h4>
            {error && (
                <div style={{ fontSize: '9px', color: COLOR.semantic.down, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: TYPE.weight.bold }}>
                    <AlertTriangle size={10} />
                    STALE | {new Date().toLocaleTimeString()}
                </div>
            )}
        </WidgetShell.Toolbar>

        <div style={{ flex: 1, padding: SPACE[4], display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="custom-scrollbar">
            {isLoading && rows.length === 0 ? (
                <EmptyState 
                    icon={<Clock size={32} className="animate-pulse" />}
                    message="POLLING_FII_DII..."
                    subMessage="Fetching institutional activity data from exchange servers."
                />
            ) : rows.length === 0 ? (
                <EmptyState 
                    icon={<AlertTriangle size={32} />}
                    message="NO_DATA_AVAILABLE"
                    subMessage="Institutional data is typically updated post-market hours or during specific intervals."
                />
            ) : (
                <>
                    <DataRow label="FOREIGN INSTITUTIONS (FII)" buy={fii.buyValue} sell={fii.sellValue} net={fii.netValue} />
                    <DataRow label="DOMESTIC INSTITUTIONS (DII)" buy={dii.buyValue} sell={dii.sellValue} net={dii.netValue} />

                    <div style={{ flex: 1, marginTop: SPACE[4], minHeight: '120px', background: COLOR.bg.surface, border: BORDER.standard, padding: '8px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLOR.bg.elevated} vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis yAxisId="left" hide orientation="left" />
                                <YAxis yAxisId="right" hide orientation="right" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: COLOR.bg.surface, border: BORDER.standard, fontSize: '10px', borderRadius: 0, padding: '4px 8px', fontFamily: TYPE.family.mono }}
                                    labelStyle={{ color: COLOR.text.muted, marginBottom: '2px', fontWeight: 'bold' }}
                                    itemStyle={{ padding: 0 }}
                                />
                                <Bar yAxisId="right" dataKey="fiiNet" fill={COLOR.semantic.info} opacity={0.3} isAnimationActive={false} />
                                <Line yAxisId="left" type="monotone" dataKey="nifty" stroke={COLOR.text.primary} strokeWidth={1} dot={false} isAnimationActive={false} />
                                <ReferenceLine yAxisId="right" y={0} stroke={COLOR.text.muted} strokeWidth={0.5} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    </WidgetShell>
  );
};

export default FIIDIITracker;

