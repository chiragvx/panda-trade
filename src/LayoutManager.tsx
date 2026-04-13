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
import { IndicesWidget } from './widgets/Other/IndicesWidget';
import { OIGraphWidget } from './widgets/Other/OIGraphWidget';
import { TechnicalsWidget } from './widgets/Other/TechnicalsWidget';
import { VWapWidget } from './widgets/Other/VWapWidget';
import { ETFScanner } from './widgets/Other/ETFScanner';
import { StraddleChainWidget } from './widgets/Other/StraddleChainWidget';
import { VolatilitySkew } from './widgets/Other/VolatilitySkew';
import { 
  HeatmapStub, 
  FuturesChainStub, 
  NotificationsStub, 
  CorpActionsStub, 
} from './widgets/Other/Stubs';
import { IVChart } from './widgets/Other/IVChart';
import { NLScreener } from './widgets/Other/NLScreener';
import { MacroNews } from './widgets/News/MacroNews';
import { Plus, Lock, Unlock, Settings2, RotateCcw, ChevronDown, Maximize2, Minimize2, MoreVertical, X } from 'lucide-react';
import { OptionChainWidget } from './widgets/OptionChain/OptionChainWidget';

import FearIndex from './widgets/fear-index/FearIndex';
import PortMonitor from './widgets/port-monitor/PortMonitor';
import JetTracker from './widgets/jet-tracker/JetTracker';
import FireMap from './widgets/fire-map/FireMap';
// Intelligence Widgets Removed Scrapers

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
        case 'indices': return <IndicesWidget />;
        case 'etf-scanner': return <ETFScanner />;
        case 'holdings-heatmap': return <HeatmapWidget />;
        case 'oi-graph': return <OIGraphWidget />;
        case 'iv-chart': return <IVChart />;
        case 'volatility-skew': return <VolatilitySkew />;
        case 'technicals': return <TechnicalsWidget />;
        case 'vwap-indicator': return <VWapWidget />;
        case 'options-chain': return <OptionChainWidget />;
        case 'straddle-chain': return <StraddleChainWidget />;
        case 'futures-chain': return <FuturesChainStub />;
        case 'notifications': return <NotificationsStub />;
        case 'corporate-actions': return <CorpActionsStub />;
        case 'fundamentals': return <FundamentalsWidget />;
        case 'macro-news': return <MacroNews />;
        case 'stock-screener': return <NLScreener />;
        case 'vol-surface-3d': return (
            <React.Suspense fallback={<div className="h-full w-full bg-black flex items-center justify-center text-[10px] text-muted-foreground">LOADING 3D ENGINE...</div>}>
                <VolSurface3DWidget />
            </React.Suspense>
        );
        
        // Intelligence Widgets
        case 'fear-greed-index': return <FearIndex />;
        case 'marine-map': return <PortMonitor />;
        case 'flight-map': return <JetTracker />;
        case 'fire-map': return <FireMap />;

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
    const toDisplayName = (id: string) => {
      if (!id) return '';
      return id.replace(/[_-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    (window as any).addNodeToLayout = (componentId: string, nodeName?: string) => {
      let targetId = (window as any).activeTabsetId || undefined;
      model.doAction(Actions.addNode(
        { 
          type: "tab", 
          name: nodeName || toDisplayName(componentId), 
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
          name: nodeName || toDisplayName(componentId)
        }));
      } else {
        (window as any).addNodeToLayout(componentId, nodeName);
      }
    };

    // Smart Targeting: Find existing widget or add new
    (window as any).targetWidget = (componentId: string, nodeName?: string) => {
        let foundNodeId: string | null = null;
        
        // Search through the model for the first occurrence of this component
        model.visitNodes((node) => {
            if (node.getType() === 'tab' && (node as TabNode).getComponent() === componentId) {
                foundNodeId = node.getId();
            }
        });

        if (foundNodeId) {
            // Focus existing
            model.doAction(Actions.selectTab(foundNodeId));
        } else {
            // Add new
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

  const onRenderTab = (node: TabNode, renderValues: any) => {
     const rawName = node.getName();
     // Force clean title case even if model is messy (all caps, hyphens, or underscores)
     const cleanName = rawName.replace(/[_-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
     
     if (cleanName !== rawName) {
         renderValues.content = cleanName;
     }
  };

  const onRenderTabSet = (node: TabSetNode | BorderNode, renderValues: ITabSetRenderValues) => {
    if (node instanceof TabSetNode) {
        const id = node.getId();
        const isPinned = pinnedTabsets[id];
        
        renderValues.buttons.push(
            <div 
                key="add-widget-btn"
                className="flexlayout__tabset_header_button"
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
                className="flexlayout__tabset_header_button"
                style={{
                  color: isPinned ? '#FF7722' : '#FFFFFF',
                }}
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
        onRenderTab={onRenderTab}
        onRenderTabSet={onRenderTabSet}
        icons={{
          maximize: <Maximize2 size={14} />,
          restore: <Minimize2 size={14} />,
          more: <MoreVertical size={14} />,
          close: <X size={14} />
        }}
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
