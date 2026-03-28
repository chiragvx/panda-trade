import React from 'react';
import { COLOR, TYPE } from '../tokens';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  subMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  message, 
  subMessage,
  className,
  style
}) => {
  return (
    <div 
      className={className}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center',
        background: 'transparent',
        ...style
      }}
    >
      {icon && (
        <div style={{ 
          marginBottom: '16px', 
          color: COLOR.text.muted, 
          opacity: 0.3 
        }}>
          {icon}
        </div>
      )}
      <div style={{ 
        fontSize: '10px', 
        fontWeight: TYPE.weight.bold, 
        color: COLOR.text.muted, 
        textTransform: 'uppercase', 
        letterSpacing: TYPE.letterSpacing.caps, 
        fontFamily: TYPE.family.mono 
      }}>
        {message}
      </div>
      {subMessage && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '9px', 
          color: COLOR.text.muted, 
          fontStyle: 'italic', 
          maxWidth: '240px',
          fontFamily: TYPE.family.mono
        }}>
          {subMessage}
        </div>
      )}
    </div>
  );
};
