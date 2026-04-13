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
        fontSize: TYPE.size.xs, 
        fontWeight: TYPE.weight.black, 
        color: COLOR.text.muted, 
         
        letterSpacing: TYPE.letterSpacing.caps, 
        fontFamily: TYPE.family.mono 
      }}>
        {message}
      </div>
      {subMessage && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: TYPE.size.xs, 
          color: COLOR.text.muted, 
          fontStyle: 'italic', 
          maxWidth: '280px',
          fontFamily: TYPE.family.mono,
          opacity: 0.8
        }}>
          {subMessage}
        </div>
      )}
    </div>
  );
};
