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
import { Routes, Route } from 'react-router-dom';
import UpstoxCallback from './components/UpstoxCallback';
import LandingPage from './layout/LandingPage';
import { useSelectionStore, useLayoutStore } from './store/useStore';
import { useUpstoxStore } from './store/useUpstoxStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUpstoxBridge } from './hooks/useUpstoxBridge';
import { Analytics } from '@vercel/analytics/react';
import { DVDEasterEgg } from './components/EasterEgg/DVDVideo';
import { ShieldAlert, X } from 'lucide-react';
import { TYPE, COLOR } from './ds/tokens';
import { motion, AnimatePresence } from 'framer-motion';
import { CASUAL_LAYOUT } from './constants/layouts';
import { ApiPage } from './layout/ApiPage';
import { useNavigate } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const App: React.FC = () => {
  const { status, accessToken, apiKey, apiSecret } = useUpstoxStore();
  const { aisStreamApiKey, nasaApiKey, enabledConnections } = useSettingsStore();
  const [dismissedApis, setDismissedApis] = useState<string[]>([]);
  const [dismissedNetworkMsg, setDismissedNetworkMsg] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const navigate = useNavigate();

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
    if (enabledConnections.includes('aisstream-01') && !aisStreamApiKey) fails.push('AISSTREAM_FEED');
    if (enabledConnections.includes('nasa-01') && !nasaApiKey) fails.push('NASA_FIRMS_SCANNER');
    return fails.filter(f => !dismissedApis.includes(f));
  }, [aisStreamApiKey, nasaApiKey, enabledConnections, dismissedApis]);

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
    const savedLayout = localStorage.getItem('opentrader_layout');
    if (savedLayout) return Model.fromJson(JSON.parse(savedLayout));
    return Model.fromJson(CASUAL_LAYOUT);
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

  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
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
        <div className="flex flex-col min-h-screen w-screen bg-bg-base selection:bg-accent-info/30 selection:text-text-primary">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/callback" element={<UpstoxCallback />} />
            <Route path="/api" element={<ApiPage />} />
            <Route path="/app" element={
              <div className="h-screen w-screen overflow-hidden flex flex-col">
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
                        background: COLOR.bg.overlay,
                        border: `1px solid ${COLOR.semantic.down}`,
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                        pointerEvents: 'none',
                        backdropFilter: 'blur(12px)'
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR.semantic.down, animation: 'pulse 1.5s infinite' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.primary, letterSpacing: TYPE.letterSpacing.caps, fontFamily: TYPE.family.mono }}>
                          TERMINAL_UNSTABLE
                        </span>
                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.semantic.down, fontWeight: TYPE.weight.bold, letterSpacing: TYPE.letterSpacing.tight }}>
                          Network disconnected. Re-syncing gateway...
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
                        background: COLOR.bg.overlay,
                        border: `1px solid ${COLOR.semantic.down}`,
                        borderLeftWidth: '4px',
                        padding: '10px 16px',
                        display: 'flex',
                         alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                        backdropFilter: 'blur(12px)'
                      }}
                    >
                      <ShieldAlert size={16} color={COLOR.semantic.down} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.semantic.down, letterSpacing: TYPE.letterSpacing.caps, fontFamily: TYPE.family.mono }}>
                          [API_FAIL]
                        </span>
                        <span style={{ fontSize: TYPE.size.xs, color: COLOR.text.primary, fontWeight: TYPE.weight.bold, fontFamily: TYPE.family.mono }}>
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
                    background: (!apiKey || !apiSecret) ? '#FF7722' : COLOR.semantic.down,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    zIndex: 10001,
                    position: 'relative'
                  }}>
                    <ShieldAlert size={14} color={COLOR.text.inverse} />
                    <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.inverse, letterSpacing: TYPE.letterSpacing.caps, fontFamily: TYPE.family.mono }}>
                      {(!apiKey || !apiSecret) 
                        ? 'BROKER_SETUP_REQUIRED: API_KEYS_MISSING • INACTIVE'
                        : 'SESSION_EXPIRED: HANDSHAKE_INVALID • RECONNECT_REQUIRED'}
                    </span>
                    <button 
                      onClick={() => navigate('/api')}
                      style={{
                        background: COLOR.text.inverse,
                        border: 'none',
                        color: (!apiKey || !apiSecret) ? '#FF7722' : COLOR.semantic.down,
                        fontSize: TYPE.size.xs,
                        fontWeight: TYPE.weight.black,
                        padding: '1px 10px',
                        cursor: 'pointer',
                        fontFamily: TYPE.family.mono,
                        letterSpacing: TYPE.letterSpacing.caps,
                        borderRadius: '2px'
                      }}
                    >
                      {(!apiKey || !apiSecret) ? 'CONFIGURE_API' : 'RECONNECT'}
                    </button>
                  </div>
                )}
                <TopBar model={model} />

                <main className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  <LayoutManager model={model} />
                </main>

                <OrderEntryModal />
                <DisclaimerModal />
                <ContextMenu />
                <ToastContainer />
                <CommandPalette />

                {isIdle && <DVDEasterEgg />}
                <div className="fixed top-0 left-0 w-full h-[1px] bg-border z-[10000] pointer-events-none opacity-20" />
              </div>
            } />
          </Routes>
          <Analytics />
        </div>
    </QueryClientProvider>
  );
};

export default App;
