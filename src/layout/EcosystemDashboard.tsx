import React, { useState } from 'react';
import { WidgetGrid } from './WidgetGrid';
import { Widget } from '../types';
import FIIDIITracker from '../widgets/fii-dii/FIIDIITracker';
import BlockDealFeed from '../widgets/block-deals/BlockDealFeed';
import FearIndex from '../widgets/fear-index/FearIndex';
import MaxPainCalculator from '../widgets/max-pain/MaxPainCalculator';
import MorningBrief from '../widgets/morning-brief/MorningBrief';
import NLScreener from '../widgets/nl-screener/NLScreener';
import FilingReader from '../widgets/filing-reader/FilingReader';
import PortMonitor from '../widgets/port-monitor/PortMonitor';
import JetTracker from '../widgets/jet-tracker/JetTracker';
import AccumulationScreener from '../widgets/accumulation-screener/AccumulationScreener';
import UpstoxConnect from '../widgets/upstox/UpstoxConnect';

const INITIAL_WIDGETS: Widget[] = [
  {
    id: 'upstox-connect',
    title: 'Upstox Terminal Control',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    isLinked: false,
    refreshInterval: 0,
    component: UpstoxConnect
  },
  {
    id: 'fii-dii',
    title: 'FII/DII Live Tracker',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    isLinked: false,
    refreshInterval: 300000,
    component: FIIDIITracker
  },
  {
    id: 'block-deals',
    title: 'Block Deal Alert Feed',
    defaultSize: { w: 2, h: 3 },
    minSize: { w: 2, h: 3 },
    isLinked: true,
    refreshInterval: 60000,
    component: BlockDealFeed
  },
  {
    id: 'max-pain',
    title: 'Options Max Pain',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 3, h: 3 },
    isLinked: true,
    refreshInterval: 600000,
    component: MaxPainCalculator
  },
  {
    id: 'filing-reader',
    title: 'Exchange Filing Reader',
    defaultSize: { w: 2, h: 4 },
    minSize: { w: 2, h: 4 },
    isLinked: true,
    refreshInterval: 120000,
    component: FilingReader
  },
  {
    id: 'port-monitor',
    title: 'Satellite Port Activity',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 4, h: 3 },
    isLinked: false,
    refreshInterval: 3600000,
    component: PortMonitor
  },
  {
    id: 'jet-tracker',
    title: 'Corporate Jet Tracker',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 3, h: 2 },
    isLinked: false,
    refreshInterval: 900000,
    component: JetTracker
  },
  {
    id: 'fear-index',
    title: 'Global Fear Composite',
    defaultSize: { w: 2, h: 3 },
    minSize: { w: 2, h: 3 },
    isLinked: false,
    refreshInterval: 300000,
    component: FearIndex
  },
  {
    id: 'accumulation-screener',
    title: 'Accumulation Screener',
    defaultSize: { w: 3, h: 4 },
    minSize: { w: 3, h: 4 },
    isLinked: false,
    refreshInterval: 0,
    component: AccumulationScreener
  },
  {
    id: 'morning-brief',
    title: 'AI Morning Brief',
    defaultSize: { w: 3, h: 4 },
    minSize: { w: 3, h: 4 },
    isLinked: false,
    refreshInterval: 0,
    component: MorningBrief
  },
  {
    id: 'nl-screener',
    title: 'NL Stock Screener',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 4, h: 3 },
    isLinked: false,
    refreshInterval: 0,
    component: NLScreener
  }
];


export const EcosystemDashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>(INITIAL_WIDGETS);

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const toggleLink = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, isLinked: !w.isLinked } : w));
  };

  const refreshWidget = (id: string) => {
    console.log(`Refreshing widget ${id}`);
    // Refresh logic here
  };

  return (
    <div className="h-full w-full bg-[#050505]">
      <WidgetGrid 
        widgets={widgets} 
        onRemoveWidget={removeWidget} 
        onToggleWidgetLink={toggleLink}
        onRefreshWidget={refreshWidget}
      />
    </div>
  );
};
