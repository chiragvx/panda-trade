export type AdornmentMode = 'auto' | 'show' | 'hide';
export type HeaderMode = 'stacked' | 'inline' | 'minimal' | 'hidden';
export type WidgetArchetype = 'table' | 'chart' | 'canvas' | 'account' | 'feed' | 'utility' | 'marketing';

export interface WidgetPresentationSpec {
  archetype: WidgetArchetype;
  density: 'compact' | 'default' | 'relaxed';
  header: {
    mode: HeaderMode;
    icon: AdornmentMode;
    logo: AdornmentMode;
    subtitle: AdornmentMode;
    actions: 'standard' | 'minimal' | 'none';
  };
  branding: {
    iconKey?: string;
    logoKey?: string;
    tone?: 'neutral' | 'accent' | 'semantic';
  };
  emptyState: 'standard' | 'canvas' | 'minimal';
}

export interface WidgetInstanceOverride extends Partial<WidgetPresentationSpec> {}

export interface WidgetConfig {
  id: string;
  displayName: string;
  icon: string; // Lucide icon name
  shortcut: string;
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  singleton: boolean;
  category: 'Market Data' | 'Analytics' | 'Charts & Analytics' | 'Options' | 'Account' | 'Graphs' | 'Tools' | 'Scalping' | 'Take a Break' | 'Institutional Intel';
  presentation: WidgetPresentationSpec;
}

export type WidgetMap = Record<string, WidgetConfig>;
