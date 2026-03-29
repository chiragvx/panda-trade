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
        background: '#050505',
        gap: '16px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255, 59, 87, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff3b57'
        }}>
          <WifiOff size={24} />
        </div>
        <div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '900', 
            color: '#fff', 
            letterSpacing: '0.1em',
            marginBottom: '4px',
            fontFamily: TYPE.family.mono 
          }}>
            CONNECTION_LOST
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: COLOR.text.muted,
            lineHeight: '1.4',
            maxWidth: '180px'
          }}>
            BROKER SESSION TERMINATED. PLEASE RE-AUTHENTICATE TO RESUME STREAM.
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
