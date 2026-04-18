import React from 'react';
import { ApiDashboard } from './ApiDashboard';

interface ApiPageProps {
  integrated?: boolean;
}

export const ApiPage: React.FC<ApiPageProps> = ({ integrated = false }) => {
  return (
    <div style={{
      minHeight: integrated ? '100%' : '100vh',
      height: integrated ? '100%' : 'auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ApiDashboard />
      </div>
    </div>
  );
};
