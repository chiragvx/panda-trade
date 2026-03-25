import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, 
  User, 
  Zap, 
  Search, 
  Briefcase, 
  BarChart3, 
  LineChart, 
  BrainCircuit, 
  Plus, 
  Save, 
  Settings2,
  X
} from 'lucide-react';
import { WorkspaceType, useLayoutStore } from '../../store/useStore';
import { COLOR, TYPE, BORDER } from '../../ds/tokens';
import { Model } from 'flexlayout-react';

interface WorkspaceInfo {
  id: WorkspaceType;
  label: string;
  icon: React.ReactNode;
  desc: string;
}

const WORKSPACES: WorkspaceInfo[] = [
  { id: 'CASUAL', label: 'CASUAL', icon: <User size={20} />, desc: 'MINIMALIST SETUP FOR CASUAL OBSERVATION' },
  { id: 'OPTIONS', label: 'OPTIONS', icon: <Zap size={20} />, desc: 'F&O FOCUS WITH LIVE CHAIN & GREEKS' },
  { id: 'RESEARCH', label: 'RESEARCH', icon: <Search size={20} />, desc: 'DEEP ANALYSIS WITH MULTI-CHART & NEWS' },
  { id: 'PM', label: 'PORTFOLIO', icon: <Briefcase size={20} />, desc: 'RISK MONITORING & HOLDINGS TRACING' },
  { id: 'QUANT', label: 'QUANT', icon: <BarChart3 size={20} />, desc: 'DATA-DRIVEN SKEW & VOLATILITY MODELS' },
  { id: 'CHART', label: 'CHARTIST', icon: <LineChart size={20} />, desc: 'PRICE LADDER & FULL SCREEN CHARTS' },
  { id: 'PSYCHO', label: 'PSYCHO', icon: <BrainCircuit size={20} />, desc: 'ALL-IN-ONE COMPLEX COMMAND CENTER' },
  { id: 'API', label: 'API DEV', icon: <Settings2 size={20} />, desc: 'PROTOCOL HEADS-UP DASHBOARD' },
  { id: 'CUSTOM', label: 'CUSTOM', icon: <Plus size={20} />, desc: 'USER DEFINED GRID LAYOUTS' },
];

export const WorkspaceSelector: React.FC<{ model: Model }> = ({ model }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { workspace, setWorkspace } = useLayoutStore();

  const handleSaveCustom = () => {
      const json = model.toJson();
      localStorage.setItem('opentrader_custom_layout', JSON.stringify(json));
      setWorkspace('CUSTOM');
      setIsOpen(false);
  };

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        style={{ 
          height: '28px', padding: '0 12px', background: '#000000', border: `1px solid #333333`,
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          fontFamily: TYPE.family.mono, fontSize: '10px', color: '#FF7722',
          letterSpacing: '0.1em', fontWeight: 'bold'
        }}
        className="hover:border-interactive-hover transition-colors"
      >
        <Layout size={14} />
        {workspace.toUpperCase()}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark simple overlay */}
            <div 
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000 }} 
            />
            
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10001, width: '600px', background: '#000000', border: `1px solid #FF7722`, boxShadow: `0 0 100px rgba(255,119,34,0.15)` }}>
                <div style={{ height: '40px', background: '#000000', borderBottom: `1px solid #222222`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
                    <span style={{ fontFamily: TYPE.family.mono, fontSize: '12px', fontWeight: '900', letterSpacing: '0.15em', color: '#FFFFFF' }}>SELECT WORKSPACE</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={handleSaveCustom} style={{ background: 'transparent', border: BORDER.standard, color: COLOR.text.primary, padding: '4px 8px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px' }} className="hover:text-accent-info"><Save size={12} /> SAVE CURRENT AS CUSTOM</button>
                        <X size={16} onClick={() => setIsOpen(false)} style={{ cursor: 'pointer' }} />
                    </div>
                </div>

                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {WORKSPACES.map(ws => (
                        <div 
                            key={ws.id}
                            onClick={() => { setWorkspace(ws.id); setIsOpen(false); }}
                            style={{ 
                                padding: '20px', background: workspace === ws.id ? '#FF772215' : '#050505',
                                border: workspace === ws.id ? `1px solid #FF7722` : `1px solid #222222`,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                textAlign: 'center', transition: 'all 0.05s linear'
                            }}
                            className="hover:scale-105 group"
                        >
                            <div style={{ color: workspace === ws.id ? COLOR.semantic.info : COLOR.text.muted }} className="group-hover:text-accent-info">
                                {ws.icon}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontFamily: TYPE.family.mono, fontSize: '11px', fontWeight: 'black', color: workspace === ws.id ? COLOR.semantic.info : COLOR.text.primary }}>{ws.label}</span>
                                <span style={{ fontSize: '8px', color: COLOR.text.muted, lineHeight: '1.2' }}>{ws.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
