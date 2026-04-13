import React from 'react';
import { ShieldAlert, Database, WifiOff } from 'lucide-react';
import { COLOR, TYPE, BORDER, SPACE } from '../ds/tokens';
import { useUpstoxStore } from '../store/useUpstoxStore';

interface WidgetStateWrapperProps {
  children: React.ReactNode;
  id: string; // widget id
}

export const WidgetStateWrapper: React.FC<WidgetStateWrapperProps> = ({ children, id }) => {
  const { status, accessToken } = useUpstoxStore();
  const [isOnline, setIsOnline] = React.useState(window.navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. No Connection Logic (Universal)
  // These specific widgets are "Local Games" or "Static" and don't need a connection
  const isLocalWidget = ['snake', 'minesweeper', 'wordle', 'news'].includes(id);
  
  // Show error ONLY if truly offline (no internet)
  const isDisconnected = !isLocalWidget && !isOnline;

  if (isDisconnected) {
    return (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLOR.bg.base,
        gap: '16px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: `${COLOR.semantic.down}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLOR.semantic.down
        }}>
          <WifiOff size={24} />
        </div>
        <div>
          <div style={{ 
            fontSize: TYPE.size.xs, 
            fontWeight: TYPE.weight.black, 
            color: COLOR.text.primary, 
            letterSpacing: TYPE.letterSpacing.caps,
            marginBottom: '4px',
            fontFamily: TYPE.family.mono 
          }}>
            CONNECTION_LOST
          </div>
          <div style={{ 
            fontSize: TYPE.size.xs, 
            color: COLOR.text.muted,
            lineHeight: '1.4',
            maxWidth: '220px',
            fontWeight: TYPE.weight.bold
          }}>
            BROKER_SESSION_TERMINATED. ACTIVATE_GATEWAY_TO_RESUME_SYNC.
          </div>
        </div>
      </div>
    );
  }

  // Note: "No Data" state (State 2) is handled inside individual widgets 
  // because the wrapper doesn't know the data status of arbitrary children.
  // However, for "Partial Data" (State 3), the wrapper does nothing as requested.

  return <>{children}</>;
};
