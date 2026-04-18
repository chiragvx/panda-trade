import React from 'react';
import { BORDER, COLOR, SPACE, TYPE } from '../tokens';
import { maybeHumanizeNode } from '../textFormat';

interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, actions, style }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: SPACE[4],
      paddingBottom: SPACE[3],
      borderBottom: BORDER.standard,
      ...style,
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[1], minWidth: 0 }}>
      <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.xl, fontWeight: TYPE.weight.bold, color: COLOR.text.primary }}>
        {maybeHumanizeNode(title)}
      </span>
      {subtitle ? (
        <span style={{ fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm, color: COLOR.text.muted, lineHeight: TYPE.lineHeight.standard }}>
          {maybeHumanizeNode(subtitle)}
        </span>
      ) : null}
    </div>
    {actions ? <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>{actions}</div> : null}
  </div>
);
