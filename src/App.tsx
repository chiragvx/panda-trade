import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Model, IJsonModel, Actions, DockLocation } from 'flexlayout-react';
import { TopBar } from './components/TopBar/TopBar';
import { LayoutManager } from './LayoutManager';
import { OrderEntryModal } from './components/OrderEntry/OrderEntryModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { ToastContainer } from './components/ToastContainer';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { ContextMenu } from './ds/components/ContextMenu';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UpstoxCallback from './components/UpstoxCallback';
import { useSelectionStore, useLayoutStore } from './store/useStore';
import { useUpstoxStore } from './store/useUpstoxStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUpstoxBridge } from './hooks/useUpstoxBridge';
import { DVDEasterEgg } from './components/EasterEgg/DVDVideo';
import { ShieldAlert, X } from 'lucide-react';
import { TYPE } from './ds/tokens';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CASUAL_LAYOUT,
  OPTIONS_TRADER_LAYOUT,
  RESEARCH_LAYOUT,
  PORTFOLIO_MANAGER_LAYOUT,
  QUANT_LAYOUT,
  CHART_TRADER_LAYOUT,
  PSYCHO_LAYOUT
} from './constants/layouts';
import { ApiDashboard } from './layout/ApiDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const App: React.FC = () => {
  const { workspace, setWorkspace } = useLayoutStore();
  const { status, accessToken, apiKey, apiSecret } = useUpstoxStore();
  const { aisStreamApiKey, nasaApiKey } = useSettingsStore();
  const [dismissedApis, setDismissedApis] = useState<string[]>([]);
  const [dismissedNetworkMsg, setDismissedNetworkMsg] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) setDismissedNetworkMsg(false);
  }, [isOnline]);
  
  const apiFailures = useMemo(() => {
    const fails: string[] = [];
    if (!aisStreamApiKey && workspace !== 'API') fails.push('AISSTREAM_FEED');
    if (!nasaApiKey && workspace !== 'API') fails.push('NASA_FIRMS_SCANNER');
    return fails.filter(f => !dismissedApis.includes(f));
  }, [aisStreamApiKey, nasaApiKey, workspace, dismissedApis]);

  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 30000); // 30 seconds
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  useKeyboardShortcuts();
  useUpstoxBridge();

  const [model, setModel] = useState<Model>(() => {
    const savedWs = localStorage.getItem('opentrader_workspace') || 'CASUAL';
    const savedLayout = localStorage.getItem(`opentrader_layout_${savedWs}`);
    if (savedLayout) return Model.fromJson(JSON.parse(savedLayout));

    // Fallback to constants
    const mapping: Record<string, IJsonModel> = { 'CASUAL': CASUAL_LAYOUT, 'OPTIONS': OPTIONS_TRADER_LAYOUT, 'RESEARCH': RESEARCH_LAYOUT, 'PM': PORTFOLIO_MANAGER_LAYOUT, 'QUANT': QUANT_LAYOUT, 'CHART': CHART_TRADER_LAYOUT, 'PSYCHO': PSYCHO_LAYOUT };
    return Model.fromJson(mapping[savedWs] || CASUAL_LAYOUT);
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  const loadLayout = useCallback((preset: IJsonModel) => {
    const layoutEl = document.querySelector('.flexlayout__layout');
    layoutEl?.classList.add('is-transitioning');

    setIsTransitioning(true);
    setTimeout(() => {
      const newModel = Model.fromJson(preset);
      setModel(newModel);
      setIsTransitioning(false);

      setTimeout(() => {
        layoutEl?.classList.remove('is-transitioning');
      }, 350);
    }, 200);
  }, []);

  const mapping: Record<string, IJsonModel> = { 'CASUAL': CASUAL_LAYOUT, 'OPTIONS': OPTIONS_TRADER_LAYOUT, 'RESEARCH': RESEARCH_LAYOUT, 'PM': PORTFOLIO_MANAGER_LAYOUT, 'QUANT': QUANT_LAYOUT, 'CHART': CHART_TRADER_LAYOUT, 'PSYCHO': PSYCHO_LAYOUT };

  /* Workspace listener */
  useEffect(() => {
    localStorage.setItem('opentrader_workspace', workspace);

    if (workspace === 'CUSTOM') {
      const saved = localStorage.getItem('opentrader_custom_layout');
      if (saved) loadLayout(JSON.parse(saved));
      return;
    }

    if (workspace === 'API') return; // Handled by ApiDashboard

    const saved = localStorage.getItem(`opentrader_layout_${workspace}`);
    if (saved) {
      loadLayout(JSON.parse(saved));
    } else if (mapping[workspace]) {
      loadLayout(mapping[workspace]);
    }
  }, [workspace, loadLayout]);

  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      // Check if we already handled this via our custom logic
      // Most of our custom ones already call preventDefault, 
      // but this catch-all ensures the browser menu never appears.
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => window.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, []);

  useEffect(() => {
    (window as any).loadLayout = loadLayout;
    (window as any).addNodeToLayout = (componentId: string) => {
      let targetId = (window as any).activeTabsetId || undefined;
      model.doAction(Actions.addNode(
        { type: "tab", name: componentId.toUpperCase(), component: componentId },
        targetId,
        DockLocation.CENTER,
        -1,
        true // Select the tab
      ));
    };

    (window as any).replaceTab = (componentId: string) => {
      const activeId = (window as any).activeTabId;
      if (activeId) {
        model.doAction(Actions.updateNodeAttributes(activeId, {
          component: componentId,
          name: componentId.toUpperCase()
        }));
      } else {
        (window as any).addNodeToLayout(componentId);
      }
    };
  }, [loadLayout, model]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex flex-col h-screen w-screen bg-bg-base overflow-hidden selection:bg-accent-info/30 selection:text-text-primary">
          <Routes>
            <Route path="/callback" element={<UpstoxCallback />} />
            <Route path="*" element={
              <>
                <AnimatePresence>
                  {(!isOnline && !dismissedNetworkMsg) && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      style={{
                        position: 'fixed',
                        top: '100px',
                        right: '24px',
                        zIndex: 10002,
                        background: '#111',
                        border: '1px solid #ff3b57',
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b57', animation: 'pulse 1.5s infinite' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff', letterSpacing: '0.05em', fontFamily: TYPE.family.mono }}>
                          TERMINAL_UNSTABLE
                        </span>
                        <span style={{ fontSize: '11px', color: '#ff3b57', fontWeight: 'bold' }}>
                          Network disconnected, Please try again.
                        </span>
                      </div>
                      <button 
                         onClick={() => setDismissedNetworkMsg(true)}
                         style={{ 
                            marginLeft: '8px', background: 'transparent', border: 'none', 
                            color: '#666', cursor: 'pointer', padding: '4px', display: 'flex',
                            pointerEvents: 'auto'
                         }}
                      >
                         <X size={12} />
                      </button>
                    </motion.div>
                  )}
                  {apiFailures.map((apiName, idx) => (
                    <motion.div
                      key={apiName}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      style={{
                        position: 'fixed',
                        top: `${160 + idx * 56}px`,
                        right: '24px',
                        zIndex: 10002,
                        background: '#050505',
                        border: '1px solid #ff3b57',
                        borderLeftWidth: '4px',
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        pointerEvents: 'none'
                      }}
                    >
                      <ShieldAlert size={16} color="#ff3b57" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '9px', fontWeight: '900', color: '#ff3b57', letterSpacing: '0.1em', fontFamily: TYPE.family.mono }}>
                          [API_FAIL]
                        </span>
                        <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', fontFamily: TYPE.family.mono }}>
                          {apiName}
                        </span>
                      </div>
                      <button 
                         onClick={() => setDismissedApis(v => [...v, apiName])}
                         style={{ 
                            marginLeft: '8px', background: 'transparent', border: 'none', 
                            color: '#666', cursor: 'pointer', padding: '4px', display: 'flex',
                            pointerEvents: 'auto'
                         }}
                      >
                         <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {status !== 'connected' && (
                  <div style={{
                    width: '100%',
                    height: '24px',
                    background: (!apiKey || !apiSecret) ? '#FF7722' : '#ff3b57',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    zIndex: 10001,
                    position: 'relative'
                  }}>
                    <ShieldAlert size={14} color="#fff" />
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff', letterSpacing: '0.1em', fontFamily: TYPE.family.mono }}>
                      {(!apiKey || !apiSecret) 
                        ? 'BROKER_SETUP_REQUIRED: API_KEYS_MISSING • TERMINAL_INACTIVE'
                        : 'SESSION_EXPIRED: HANDSHAKE_INVALID • RECONNECT_REQUIRED'}
                    </span>
                    <button 
                      onClick={() => setWorkspace('API')}
                      style={{
                        background: '#fff',
                        border: 'none',
                        color: (!apiKey || !apiSecret) ? '#FF7722' : '#ff3b57',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '1px 8px',
                        cursor: 'pointer',
                        fontFamily: TYPE.family.mono
                      }}
                    >
                      {(!apiKey || !apiSecret) ? 'CONFIGURE_API' : 'RECONNECT_NOW'}
                    </button>
                  </div>
                )}
                <TopBar model={model} />

                <main className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  {workspace === 'API' ? (
                    <ApiDashboard />
                  ) : (
                    <LayoutManager model={model} />
                  )}
                </main>

                <OrderEntryModal />
                <DisclaimerModal />
                <ContextMenu />
                <ToastContainer />
                <CommandPalette />

                {isIdle && <DVDEasterEgg />}
                <div className="fixed top-0 left-0 w-full h-[1px] bg-border z-[10000] pointer-events-none opacity-20" />
              </>
            } />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
