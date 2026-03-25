import React from 'react';

export interface WidgetConfig {
  id: string;
  displayName: string;
  icon: string;              // Lucide icon name
  shortcut: string;
  defaultSize?: { width: number; height: number };
  minSize?:     { width: number; height: number };
  singleton: boolean;          // false = multiple instances allowed
  category: 'Market Data' | 'Analytics' | 'Charts & Analytics' | 'Options' | 'Account' | 'Graphs' | 'Tools' | 'Scalping' | 'Take a Break' | 'Institutional Intel';
}

export type WidgetMap = Record<string, WidgetConfig>;
