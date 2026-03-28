import React, { useState, useMemo } from 'react';
import { useNSEData } from '../../hooks/useNSEData';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Target, ChevronDown } from 'lucide-react';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { SegmentedControl } from '../../ds/components/SegmentedControl';
import { EmptyState } from '../../ds/components/EmptyState';

const MaxPainCalculator: React.FC = () => {
    const [symbol] = useState('NIFTY');
    const [expiryIdx, setExpiryIdx] = useState(0);

    const { data: chainData, isLoading } = useNSEData<any>(
        `/api/option-chain-indices?symbol=${symbol}`,
        { pollingInterval: 10 * 60 * 1000 }
    );

    const { maxPain, filteredData, currentPrice, expiries } = useMemo(() => {
        if (!chainData?.records?.data) return { maxPain: 0, filteredData: [], currentPrice: 0, expiries: [] };

        const expiries = chainData.records.expiryDates.slice(0, 3);
        const selectedExpiry = expiries[expiryIdx];
        const currentPrice = chainData.records.underlyingValue;

        const rawData = chainData.records.data
            .filter((d: any) => d.expiryDate === selectedExpiry)
            .filter((d: any) => d.strikePrice > currentPrice * 0.9 && d.strikePrice < currentPrice * 1.1)
            .map((d: any) => ({
                strike: d.strikePrice,
                ceOI: d.CE?.openInterest || 0,
                peOI: d.PE?.openInterest || 0,
            }));

        const strikes = rawData.map((d: any) => d.strike);
        let minPain = Infinity;
        let maxPainStrike = 0;

        strikes.forEach((strike: number) => {
            const totalPain = rawData.reduce((sum: number, s: any) => {
                const ceLoss = s.strike < strike ? (strike - s.strike) * s.ceOI : 0;
                const peLoss = s.strike > strike ? (s.strike - strike) * s.peOI : 0;
                return sum + ceLoss + peLoss;
            }, 0);

            if (totalPain < minPain) {
                minPain = totalPain;
                maxPainStrike = strike;
            }
        });

        return { maxPain: maxPainStrike, filteredData: rawData, currentPrice, expiries };
    }, [chainData, expiryIdx]);

    if (isLoading && !chainData) {
        return (
            <WidgetShell>
                <EmptyState 
                    icon={<Target size={32} className="animate-pulse" />} 
                    message="CALCULATING_MAX_PAIN..." 
                    subMessage="Crunching option chain data to find theoretical settlement point."
                />
            </WidgetShell>
        );
    }

    const diffPoints = maxPain - currentPrice;
    const diffPct = (diffPoints / currentPrice) * 100;

    return (
        <WidgetShell>
            <WidgetShell.Toolbar>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '9px', fontWeight: TYPE.weight.bold }}>{symbol}</span>
                    <ChevronDown size={10} style={{ color: COLOR.text.muted }} />
                 </div>
                 <SegmentedControl 
                    options={expiries.map((exp: string, i: number) => ({ 
                        label: new Date(exp).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase(),
                        value: i.toString()
                    }))}
                    value={expiryIdx.toString()}
                    onChange={(v) => setExpiryIdx(parseInt(v))}
                 />
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, padding: '4px', position: 'relative', minHeight: '150px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <ComposedChart data={filteredData} layout="vertical" margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLOR.bg.elevated} horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="strike" type="category" stroke={COLOR.text.muted} fontSize={9} width={40} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: COLOR.bg.surface, border: BORDER.standard, fontSize: '10px', borderRadius: 0, padding: '8px' }}
                            itemStyle={{ padding: 0 }}
                        />
                        <Bar dataKey="ceOI" fill={COLOR.semantic.down} opacity={0.4} isAnimationActive={false} barSize={6} />
                        <Bar dataKey="peOI" fill={COLOR.semantic.up} opacity={0.4} isAnimationActive={false} barSize={6} />
                        
                        <ReferenceLine y={maxPain} stroke={COLOR.semantic.warning} strokeDasharray="3 3" strokeWidth={1} />
                        <ReferenceLine y={currentPrice} stroke={COLOR.text.primary} strokeWidth={1} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div style={{ padding: '8px 12px', background: COLOR.bg.surface, borderTop: BORDER.standard, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ borderRight: BORDER.standard }}>
                    <span style={{ display: 'block', fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '4px' }}>MAX_PAIN_STRIKE</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={12} style={{ color: COLOR.semantic.warning }} />
                        <span style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold }}>{maxPain.toLocaleString()}</span>
                    </div>
                </div>
                <div>
                    <span style={{ display: 'block', fontSize: '8px', color: COLOR.text.muted, textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '4px' }}>DISTANCE_LTP</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: diffPoints >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                            {diffPoints > 0 ? '+' : ''}{diffPoints.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '10px', color: COLOR.text.muted }}>({diffPct.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>
        </WidgetShell>
    );
};

export default MaxPainCalculator;

