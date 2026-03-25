import React from 'react';
import { Maximize2, Minimize2, RefreshCw, Unlink, Link as LinkIcon, X } from 'lucide-react';

interface WidgetWrapperProps {
  id: string;
  title: string;
  isLinked: boolean;
  onRemove: () => void;
  onToggleLink: () => void;
  onRefresh?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  id,
  title,
  isLinked,
  onRemove,
  onToggleLink,
  onRefresh,
  children,
  className,
  style,
  ...props
}) => {
  return (
    <div 
      className={`bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg shadow-2xl overflow-hidden flex flex-col group ${className}`}
      style={style}
      {...props}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#141414] border-b border-[#1E1E1E] select-none drag-handle cursor-move">
        <div className="flex items-center gap-2">
          {isLinked && <LinkIcon size={14} className="text-accent-info" />}
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onRefresh} className="p-1 hover:bg-[#2A2A2A] rounded transition-colors text-text-muted hover:text-text-primary">
            <RefreshCw size={14} />
          </button>
          <button onClick={onToggleLink} className={`p-1 hover:bg-[#2A2A2A] rounded transition-colors ${isLinked ? 'text-accent-info' : 'text-text-muted hover:text-text-primary'}`}>
            {isLinked ? <LinkIcon size={14} /> : <Unlink size={14} />}
          </button>
          <button onClick={onRemove} className="p-1 hover:bg-accent-danger/20 hover:text-accent-danger rounded transition-colors text-text-muted">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-auto bg-transparent custom-scrollbar">
        {children}
      </div>
    </div>
  );
};
