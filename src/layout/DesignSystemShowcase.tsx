import React from 'react';
import { Activity, Search, Settings, ShieldCheck, Zap } from 'lucide-react';
import {
  ActionWrapper,
  BrandLockup,
  Button,
  COLOR,
  CommandSurface,
  FieldWrapper,
  FormField,
  IconWrapper,
  Input,
  KeyBadge,
  MetricWrapper,
  OverlayShell,
  PageShell,
  SectionHeader,
  Select,
  SPACE,
  StatusWrapper,
  Tag,
  Text,
  Toolbar,
} from '../ds';

export const DesignSystemShowcase: React.FC = () => {
  return (
    <PageShell
      title="DESIGN SYSTEM"
      subtitle="Wrapper, atom, shell, and archetype preview route"
      icon={<Zap size={12} />}
      tone="accent"
      actions={
        <div style={{ display: 'flex', gap: SPACE[2] }}>
          <StatusWrapper label="SHOWCASE" tone="accent" />
          <KeyBadge keys="/design-system" />
        </div>
      }
    >
      <div style={{ display: 'grid', gap: SPACE[6] }}>
        <SectionHeader title="WRAPPERS" subtitle="Identity, metrics, actions, and status surfaces." />
        <div style={{ display: 'flex', gap: SPACE[3], flexWrap: 'wrap' }}>
          <BrandLockup icon={<Activity size={12} />} title="Watchlist" subtitle="table archetype" />
          <MetricWrapper label="FUNDS" value="₹12,54,320" tone="accent" />
          <StatusWrapper label="LIVE" tone="up" />
          <ActionWrapper tone="accent">
            <Settings size={14} />
          </ActionWrapper>
        </div>

        <SectionHeader title="ATOMS" subtitle="Shared control scale with flat edges and even-only typography." />
        <div style={{ display: 'flex', gap: SPACE[3], flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="ghost">GHOST</Button>
          <Button variant="accent">ACCENT</Button>
          <Button variant="filled">FILLED</Button>
          <Tag label="CONNECTED" variant="up" />
          <KeyBadge keys="CTRL + K" />
          <IconWrapper icon={<ShieldCheck size={12} />} tone="accent" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: SPACE[4] }}>
          <FormField label="SEARCH">
            <FieldWrapper prefix={<Search size={14} color={COLOR.text.muted} />}>
              <Input value="NIFTY 50" readOnly variant="ghost" inputSize="md" style={{ border: 'none', height: '100%' }} />
            </FieldWrapper>
          </FormField>
          <FormField label="STATUS FILTER">
            <Select defaultValue="CONNECTED">
              <option value="CONNECTED">CONNECTED</option>
              <option value="DISCONNECTED">DISCONNECTED</option>
            </Select>
          </FormField>
        </div>

        <SectionHeader title="SHELLS" subtitle="Toolbar, command surface, and widget-like composition." />
        <div style={{ border: `1px solid ${COLOR.bg.border}`, background: COLOR.bg.surface }}>
          <Toolbar>
            <Toolbar.Left>
              <BrandLockup icon={<Zap size={12} />} title="Chart Widget" subtitle="stacked header" tone="accent" />
            </Toolbar.Left>
            <Toolbar.Right>
              <StatusWrapper label="READY" tone="up" />
            </Toolbar.Right>
          </Toolbar>
          <div style={{ padding: SPACE[4] }}>
            <Text size="sm" color="secondary">
              Shared shell primitives let widgets keep behavior while moving chrome ownership into the design system.
            </Text>
          </div>
        </div>

        <CommandSurface
          width="100%"
          header={<div style={{ padding: SPACE[3] }}><Text size="xs" color="muted">COMMAND SURFACE</Text></div>}
          footer={<div style={{ padding: SPACE[3] }}><StatusWrapper label="TERMINAL_READY" tone="up" /></div>}
        >
          <div style={{ padding: SPACE[4], display: 'grid', gap: SPACE[2] }}>
            <Text weight="bold">NIFTY 50</Text>
            <Text size="xs" color="muted">Registry-driven command rows and keyboard affordances live here.</Text>
          </div>
        </CommandSurface>
      </div>
    </PageShell>
  );
};
