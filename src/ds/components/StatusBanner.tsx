import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { COLOR, BORDER, TYPE } from '../tokens';

interface StatusBannerProps {
  variant: 'disconnected' | 'warning' | 'info' | 'success';
  message: string;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ 
  variant, 
  message,
  className,
  style
}) => {
  const getColors = () => {
    switch (variant) {
      case 'disconnected': 
        return { 
          bg: COLOR.bg.statusError, 
          text: COLOR.semantic.down, 
          icon: <AlertCircle size={10} color={COLOR.semantic.down} />,
          borderBottom: `1px solid ${COLOR.semantic.down}40`
        };
      case 'warning': 
        return { 
          bg: COLOR.bg.statusWarning, 
          text: COLOR.semantic.warning, 
          icon: <AlertCircle size={10} color={COLOR.semantic.warning} />,
          borderBottom: BORDER.warning 
        };
      case 'success': 
        return { 
          bg: COLOR.bg.statusSuccess, 
          text: COLOR.semantic.up, 
          icon: <CheckCircle2 size={10} color={COLOR.semantic.up} />,
          borderBottom: BORDER.up 
        };
      case 'info':
      default:
        return { 
          bg: COLOR.bg.statusInfo, 
          text: COLOR.semantic.info, 
          icon: <Info size={10} color={COLOR.semantic.info} />,
          borderBottom: BORDER.info 
        };
    }
  };

  const { bg, text, icon, borderBottom } = getColors();

  return (
    <div 
      className={className}
      style={{
        padding: '2px 12px',
        background: bg,
        borderBottom: borderBottom || BORDER.standard,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        flexShrink: 0,
        ...style
      }}
    >
      {icon}
      <span style={{ 
        fontSize: TYPE.size.xs, 
        fontWeight: TYPE.weight.black, 
        color: text, 
        letterSpacing: TYPE.letterSpacing.caps,
        textTransform: 'uppercase',
        fontFamily: TYPE.family.mono
      }}>
        {message}
      </span>
    </div>
  );
};
