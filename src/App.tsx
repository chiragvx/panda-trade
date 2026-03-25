import React, { useState, useEffect, useCallback } from 'react';
import { Model, IJsonModel, Actions, DockLocation } from 'flexlayout-react';
import { TopBar } from './components/TopBar/TopBar';
import { LayoutManager } from './LayoutManager';
import { OrderEntryModal } from './components/OrderEntry/OrderEntryModal';
import { ToastContainer } from './components/ToastContainer';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UpstoxCallback from './components/UpstoxCallback';
import { useLayoutStore } from './store/useStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUpstoxBridge } from './hooks/useUpstoxBridge';
import { EXECUTION_LAYOUT, ANALYSIS_LAYOUT, DERIVATIVES_LAYOUT } from './constants/layouts';
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
  const { workspace } = useLayoutStore();
  useKeyboardShortcuts();
  useUpstoxBridge();
  
  const [model, setModel] = useState<Model>(() => {
    const saved = localStorage.getItem('opentrader_layout');
    return Model.fromJson(saved ? JSON.parse(saved) : EXECUTION_LAYOUT);
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

  /* Workspace listener */
  useEffect(() => {
    if (workspace === 'EXECUTION') loadLayout(EXECUTION_LAYOUT);
    else if (workspace === 'ANALYSIS') loadLayout(ANALYSIS_LAYOUT);
    else if (workspace === 'DERIVATIVES') loadLayout(DERIVATIVES_LAYOUT);
  }, [workspace, loadLayout]);


  useEffect(() => {
    (window as any).loadLayout = loadLayout;
    (window as any).addNodeToLayout = (componentId: string) => {
      let targetId = (window as any).activeTabsetId || undefined;
      
      model.doAction(Actions.addNode(
        { type: "tab", name: componentId.charAt(0).toUpperCase() + componentId.slice(1), component: componentId },
        targetId,
        DockLocation.CENTER,
        -1
      ));
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
                <TopBar model={model} />

                <main className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  {workspace === 'API' ? (
                    <ApiDashboard />
                  ) : (
                    <LayoutManager model={model} />
                  )}
                </main>

                <OrderEntryModal />
                <ToastContainer />
                <CommandPalette />
                
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
