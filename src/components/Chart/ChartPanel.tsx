import React from 'react';
import { useSelectionStore } from '../../store/useStore';

export const ChartPanel: React.FC = () => {
  const { selectedSymbol } = useSelectionStore();

  return (
    <div className="flex-1 flex flex-col bg-bg-primary min-w-0 h-full relative">
      <div className="h-10 bg-bg-secondary border-b border-border px-3 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wide uppercase">
          {selectedSymbol?.ticker || 'SELECT SYMBOL'}
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center text-text-muted text-xs font-mono">
        NO CHART DATA AVAILABLE
      </div>
    </div>
  );
};
