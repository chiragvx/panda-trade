import React, { useState } from 'react';
import { Package, Shield, Layers, FileText, Bell, Maximize2, Minimize2, MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

const PieChartIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
);

const TABS = [
  { name: 'Positions', icon: <Shield size={14} />, count: 0 },
  { name: 'Orders', icon: <Package size={14} />, count: 0 },
  { name: 'Portfolio', icon: <PieChartIcon size={14} />, count: 0 },
  { name: 'Notifications', icon: <Bell size={14} />, count: 0 },
];


export const PositionsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Positions');
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`flex flex-col bg-bg-base border-t border-border transition-all duration-300 ease-in-out select-none ${isExpanded ? 'h-48' : 'h-10'}`}>
      <div className="h-10 px-4 flex items-center justify-between border-b border-border/50 shrink-0 bg-bg-elevated transition-colors">
        <div className="flex items-center space-x-1 h-full">
          {TABS.map(tab => (
            <button
              key={tab.name}
              onClick={() => { setActiveTab(tab.name); setIsExpanded(true); }}
              className={`flex items-center space-x-2 px-4 h-full text-[11px] font-bold transition-all relative group ${activeTab === tab.name && isExpanded ? 'text-accent-info' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40'}`}
            >
              {tab.icon}
              <span className="uppercase tracking-widest">{tab.name}</span>
              {tab.count > 0 && (
                <span className={`px-1 rounded-sm text-[9px] font-black ${activeTab === tab.name ? 'bg-accent-info text-text-inverse' : 'bg-bg-elevated text-text-muted'}`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.name && isExpanded && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-info shadow-[0_0_10px_rgba(255,122,26,0.5)]" />}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
           <div className="hidden sm:flex items-center space-x-4 border-r border-border pr-4 h-5">
              <div className="flex items-center space-x-1.5">
                 <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">Total P&L</span>
                 <span className="text-[11px] font-mono font-black text-accent-green leading-none">₹0.00</span>
              </div>
           </div>
           <div className="flex items-center space-x-2 h-full py-1.5">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 px-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
              <button className="p-1 px-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors hidden md:block">
                 <Maximize2 size={16} />
              </button>
           </div>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
           <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted/20 border-2 border-dashed border-border mb-4 opacity-50 shrink-0">
              <Layers size={32} />
           </div>
           <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">No Active {activeTab}</h3>
           <p className="text-[10px] text-text-muted font-bold tracking-wide italic max-w-xs">Your portfolio strategy is currently in equilibrium. Initiate orders from the watchlist or charts to see data here.</p>
        </div>
      </div>
    </div>
  );
};
