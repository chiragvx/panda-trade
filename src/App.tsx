import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Model, IJsonModel, Actions, DockLocation } from 'flexlayout-react';
import { TopBar } from './components/TopBar/TopBar';
import { LayoutManager } from './LayoutManager';
import { DisclaimerModal } from './components/DisclaimerModal';
import { ToastContainer } from './components/ToastContainer';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { ContextMenu } from './ds/components/ContextMenu';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, useNavigate } from 'react-router-dom';
import UpstoxCallback from './components/UpstoxCallback';
import LandingPage from './layout/LandingPage';
import { DesignSystemShowcase } from './layout/DesignSystemShowcase';
import { useUpstoxStore } from './store/useUpstoxStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUpstoxBridge } from './hooks/useUpstoxBridge';
import { Analytics } from '@vercel/analytics/react';
import { DVDEasterEgg } from './components/EasterEgg/DVDVideo';
import { ShieldAlert, X } from 'lucide-react';
import { TYPE, COLOR } from './ds/tokens';
import { humanizeLabel } from './ds/textFormat';
import { ActionWrapper, Button, Text } from './ds';
import { motion, AnimatePresence } from 'framer-motion';
import { CASUAL_LAYOUT } from './constants/layouts';
import { ApiPage } from './layout/ApiPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

interface WorkspaceShellProps {
  model: Model;
  status: string;
  apiKey: string;
  apiSecret: string;
  isOnline: boolean;
  dismissedNetworkMsg: boolean;
  setDismissedNetworkMsg: React.Dispatch<React.SetStateAction<boolean>>;
  apiFailures: string[];
  setDismissedApis: React.Dispatch<React.SetStateAction<string[]>>;
  navigate: ReturnType<typeof useNavigate>;
  isTransitioning: boolean;
  isIdle: boolean;
  children: React.ReactNode;
}

const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  model,
  status,
  apiKey,
  apiSecret,
  isOnline,
  dismissedNetworkMsg,
  setDismissedNetworkMsg,
  apiFailures,
  setDismissedApis,
  navigate,
  isTransitioning,
  isIdle,
  children,
}) => (
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
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: '8px', height: '8px', background: COLOR.semantic.down }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text size="xs" weight="bold" color="primary">{humanizeLabel('TERMINAL_UNSTABLE')}</Text>
            <Text size="xs" weight="bold" color="down">Network disconnected. Re-syncing gateway...</Text>
          </div>
          <ActionWrapper
            onClick={() => setDismissedNetworkMsg(true)}
            style={{ marginLeft: '8px', pointerEvents: 'auto' }}
          >
            <X size={12} />
          </ActionWrapper>
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
            pointerEvents: 'none',
          }}
        >
          <ShieldAlert size={16} color={COLOR.semantic.down} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text size="xs" weight="bold" color="down">[{humanizeLabel('API_FAIL')}]</Text>
            <Text size="xs" weight="bold" color="primary">{humanizeLabel(apiName)}</Text>
          </div>
          <ActionWrapper
            onClick={() => setDismissedApis((v) => [...v, apiName])}
            style={{ marginLeft: '8px', pointerEvents: 'auto' }}
          >
            <X size={12} />
          </ActionWrapper>
        </motion.div>
      ))}
    </AnimatePresence>

    {status !== 'connected' && (
      <div
        style={{
          width: '100%',
          height: '24px',
          background: (!apiKey || !apiSecret) ? '#FF7722' : COLOR.semantic.down,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          zIndex: 10001,
          position: 'relative',
        }}
      >
        <ShieldAlert size={14} color={COLOR.text.inverse} />
        <span style={{ fontSize: TYPE.size.xs, fontWeight: TYPE.weight.black, color: COLOR.text.inverse, letterSpacing: TYPE.letterSpacing.caps, fontFamily: TYPE.family.mono }}>
          {(!apiKey || !apiSecret)
            ? `${humanizeLabel('BROKER_SETUP_REQUIRED: API_KEYS_MISSING')} • ${humanizeLabel('INACTIVE')}`
            : `${humanizeLabel('SESSION_EXPIRED: HANDSHAKE_INVALID')} • ${humanizeLabel('RECONNECT_REQUIRED')}`}
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => navigate('/api')}
          style={{
            background: COLOR.text.inverse,
            color: (!apiKey || !apiSecret) ? '#FF7722' : COLOR.semantic.down,
            border: 'none',
          }}
        >
          {(!apiKey || !apiSecret) ? 'Configure API' : 'Reconnect'}
        </Button>
      </div>
    )}

    <TopBar model={model} />

    <main className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {children}
    </main>

    <DisclaimerModal />
    <ContextMenu />
    <ToastContainer />
    <CommandPalette />

    {isIdle && <DVDEasterEgg />}
    <div className="fixed top-0 left-0 w-full h-[1px] bg-border z-[10000] pointer-events-none opacity-20" />
  </div>
);

const App: React.FC = () => {
  const { status, apiKey, apiSecret } = useUpstoxStore();
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
    if (enabledConnections.includes('nasa-01') && !nasaApiKey) fails.push('NASA_FIRMS_SCANNER');
    return fails.filter((f) => !dismissedApis.includes(f));
  }, [aisStreamApiKey, nasaApiKey, enabledConnections, dismissedApis]);

  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 30000);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
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
    (window as any).addNodeToLayout = (componentId: string, nodeName?: string) => {
      const targetId = (window as any).activeTabsetId || undefined;
      model.doAction(
        Actions.addNode(
          { type: 'tab', name: nodeName || componentId, component: componentId },
          targetId,
          DockLocation.CENTER,
          -1,
          true
        )
      );
    };

    (window as any).replaceTab = (componentId: string, nodeName?: string) => {
      const activeId = (window as any).activeTabId;
      if (activeId) {
        model.doAction(
          Actions.updateNodeAttributes(activeId, {
            component: componentId,
            name: nodeName || componentId,
          })
        );
      } else {
        (window as any).addNodeToLayout(componentId, nodeName);
      }
    };
  }, [loadLayout, model]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen w-screen bg-bg-base selection:bg-accent-info/30 selection:text-text-primary">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/callback" element={<UpstoxCallback />} />
          <Route
            path="/api"
            element={
              <WorkspaceShell
                model={model}
                status={status}
                apiKey={apiKey}
                apiSecret={apiSecret}
                isOnline={isOnline}
                dismissedNetworkMsg={dismissedNetworkMsg}
                setDismissedNetworkMsg={setDismissedNetworkMsg}
                apiFailures={apiFailures}
                setDismissedApis={setDismissedApis}
                navigate={navigate}
                isTransitioning={false}
                isIdle={isIdle}
              >
                <ApiPage integrated />
              </WorkspaceShell>
            }
          />
          <Route path="/design-system" element={<DesignSystemShowcase />} />
          <Route
            path="/app"
            element={
              <WorkspaceShell
                model={model}
                status={status}
                apiKey={apiKey}
                apiSecret={apiSecret}
                isOnline={isOnline}
                dismissedNetworkMsg={dismissedNetworkMsg}
                setDismissedNetworkMsg={setDismissedNetworkMsg}
                apiFailures={apiFailures}
                setDismissedApis={setDismissedApis}
                navigate={navigate}
                isTransitioning={isTransitioning}
                isIdle={isIdle}
              >
                <LayoutManager model={model} />
              </WorkspaceShell>
            }
          />
        </Routes>
        <Analytics />
      </div>
    </QueryClientProvider>
  );
};

export default App;
