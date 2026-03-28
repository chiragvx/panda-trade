import { useState, useEffect, useMemo, useCallback } from 'react';
import { upstoxApi } from '../../services/upstoxApi';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { calcIV, calcHV } from '../../utils/blackScholes';

export interface SurfacePoint {
  strike: number;
  expiry: string;
  tte: number;
  iv: number;
  type: 'CE' | 'PE';
}

export const useVolSurfaceData = (symbolKey: string) => {
  const { accessToken, prices } = useUpstoxStore();
  const [expiries, setExpiries] = useState<string[]>([]);
  const [surfaceData, setSurfaceData] = useState<SurfacePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hvData, setHvData] = useState<{ hv30: number; hv60: number }>({ hv30: 0, hv60: 0 });

  const fetchExpiries = useCallback(async () => {
    if (!accessToken || !symbolKey) return;
    try {
      const res = await upstoxApi.getExpiries(accessToken, symbolKey);
      if (res.status === 'success' && res.data?.expiry_date) {
        setExpiries(res.data.expiry_date);
        return res.data.expiry_date;
      }
    } catch (err) {
      console.error('Failed to fetch expiries:', err);
    }
  }, [accessToken, symbolKey]);

  const refreshSurface = useCallback(async (expiryList?: string[]) => {
    const list = expiryList || expiries;
    if (!accessToken || !symbolKey || list.length === 0) return;

    setLoading(true);
    try {
      // Parallel fetch top 6 expiries
      const chains = await upstoxApi.getOptionChainBulk(accessToken, symbolKey, list.slice(0, 6));
      
      const points: SurfacePoint[] = [];
      const spot = prices[symbolKey]?.ltp || 0;
      const now = new Date().getTime();

      chains.forEach((res) => {
        if (res.status !== 'success' || !res.data || !Array.isArray(res.data)) return;
        
        const data = res.data;
        data.forEach((opt: any) => {
          const strike = Number(opt.strike_price);
          const expiryDate = new Date(opt.expiry).getTime();
          const tte = (expiryDate - now) / (1000 * 60 * 60 * 24 * 365); // TTE in years

          if (tte < 0) return; // Stale data

          // CE side
          if (opt.option_type === 'CE') {
            const iv = Number(opt.greeks?.iv || 0);
            points.push({ strike, expiry: opt.expiry, tte, iv, type: 'CE' });
          } else {
            const iv = Number(opt.greeks?.iv || 0);
            points.push({ strike, expiry: opt.expiry, tte, iv, type: 'PE' });
          }
        });
      });

      setSurfaceData(points);
      setError(null);
    } catch (err) {
      console.error('Surface fetch failed:', err);
      setError('FAILED TO SYNC SURFACE');
    } finally {
      setLoading(false);
    }
  }, [accessToken, symbolKey, expiries, prices]);

  const fetchHV = useCallback(async () => {
      if (!accessToken || !symbolKey) return;
      try {
          const res = await upstoxApi.getHistoricalVolatility(accessToken, symbolKey);
          if (res.status === 'success' && res.data?.candles) {
              const closes = res.data.candles.map((c: any) => Number(c[4])).reverse();
              const hv30 = calcHV(closes, 30) * 100; // in %
              const hv60 = calcHV(closes, 60) * 100; // in %
              setHvData({ hv30, hv60 });
          }
      } catch (err) {
          console.error('HV Fetch error:', err);
      }
  }, [accessToken, symbolKey]);

  useEffect(() => {
    if (!symbolKey) return;
    
    let isMounted = true;
    const init = async () => {
        const list = await fetchExpiries();
        if (isMounted && list) {
            refreshSurface(list);
            fetchHV();
        }
    };
    init();

    // Auto refresh every 90 seconds
    const interval = setInterval(() => {
        if (isMounted) refreshSurface();
    }, 90000);

    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, [symbolKey]);

  return { 
    expiries, 
    surfaceData, 
    loading, 
    error, 
    hvData, 
    refresh: () => refreshSurface() 
  };
};
