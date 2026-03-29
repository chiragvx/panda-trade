import React, { useRef, useEffect, useState } from 'react';
import { WidgetDropdown } from './components/WidgetDropdown/WidgetDropdown';
import { Layout, Model, TabNode, TabSetNode, Action, Actions, BorderNode, ITabSetRenderValues, DockLocation } from 'flexlayout-react';
import { AnimatePresence, motion } from 'framer-motion';
import autoAnimate from '@formkit/auto-animate';
import { VARIANTS } from './animations/config';
import { useMotionVariants } from './animations/useMotion';
import { COLOR, TYPE, BORDER } from './ds/tokens';
import 'flexlayout-react/style/dark.css';

import { WatchlistWidget } from './widgets/Watchlist/WatchlistWidget';
import { ChartWidget } from './widgets/Chart/ChartWidget';
import { NewsWidget } from './widgets/News/NewsWidget';
import { OrderEntryWidget } from './widgets/OrderEntry/OrderEntryWidget';
import { 
  TrendingWidget, 
  PositionsWidget, 
  OrdersWidget, 
  PortfolioWidget, 
  BasketWidget 
} from './widgets/Other/Widgets';
import UpstoxHoldings from './widgets/upstox/UpstoxHoldings';
import { 
  IndicesStub, 
  ETFStub, 
  HeatmapStub, 
  OIGraphStub, 
  IVChartStub, 
  VolatilitySkewStub, 
  TechnicalsStub, 
  VWapStub, 
  StraddleChainStub, 
  FuturesChainStub, 
  NotificationsStub, 
  CorpActionsStub, 
  FundamentalsStub 
} from './widgets/Other/Stubs';
import { Plus, Lock, Unlock, Settings2, RotateCcw, ChevronDown } from 'lucide-react';
import { OptionChainWidget } from './widgets/OptionChain/OptionChainWidget';

import FIIDIITracker from './widgets/fii-dii/FIIDIITracker';
import BlockDealFeed from './widgets/block-deals/BlockDealFeed';
import FearIndex from './widgets/fear-index/FearIndex';
import MaxPainCalculator from './widgets/max-pain/MaxPainCalculator';
import NLScreener from './widgets/nl-screener/NLScreener';
import FilingReader from './widgets/filing-reader/FilingReader';
import PortMonitor from './widgets/port-monitor/PortMonitor';
import JetTracker from './widgets/jet-tracker/JetTracker';
import FireMap from './widgets/fire-map/FireMap';
import AccumulationScreener from './widgets/accumulation-screener/AccumulationScreener';

import { SnakeGame } from './widgets/Games/Snake';
import { Minesweeper } from './widgets/Games/Minesweeper';
import { WordleGame } from './widgets/Games/Wordle';
import { HeatmapWidget } from './widgets/Heatmap/HeatmapWidget';
import { FundamentalsWidget } from './widgets/Other/FundamentalsWidget';

import { useLayoutStore } from './store/useStore';
import { WidgetStateWrapper } from './components/WidgetStateWrapper';

const VolSurface3DWidget = React.lazy(() => import('./widgets/vol-surface/VolSurface3DWidget').then(m => ({ default: m.VolSurface3DWidget })));


interface LayoutManagerProps {
  model: Model;
}

const renderWidget = (id: string, node: TabNode) => {
    switch (id) {
        case 'watchlist': return <WatchlistWidget />;
        case 'chart': return <ChartWidget />;
        case 'news': return <NewsWidget />;
        case 'trending': return <TrendingWidget />;
        case 'positions': return <PositionsWidget />;
        case 'orders': return <OrdersWidget />;
        case 'portfolio': return <PortfolioWidget />;
        case 'holdings': return <UpstoxHoldings />;
        case 'basket': return <BasketWidget />;
        case 'orderEntry': return <OrderEntryWidget node={node} />;
        case 'indices': return <IndicesStub />;
        case 'etf-scanner': return <ETFStub />;
        case 'holdings-heatmap': return <HeatmapWidget />;
        case 'oi-graph': return <OIGraphStub />;
        case 'iv-chart': return <IVChartStub />;
        case 'volatility-skew': return <VolatilitySkewStub />;
        case 'technicals': return <TechnicalsStub />;
        case 'vwap-indicator': return <VWapStub />;
        case 'options-chain': return <OptionChainWidget />;
        case 'straddle-chain': return <StraddleChainStub />;
        case 'futures-chain': return <FuturesChainStub />;
        case 'notifications': return <NotificationsStub />;
        case 'corporate-actions': return <CorpActionsStub />;
        case 'fundamentals': return <FundamentalsWidget />;
        case 'vol-surface-3d': return (
            <React.Suspense fallback={<div className="h-full w-full bg-black flex items-center justify-center text-[10px] text-muted-foreground">LOADING 3D ENGINE...</div>}>
                <VolSurface3DWidget />
            </React.Suspense>
        );
        
        // Intelligence Widgets
        case 'fii-dii-activity': return <FIIDIITracker />;
        case 'block-deals': return <BlockDealFeed />;
        case 'fear-greed-index': return <FearIndex />;
        case 'max-pain': return <MaxPainCalculator />;
        case 'stock-screener': return <NLScreener />;
        case 'filing-reader': return <FilingReader />;
        case 'marine-map': return <PortMonitor />;
        case 'flight-map': return <JetTracker />;
        case 'fire-map': return <FireMap />;
        case 'accumulation-finder': return <AccumulationScreener />;

        case 'snake': return <SnakeGame />;
        case 'minesweeper': return <Minesweeper />;
        case 'wordle': return <WordleGame />;
        default: return <div className="p-8 text-center text-accent-red font-black">Widget not found: {id}</div>;
    }
};

export const LayoutManager: React.FC<LayoutManagerProps> = ({ model }) => {
  const { pinnedTabsets, togglePin } = useLayoutStore();
  const [dropdownAnchor, setDropdownAnchor] = useState<HTMLElement | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const variants = useMotionVariants(VARIANTS);
  const layoutContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (layoutContainerRef.current) {
        autoAnimate(layoutContainerRef.current, {
            duration: 220,
            easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        });
    }
  }, []);


  useEffect(() => {
    (window as any).addNodeToLayout = (componentId: string, nodeName?: string) => {
      let targetId = (window as any).activeTabsetId || undefined;
      model.doAction(Actions.addNode(
        { 
          type: "tab", 
          name: nodeName || componentId.toUpperCase().replace(/-/g, ' '), 
          component: componentId 
        },
        targetId,
        DockLocation.CENTER,
        -1,
        true // Select
      ));
    };

    (window as any).replaceTab = (componentId: string, nodeName?: string) => {
      const activeId = (window as any).activeTabId;
      if (activeId) {
        model.doAction(Actions.updateNodeAttributes(activeId, { 
          component: componentId, 
          name: nodeName || componentId.toUpperCase().replace(/-/g, ' ')
        }));
      } else {
        (window as any).addNodeToLayout(componentId, nodeName);
      }
    };
  }, [model]);


  const factory = (node: TabNode) => {
    const widgetId = node.getComponent()!;
    const instanceKey = node.getId();

    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
           key={instanceKey}
           {...variants.tabContent}
           style={{ 
             width: '100%', 
             height: '100%',
             willChange: 'transform, opacity, filter' 
           }}
        >
          <WidgetStateWrapper id={widgetId}>
            {renderWidget(widgetId, node)}
          </WidgetStateWrapper>
        </motion.div>
      </AnimatePresence>
    );
  };

  const onAction = (action: any) => {
    if (action.type === Actions.SELECT_TAB) {
      (window as any).activeTabId = action.data.tabNode;
    }
    if (action.type === Actions.MOVE_NODE) {
      const fromNodeId = action.data.fromNode;
      const toNodeId = action.data.toNode;
      const fromNode = model.getNodeById(fromNodeId);
      const toNode = model.getNodeById(toNodeId);
      const fromTabset = fromNode?.getParent();
      const toTabset = toNode?.getType() === 'tabset' ? toNode : toNode?.getParent();

      if (fromTabset && pinnedTabsets[fromTabset.getId()]) return undefined;
      if (toTabset && pinnedTabsets[toTabset.getId()]) return undefined;
    }
    return action;
  };

  const onRenderTabSet = (node: TabSetNode | BorderNode, renderValues: ITabSetRenderValues) => {
    if (node instanceof TabSetNode) {
        const id = node.getId();
        const isPinned = pinnedTabsets[id];
        
        renderValues.buttons.push(
            <div 
                key="add-widget-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '28px', width: '32px', cursor: 'pointer', flexShrink: 0,
                  color: '#FFFFFF', borderLeft: BORDER.standard,
                  transition: 'color 80ms linear, background 120ms linear',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FF7722'; (e.currentTarget as HTMLElement).style.background = '#111111'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onClick={(e) => {
                    e.stopPropagation();
                    (window as any).activeTabsetId = id;
                    setDropdownAnchor(e.currentTarget as HTMLElement);
                    setDropdownOpen(true);
                }}
                title="Add Module"
            >
                <Plus size={16} strokeWidth={3} />
            </div>
        );

        renderValues.buttons.push(
            <div 
                key="pin-button"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '28px', width: '32px', cursor: 'pointer', flexShrink: 0,
                  color: isPinned ? '#FF7722' : '#FFFFFF',
                  borderLeft: BORDER.standard,
                  transition: 'color 80ms linear, background 120ms linear',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#111111'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onClick={(e) => {
                    e.stopPropagation();
                    togglePin(id);
                }}
                title={isPinned ? 'Unlock Tabset' : 'Lock Tabset'}
            >
                {isPinned ? <Lock size={14} /> : <Unlock size={14} />}
            </div>
        );
    }
  };

  return (
    <div 
        ref={layoutContainerRef}
        className="w-full h-full relative bg-bg-primary overflow-hidden"
    >
      <Layout 
        model={model} 
        factory={factory}
        onAction={onAction}
        onRenderTabSet={onRenderTabSet}
        onModelChange={() => {
            const activeId = model.getActiveTabset()?.getId();
            if (activeId) (window as any).activeTabsetId = activeId;
            localStorage.setItem('opentrader_layout', JSON.stringify(model.toJson()));
        }}
      />
      <WidgetDropdown 
        isOpen={dropdownOpen}
        onOpenChange={setDropdownOpen}
        anchorEl={dropdownAnchor}
      />
    </div>
  );
};
