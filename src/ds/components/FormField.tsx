import React from 'react';
import { SPACE, TYPE, COLOR } from '../tokens';
import { maybeHumanizeNode } from '../textFormat';

interface FormFieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const FormField: React.FC<FormFieldProps> = ({ label, hint, children, style }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2], ...style }}>
    <span
      style={{
        fontFamily: TYPE.family.mono,
        fontSize: TYPE.size.xs,
        fontWeight: TYPE.weight.bold,
        color: COLOR.text.muted,
        letterSpacing: TYPE.letterSpacing.caps,
      }}
    >
      {maybeHumanizeNode(label)}
    </span>
    {children}
    {hint ? (
      <span
        style={{
        fontFamily: TYPE.family.mono,
        fontSize: TYPE.size.xs,
        color: COLOR.text.muted,
        lineHeight: TYPE.lineHeight.standard,
      }}
    >
      {maybeHumanizeNode(hint)}
    </span>
  ) : null}
  </label>
);
