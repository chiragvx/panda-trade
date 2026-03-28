import React, { useEffect, useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { upstoxWebSocket } from '../../services/upstoxWebSocket';
import { Wallet, RefreshCw, XCircle, LayoutGrid, List } from 'lucide-react';
import { COLOR, TYPE, SPACE, BORDER } from '../../ds/tokens';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { buildSymbolFromFeed, isIsin } from '../../utils/liveSymbols';
import { WidgetShell } from '../../ds/components/WidgetShell';
import { StatusBanner } from '../../ds/components/StatusBanner';
import { DataTable } from '../../ds/components/DataTable';
import { EmptyState } from '../../ds/components/EmptyState';
import { HoverActions } from '../../ds/components/HoverActions';
import { SegmentedControl } from '../../ds/components/SegmentedControl';

const UpstoxPortfolio: React.FC = () => {
    const { accessToken, status, prices, instrumentMeta } = useUpstoxStore();
    const { setSelectedSymbol } = useSelectionStore();
    const { openOrderModal } = useLayoutStore();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [funds, setFunds] = useState<any>(null);
    const [positions, setPositions] = useState<any[]>([]);
    const [holdings, setHoldings] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'positions' | 'holdings'>('positions');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === 'connected' && accessToken) {
            refreshData();
            upstoxWebSocket.connect();
        }
    }, [status, accessToken]);

    const refreshData = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const [fundsRes, posRes, holdRes] = await Promise.all([
                upstoxApi.getFunds(accessToken),
                upstoxApi.getPositions(accessToken),
                upstoxApi.getHoldings(accessToken)
            ]);
            
            setFunds(fundsRes.data?.equity || null);
            setPositions(posRes.data || []);
            setHoldings(holdRes.data || []);

            const keys = [...new Set([
                ...(posRes.data?.map((p: any) => p.instrument_token) || []),
                ...(holdRes.data?.map((h: any) => h.instrument_token) || [])
            ])];
            if (keys.length > 0) {
                upstoxWebSocket.subscribe(keys);
            }
        } catch (err) {
            console.error("Failed to fetch portfolio data:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculatePnL = () => {
        let totalUnrealized = 0;
        const currentPositions = positions.length > 0 ? positions : [];
        currentPositions.forEach(pos => {
            const currentPrice = prices[pos.instrument_token]?.ltp || pos.last_price;
            const diff = currentPrice - pos.buy_price;
            totalUnrealized += diff * pos.quantity;
        });
        return totalUnrealized;
    };

    const totalPnL = calculatePnL();

    const handleSelect = (item: any) => {
        const meta = instrumentMeta[item.instrument_token] || {
            ticker: item.trading_symbol,
            name: item.trading_symbol,
            exchange: item.exchange as any
        };
        const symbol = buildSymbolFromFeed(item.instrument_token, prices[item.instrument_token], meta);
        setSelectedSymbol(symbol);
    };

    const handleAction = (item: any, type: 'BUY' | 'SELL') => {
        handleSelect(item);
        setTimeout(() => openOrderModal(type), 0);
    };

    const columns = [
        { 
            key: 'trading_symbol', 
            label: 'SYMBOL', 
            render: (val: string, item: any) => (
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: TYPE.size.md }}>
                        {isIsin(val) ? (item.name || val) : val}
                    </div>
                    <div style={{ fontSize: '9px', color: COLOR.text.muted, textTransform: 'uppercase' }}>
                        {item.product || item.exchange}
                    </div>
                </div>
            )
        },
        { key: 'quantity', label: 'QTY', align: 'right' as const, width: 60 },
        { 
            key: 'ltp', 
            label: 'LTP', 
            align: 'right' as const, 
            width: 80,
            render: (_: any, item: any) => (prices[item.instrument_token]?.ltp || item.last_price).toFixed(2)
        },
        { 
            key: 'pnl', 
            label: activeTab === 'positions' ? 'UNRLZD P&L' : 'VALUE', 
            align: 'right' as const, 
            width: 120,
            render: (_: any, item: any, idx: number) => {
                const ltp = prices[item.instrument_token]?.ltp || item.last_price;
                const pnlOrValue = activeTab === 'positions' 
                    ? (ltp - item.buy_price) * item.quantity 
                    : item.quantity * ltp;
                const isPos = pnlOrValue >= 0;

                return (
                    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                         onMouseEnter={() => setHoveredIndex(idx)}
                         onMouseLeave={() => setHoveredIndex(null)}>
                        <span style={{ 
                            fontWeight: 'bold', 
                            color: activeTab === 'positions' ? (isPos ? COLOR.semantic.up : COLOR.semantic.down) : COLOR.text.primary,
                            fontSize: TYPE.size.md
                        }}>
                            {activeTab === 'positions' && isPos ? '+' : ''}{pnlOrValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <HoverActions 
                            isVisible={hoveredIndex === idx}
                            onBuy={() => handleAction(item, 'BUY')}
                            onSell={() => handleAction(item, 'SELL')}
                        />
                    </div>
                );
            }
        }
    ];

    const data = activeTab === 'positions' ? positions : holdings;

    return (
        <WidgetShell>
            {status !== 'connected' && (
                <StatusBanner 
                    variant="disconnected" 
                    message={`DISCONNECTED - SHOWING STALE DATA [${new Date().toLocaleTimeString()}]`} 
                />
            )}

            {/* Summary Banner */}
            <div style={{ padding: SPACE[2], display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[1], background: COLOR.bg.elevated, borderBottom: BORDER.standard }}>
                 <div style={{ background: COLOR.bg.surface, padding: '8px 12px', border: BORDER.standard, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Wallet size={14} style={{ color: COLOR.semantic.up }} />
                    <div>
                        <span style={{ display: 'block', fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AVBL MARGIN</span>
                        <span style={{ display: 'block', fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>
                            ₹{funds ? (funds.available_margin).toLocaleString('en-IN') : '--'}
                        </span>
                    </div>
                 </div>

                 <div style={{ background: COLOR.bg.surface, padding: '8px 12px', border: BORDER.standard, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down, fontSize: '9px', fontWeight: TYPE.weight.bold }}>
                        {totalPnL >= 0 ? '+' : ''}
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '9px', fontWeight: TYPE.weight.bold, color: COLOR.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>DAY UNRLZD</span>
                        <span style={{ display: 'block', fontSize: TYPE.size.md, fontWeight: TYPE.weight.bold, color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                            ₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                 </div>
            </div>

            <WidgetShell.Toolbar>
                <SegmentedControl 
                    options={[
                        { label: `POSITIONS [${positions.length}]`, value: 'positions', icon: <LayoutGrid size={10} /> },
                        { label: `HOLDINGS [${holdings.length}]`, value: 'holdings', icon: <List size={10} /> }
                    ]}
                    value={activeTab}
                    onChange={(v) => setActiveTab(v as any)}
                />
                <button onClick={refreshData} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }} className={loading ? 'animate-spin' : 'hover:text-text-primary'}>
                    <RefreshCw size={12} />
                </button>
            </WidgetShell.Toolbar>

            {data.length === 0 ? (
                <EmptyState 
                    icon={<Wallet size={32} />} 
                    message={`NO DATA AVAILABLE IN ${activeTab}`} 
                    subMessage={`Your active ${activeTab} will appear here after synchronization.`}
                />
            ) : (
                <DataTable 
                    data={data}
                    columns={columns}
                    onRowClick={handleSelect}
                />
            )}

            {activeTab === 'positions' && positions.length > 0 && (
                <div style={{ padding: SPACE[2], borderTop: BORDER.standard, background: COLOR.bg.surface }}>
                     <button style={{ 
                         width: '100%',
                         height: '32px',
                         background: COLOR.semantic.down,
                         border: 'none',
                         color: COLOR.text.inverse,
                         fontSize: TYPE.size.xs,
                         fontWeight: TYPE.weight.bold,
                         textTransform: 'uppercase',
                         letterSpacing: TYPE.letterSpacing.caps,
                         cursor: 'pointer'
                     }} className="hover:opacity-90">
                        <XCircle size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        TERMINATE ALL POSITIONS
                     </button>
                </div>
            )}
        </WidgetShell>
    );
};

export default UpstoxPortfolio;

