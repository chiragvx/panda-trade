import React, { useEffect, useState } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';
import { upstoxWebSocket } from '../../services/upstoxWebSocket';
import { Wallet, RefreshCw, XCircle, LayoutGrid, List } from 'lucide-react';
import { 
  COLOR, 
  TYPE, 
  SPACE, 
  BORDER, 
  ROW_HEIGHT,
  Text,
  WidgetShell,
  StatusBanner,
  DataTable,
  EmptyState,
  HoverActions,
  SegmentedControl,
  Price,
  Change,
  Badge
} from '../../ds';
import { useSelectionStore, useLayoutStore } from '../../store/useStore';
import { buildSymbolFromFeed, isIsin } from '../../utils/liveSymbols';

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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text weight="bold" size="md" color="primary">
                        {isIsin(val) ? (item.name || val) : val}
                    </Text>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Text size="xs" color="muted" weight="medium">
                            {item.product}
                        </Text>
                        <Badge label={item.exchange} variant={item.exchange === 'NSE' ? 'exchange-nse' : 'exchange-bse'} />
                    </div>
                </div>
            )
        },
        { key: 'quantity', label: 'QTY', align: 'right' as const, width: 80, render: (val: number) => <Text weight="medium">{val}</Text> },
        { 
            key: 'ltp', 
            label: 'LTP', 
            align: 'right' as const, 
            width: 90,
            render: (_: any, item: any) => {
                const ltp = prices[item.instrument_token]?.ltp || item.last_price;
                return <Price value={ltp} size="sm" weight="bold" />;
            }
        },
        { 
            key: 'pnl', 
            label: activeTab === 'positions' ? 'UNRLZD P&L' : 'CUR_VALUE', 
            align: 'right' as const, 
            width: 140,
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
                        
                        {activeTab === 'positions' ? (
                            <Change value={pnlOrValue} format="absolute" size="md" weight="bold" />
                        ) : (
                            <Text weight="bold" size="md">
                                ₹{pnlOrValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Text>
                        )}

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
                    message={`DISCONNECTED - STALE DATA [${new Date().toLocaleTimeString()}]`} 
                />
            )}

            {/* Summary Banner */}
            <div style={{ padding: SPACE[2], display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[2], background: COLOR.bg.base, borderBottom: BORDER.standard }}>
                 <div style={{ background: COLOR.bg.surface, padding: '10px 14px', border: BORDER.standard, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Wallet size={16} color={COLOR.semantic.info} />
                    <div>
                        <Text variant="label" size="xs" weight="bold" color="muted" block>AVBL MARGIN</Text>
                        <Text size="lg" weight="bold" color="primary" block>
                            ₹{funds ? (funds.available_margin).toLocaleString('en-IN') : '--'}
                        </Text>
                    </div>
                 </div>

                 <div style={{ background: COLOR.bg.surface, padding: '10px 14px', border: BORDER.standard, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: totalPnL >= 0 ? COLOR.semantic.up : COLOR.semantic.down }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </div>
                    <div>
                        <Text variant="label" size="xs" weight="bold" color="muted" block>DAY UNRLZD</Text>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                             <Text size="lg" weight="bold" color={totalPnL >= 0 ? 'up' : 'down'}>
                                {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                             </Text>
                        </div>
                    </div>
                 </div>
            </div>

            <WidgetShell.Toolbar>
                <WidgetShell.Toolbar.Left>
                    <SegmentedControl 
                        options={[
                            { label: `POSITIONS [${positions.length}]`, value: 'positions', icon: <LayoutGrid size={12} /> },
                            { label: `HOLDINGS [${holdings.length}]`, value: 'holdings', icon: <List size={12} /> }
                        ]}
                        value={activeTab}
                        onChange={(v) => setActiveTab(v as any)}
                    />
                </WidgetShell.Toolbar.Left>
                <WidgetShell.Toolbar.Right>
                    <button onClick={refreshData} style={{ background: 'none', border: 'none', color: COLOR.text.muted, cursor: 'pointer' }} className={loading ? 'animate-spin' : 'hover:text-text-primary'}>
                        <RefreshCw size={14} />
                    </button>
                </WidgetShell.Toolbar.Right>
            </WidgetShell.Toolbar>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {data.length === 0 ? (
                    <EmptyState 
                        icon={<Wallet size={48} />} 
                        message={`NO DATA AVAILABLE IN ${activeTab.toUpperCase()}`} 
                        subMessage={`Your active ${activeTab} will appear here after synchronization.`}
                    />
                ) : (
                    <DataTable 
                        data={data}
                        columns={columns}
                        onRowClick={handleSelect}
                        stickyFirstColumn
                    />
                )}
            </div>

            {activeTab === 'positions' && positions.length > 0 && (
                <div style={{ padding: SPACE[2], borderTop: BORDER.strong, background: COLOR.bg.surface }}>
                     <button style={{ 
                         width: '100%',
                         height: '32px',
                         background: COLOR.semantic.down,
                         border: 'none',
                         color: COLOR.text.inverse,
                         fontSize: TYPE.size.xs,
                         fontWeight: TYPE.weight.black,
                         
                         letterSpacing: TYPE.letterSpacing.caps,
                         cursor: 'pointer',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         gap: '8px'
                     }} className="hover:opacity-90">
                        <XCircle size={14} />
                        TERMINATE ALL POSITIONS
                     </button>
                </div>
            )}
        </WidgetShell>
    );
};

export default UpstoxPortfolio;
