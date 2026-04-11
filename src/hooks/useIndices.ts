import { useEffect } from 'react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { upstoxWebSocket } from '../services/upstoxWebSocket';

export const MAJOR_INDICES = [
  { ticker: 'NIFTY 50', key: 'NSE_INDEX|Nifty 50' },
  { ticker: 'NIFTY BANK', key: 'NSE_INDEX|Nifty Bank' },
  { ticker: 'NIFTY FIN SERVICE', key: 'NSE_INDEX|Nifty Fin Service' },
  { ticker: 'NIFTY MIDCAP 150', key: 'NSE_INDEX|Nifty Midcap 150' },
  { ticker: 'NIFTY NEXT 50', key: 'NSE_INDEX|Nifty Next 50' },
  { ticker: 'SENSEX', key: 'BSE_INDEX|SENSEX' },
];

export const useIndices = () => {
  const { prices, accessToken, status } = useUpstoxStore();

  useEffect(() => {
    if (status === 'connected' && accessToken) {
      const keys = MAJOR_INDICES.map(i => i.key);
      upstoxWebSocket.subscribe(keys, 'ltpc');
    }
  }, [status, accessToken]);

  const indicesData = MAJOR_INDICES.map(idx => {
    const data = prices[idx.key];
    return {
      ticker: idx.ticker,
      instrument_key: idx.key,
      ltp: data?.ltp || 0,
      change: data?.change || 0,
      pChange: data?.pChange || 0,
    };
  });

  return indicesData;
};
