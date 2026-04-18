import React from 'react';
import { WidgetConfig, WidgetInstanceOverride, WidgetPresentationSpec } from '../widgets/types';

export interface WidgetPresentationRuntime {
  widgetId: string;
  config: WidgetConfig;
  instanceOverride?: WidgetInstanceOverride;
  resolved: WidgetPresentationSpec;
}

const WidgetPresentationContext = React.createContext<WidgetPresentationRuntime | null>(null);

export const WidgetPresentationProvider = WidgetPresentationContext.Provider;

export function useWidgetPresentation(): WidgetPresentationRuntime | null {
  return React.useContext(WidgetPresentationContext);
}
