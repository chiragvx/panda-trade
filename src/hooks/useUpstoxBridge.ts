import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelectionStore, useWatchlistStore } from '../store/useStore';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { upstoxApi } from '../services/upstoxApi';
import { upstoxWebSocket } from '../services/upstoxWebSocket';
import { upstoxSearch } from '../services/upstoxSearch';
import { instrumentMaster } from '../services/instrumentMaster';
import { isUselessTicker } from '../utils/liveSymbols';

const ACCOUNT_REFRESH_INTERVAL_MS = 60000;
const TOKEN_VALIDITY_CHECK_MS = 60000;
const INITIAL_REFRESH_DELAY_MS = 600;   // lets StrictMode unmount/remount settle
const MIN_REFRESH_GAP_MS = 10000;        // hard floor between consecutive fetches

// Module-level timestamp — survives StrictMode's remount cycle
let lastRefreshAt = 0;

const CORE_INDEX_KEYS = [
  'NSE_INDEX|Nifty 50',
  'NSE_INDEX|Nifty Bank',
  'NSE_INDEX|Nifty Fin Service',
  'NSE_INDEX|India VIX',
  'BSE_INDEX|SENSEX',
];

const uniqueKeys = (keys: Array<string | null | undefined>) =>
  Array.from(new Set(keys.map((k) => String(k || '').trim()).filter(Boolean)));

const extractFunds = (payload: any) => {
  const data = payload?.data || {};
  if (data.equity) return data.equity;
  const firstSegment = Object.keys(data)[0];
  return firstSegment ? data[firstSegment] : null;
};

export const useUpstoxBridge = () => {
  const accessToken = useUpstoxStore((s) => s.accessToken);
  const status = useUpstoxStore((s) => s.status);
  const setAccountData = useUpstoxStore((s) => s.setAccountData);
  const checkTokenValidity = useUpstoxStore((s) => s.checkTokenValidity);
  const positions = useUpstoxStore((s) => s.positions);
  const holdings = useUpstoxStore((s) => s.holdings);

  const watchlists = useWatchlistStore((s) => s.watchlists);
  const selectedInstrumentKey = useSelectionStore((s) => s.selectedSymbol?.instrument_key || '');

  const refreshLockRef = useRef(false);

  const refreshAccountData = useCallback(async () => {
    const now = Date.now();
    if (!accessToken || status !== 'connected') return;
    if (refreshLockRef.current) return;             // in-flight guard
    if (now - lastRefreshAt < MIN_REFRESH_GAP_MS) return;  // rate-limit guard

    refreshLockRef.current = true;
    lastRefreshAt = now;

    try {
      const [fundsRes, ordersRes, positionsRes, holdingsRes] = await Promise.allSettled([
        upstoxApi.getFunds(accessToken),
        upstoxApi.getOrders(accessToken),
        upstoxApi.getPositions(accessToken),
        upstoxApi.getHoldings(accessToken),
      ]);

      const funds = fundsRes.status === 'fulfilled' ? extractFunds(fundsRes.value) : null;
      const orders = ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value?.data) ? ordersRes.value.data : [];
      const nextPositions =
        positionsRes.status === 'fulfilled' && Array.isArray(positionsRes.value?.data) ? positionsRes.value.data : [];
      const nextHoldings =
        holdingsRes.status === 'fulfilled' && Array.isArray(holdingsRes.value?.data) ? holdingsRes.value.data : [];

      setAccountData({
        funds,
        orders,
        positions: nextPositions,
        holdings: nextHoldings,
      });
    } catch (error: any) {
      // 423 = Upstox rate limit; silent retry on next interval
      if (error?.response?.status !== 423) {
        console.error('Failed to sync Upstox account data:', error);
      }
    } finally {
      refreshLockRef.current = false;
    }
  }, [accessToken, setAccountData, status]);

  const accountInstrumentKeys = useMemo(
    () =>
      uniqueKeys([
        ...positions.map((p: any) => p?.instrument_token),
        ...holdings.map((h: any) => h?.instrument_token),
      ]),
    [holdings, positions]
  );

  const allWatchlistKeys = useMemo(() => watchlists.flatMap(w => w.keys), [watchlists]);

  const fullModeKeys = useMemo(() => uniqueKeys([selectedInstrumentKey]), [selectedInstrumentKey]);

  const ltpcModeKeys = useMemo(() => {
    const merged = uniqueKeys([...CORE_INDEX_KEYS, ...allWatchlistKeys, ...accountInstrumentKeys]);
    const fullSet = new Set(fullModeKeys);
    return merged.filter((key) => !fullSet.has(key));
  }, [accountInstrumentKeys, fullModeKeys, allWatchlistKeys]);

  useEffect(() => {
    // Basic initialization if somehow wiped
    if (watchlists.length === 0) {
      useWatchlistStore.getState().createWatchlist('Default');
    }
  }, [watchlists.length]);

  useEffect(() => {
    checkTokenValidity();
    const timer = setInterval(checkTokenValidity, TOKEN_VALIDITY_CHECK_MS);
    return () => clearInterval(timer);
  }, [checkTokenValidity]);

  useEffect(() => {
    if (status !== 'connected' || !accessToken) {
      upstoxWebSocket.disconnect();
      return;
    }

    upstoxWebSocket.connect();

    // Delay initial fetch so React StrictMode's unmount/remount settles first
    const initialTimer = setTimeout(refreshAccountData, INITIAL_REFRESH_DELAY_MS);
    const timer = setInterval(refreshAccountData, ACCOUNT_REFRESH_INTERVAL_MS);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [accessToken, refreshAccountData, status]);

  useEffect(() => {
    if (status !== 'connected' || !accessToken) return;

    upstoxWebSocket.syncSubscriptions(ltpcModeKeys, 'ltpc');
    upstoxWebSocket.syncSubscriptions(fullModeKeys, 'full');
  }, [accessToken, fullModeKeys, ltpcModeKeys, status]);

  // Resolve missing names: wait for instrument master, then batch-apply; fall back to search API
  useEffect(() => {
    if (status !== 'connected' || !accessToken) return;

    let cancelled = false;

    const resolveAllMissing = async () => {
      // Await master download before attempting any lookup — master may take several seconds
      await instrumentMaster.prefetch();
      if (cancelled) return;

      const { instrumentMeta, setInstrumentMeta } = useUpstoxStore.getState();
      const allKeys = uniqueKeys([...allWatchlistKeys, ...accountInstrumentKeys, ...CORE_INDEX_KEYS]);

      const missingKeys = allKeys.filter(k => {
        const meta = instrumentMeta[k];
        return !meta || (isUselessTicker(meta.ticker) && isUselessTicker(meta.name));
      });

      if (missingKeys.length === 0) return;

      const fromMaster: Record<string, any> = {};
      const stillMissing: string[] = [];

      for (const k of missingKeys) {
        const hit = instrumentMaster.resolve(k);
        if (hit) fromMaster[k] = hit;
        else stillMissing.push(k);
      }

      if (Object.keys(fromMaster).length > 0) setInstrumentMeta(fromMaster);

      // Fall back to search API in parallel batches for anything not in the master
      const BATCH = 5;
      for (let i = 0; i < stillMissing.length; i += BATCH) {
        if (cancelled) break;
        const batch = stillMissing.slice(i, i + BATCH);
        await Promise.allSettled(batch.map(async (k) => {
          try {
            const [, raw] = k.split('|');
            const results = await upstoxSearch.searchSymbols(accessToken, raw || k, 1);
            if (results.length > 0) {
              const best = results[0];
              setInstrumentMeta({ [k]: { ticker: best.ticker, name: best.name, exchange: best.exchange } });
            }
          } catch (e) {
            console.warn('Global resolver failed for', k, e);
          }
        }));
      }
    };

    resolveAllMissing();
    return () => { cancelled = true; };
  }, [accessToken, allWatchlistKeys.length, accountInstrumentKeys.length, status]);
};
