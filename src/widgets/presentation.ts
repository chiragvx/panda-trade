import {
  AdornmentMode,
  HeaderMode,
  WidgetArchetype,
  WidgetInstanceOverride,
  WidgetPresentationSpec,
} from './types';

type PresentationOverride = Omit<Partial<WidgetPresentationSpec>, 'header'> & {
  header?: Partial<WidgetPresentationSpec['header']>;
};

const DEFAULT_HEADER = {
  mode: 'stacked' as HeaderMode,
  icon: 'show' as AdornmentMode,
  logo: 'hide' as AdornmentMode,
  subtitle: 'auto' as AdornmentMode,
  actions: 'standard' as const,
};

export const DEFAULT_WIDGET_PRESENTATION: WidgetPresentationSpec = {
  archetype: 'table',
  density: 'default',
  header: DEFAULT_HEADER,
  branding: {
    tone: 'neutral',
  },
  emptyState: 'standard',
};

export const PRESENTATION_PRESETS: Record<WidgetArchetype, WidgetPresentationSpec> = {
  table: {
    archetype: 'table',
    density: 'default',
    header: { ...DEFAULT_HEADER, mode: 'stacked', icon: 'show', logo: 'hide', subtitle: 'auto', actions: 'standard' },
    branding: { tone: 'neutral' },
    emptyState: 'standard',
  },
  chart: {
    archetype: 'chart',
    density: 'default',
    header: { ...DEFAULT_HEADER, mode: 'stacked', icon: 'show', logo: 'hide', subtitle: 'auto', actions: 'minimal' },
    branding: { tone: 'accent' },
    emptyState: 'canvas',
  },
  canvas: {
    archetype: 'canvas',
    density: 'default',
    header: { ...DEFAULT_HEADER, mode: 'minimal', icon: 'show', logo: 'hide', subtitle: 'hide', actions: 'minimal' },
    branding: { tone: 'accent' },
    emptyState: 'canvas',
  },
  account: {
    archetype: 'account',
    density: 'default',
    header: { ...DEFAULT_HEADER, mode: 'stacked', icon: 'show', logo: 'hide', subtitle: 'show', actions: 'standard' },
    branding: { tone: 'semantic' },
    emptyState: 'standard',
  },
  feed: {
    archetype: 'feed',
    density: 'default',
    header: { ...DEFAULT_HEADER, mode: 'stacked', icon: 'show', logo: 'hide', subtitle: 'show', actions: 'minimal' },
    branding: { tone: 'neutral' },
    emptyState: 'standard',
  },
  utility: {
    archetype: 'utility',
    density: 'relaxed',
    header: { ...DEFAULT_HEADER, mode: 'stacked', icon: 'auto', logo: 'show', subtitle: 'show', actions: 'standard' },
    branding: { tone: 'accent' },
    emptyState: 'minimal',
  },
  marketing: {
    archetype: 'marketing',
    density: 'relaxed',
    header: { ...DEFAULT_HEADER, mode: 'inline', icon: 'hide', logo: 'show', subtitle: 'hide', actions: 'minimal' },
    branding: { tone: 'accent' },
    emptyState: 'minimal',
  },
};

export function createWidgetPresentation(
  archetype: WidgetArchetype,
  override: PresentationOverride = {}
): WidgetPresentationSpec {
  const preset = PRESENTATION_PRESETS[archetype];
  return resolveWidgetPresentation(preset, override as Partial<WidgetPresentationSpec>);
}

export function resolveWidgetPresentation(
  base: WidgetPresentationSpec,
  override?: Partial<WidgetPresentationSpec> | WidgetInstanceOverride
): WidgetPresentationSpec {
  const next = override ?? {};
  const merged: WidgetPresentationSpec = {
    ...base,
    ...next,
    header: {
      ...base.header,
      ...(next.header ?? {}),
    },
    branding: {
      ...(base.branding ?? {}),
      ...(next.branding ?? {}),
    },
  };

  if (merged.header.logo === 'show' && merged.header.icon === 'auto') {
    merged.header.icon = 'hide';
  }

  return merged;
}
