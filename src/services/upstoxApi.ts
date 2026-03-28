import axios from 'axios';

const BASE_URL = 'https://api.upstox.com/v2';
const V3_URL = 'https://api.upstox.com/v3';

type CacheEntry = {
  ts: number;
  value: any;
};

const api = axios.create({
  timeout: 15000,
});

const inFlightRequests = new Map<string, Promise<any>>();
const responseCache = new Map<string, CacheEntry>();

let lastSearchTs = 0;
const searchQueue: (() => Promise<any>)[] = [];
let isSearchQueueProcessing = false;

const processSearchQueue = async () => {
  if (isSearchQueueProcessing || searchQueue.length === 0) return;
  isSearchQueueProcessing = true;
  
  while (searchQueue.length > 0) {
    const next = searchQueue.shift();
    if (!next) continue;
    
    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - lastSearchTs));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    
    lastSearchTs = Date.now();
    try {
      await next();
    } catch (e) {
      console.error('Search queue execution failed:', e);
    }
  }
  isSearchQueueProcessing = false;
};

const queueSearchRequest = <T>(fn: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    searchQueue.push(async () => {
      try {
        const res = await fn();
        resolve(res);
      } catch (e) {
        reject(e);
      }
    });
    processSearchQueue();
  });
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
});

const guardedRequest = async <T>(
  key: string,
  minIntervalMs: number,
  fn: () => Promise<T>
): Promise<T> => {
  const now = Date.now();
  const cached = responseCache.get(key);
  if (cached && now - cached.ts < minIntervalMs) {
    return cached.value as T;
  }

  const pending = inFlightRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = fn()
    .then((value) => {
      responseCache.set(key, { ts: Date.now(), value });
      return value;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, request);
  return request;
};

const uniqueKeys = (instrumentKeys: string[]) =>
  Array.from(new Set(instrumentKeys.map((k) => k.trim()).filter(Boolean)));

export const upstoxApi = {
  exchangeCodeForToken: async (code: string, apiKey: string, apiSecret: string, redirectUri: string) => {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', apiKey);
    params.append('client_secret', apiSecret);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    const response = await api.post(`${BASE_URL}/login/authorization/token`, params, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  },

  getFunds: async (token: string) =>
    guardedRequest(`funds:${token.slice(-8)}`, 2500, async () => {
      const response = await api.get(`${BASE_URL}/user/get-funds-and-margin`, {
        headers: authHeaders(token),
      });
      return response.data;
    }),

  getOrders: async (token: string) =>
    guardedRequest(`orders:${token.slice(-8)}`, 2500, async () => {
      const response = await api.get(`${BASE_URL}/order/retrieve-all`, {
        headers: authHeaders(token),
      });
      return response.data;
    }),

  getHoldings: async (token: string) =>
    guardedRequest(`holdings:${token.slice(-8)}`, 2500, async () => {
      const response = await api.get(`${BASE_URL}/portfolio/long-term-holdings`, {
        headers: authHeaders(token),
      });
      return response.data;
    }),

  getPositions: async (token: string) =>
    guardedRequest(`positions:${token.slice(-8)}`, 2500, async () => {
      const response = await api.get(`${BASE_URL}/portfolio/short-term-positions`, {
        headers: authHeaders(token),
      });
      return response.data;
    }),

  placeOrder: async (token: string, orderData: any) => {
    const response = await api.post(`${BASE_URL}/order/place`, orderData, {
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  modifyOrder: async (token: string, orderData: any) => {
    const response = await api.put(`${BASE_URL}/order/modify`, orderData, {
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  cancelOrder: async (token: string, orderId: string) => {
    const response = await api.delete(`${BASE_URL}/order/cancel`, {
      headers: authHeaders(token),
      params: { order_id: orderId },
    });
    return response.data;
  },

  placeGTT: async (token: string, gttData: any) => {
    const response = await api.post(`${BASE_URL}/gtt/place`, gttData, {
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  getGTTOrders: async (token: string) =>
    guardedRequest(`gtt-orders:${token.slice(-8)}`, 5000, async () => {
      const response = await api.get(`${BASE_URL}/gtt/get-order-details`, {
        headers: authHeaders(token),
      });
      return response.data;
    }),

  getMarketDataFeedUrl: async (token: string) =>
    guardedRequest(`ws-auth:${token.slice(-8)}`, 1000, async () => {
      try {
        const response = await api.get(`${V3_URL}/feed/market-data-feed/authorize`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        });
        return response.data;
      } catch {
        const fallback = await api.get(`${BASE_URL}/feed/market-data-feed/authorize`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        });
        return fallback.data;
      }
    }),

  getHistoricalData: async (token: string, instrumentKey: string, interval: string, fromDate: string, toDate: string) =>
    guardedRequest(`hist:${token.slice(-8)}:${instrumentKey}:${interval}:${fromDate}:${toDate}`, 750, async () => {
      const response = await api.get(
        `${BASE_URL}/historical-candle/${encodeURIComponent(instrumentKey)}/${interval}/${toDate}/${fromDate}`,
        {
          headers: authHeaders(token),
        }
      );
      return response.data;
    }),

  searchInstruments: async (token: string, query: string) => {
    const queryKey = `search:${query.trim().toUpperCase()}`;
    
    // 1. Result Cache Check (1 day cache for searches)
    const cached = responseCache.get(queryKey);
    if (cached && (Date.now() - cached.ts < 86400000)) return cached.value;

    // 2. In-flight Request Check
    const pending = inFlightRequests.get(queryKey);
    if (pending) return pending;

    // 3. Queue and Rate-limit (only 1 search per second allowed globally)
    const requestPromise = queueSearchRequest(async () => {
      const response = await api.get(`${BASE_URL}/instruments/search`, {
        headers: authHeaders(token),
        params: {
          query: query.trim(),
          page_number: 1,
          records: 20,
        },
      });
      return response.data;
    }).then(val => {
      responseCache.set(queryKey, { ts: Date.now(), value: val });
      return val;
    }).finally(() => {
      inFlightRequests.delete(queryKey);
    });

    inFlightRequests.set(queryKey, requestPromise);
    return requestPromise;
  },

  getInstruments: async (exchange: string) =>
    guardedRequest(`instruments:${exchange}`, 3600000, async () => {
      const response = await api.get(`${BASE_URL}/instruments/${exchange}`, {
        headers: {
          Accept: 'application/json',
        },
      });
      return response.data;
    }),

  getFullQuote: async (token: string, instrumentKey: string) =>
    guardedRequest(`quote-full:${token.slice(-8)}:${instrumentKey}`, 750, async () => {
      const response = await api.get(`${BASE_URL}/market-quote/quotes`, {
        headers: authHeaders(token),
        params: {
          instrument_key: instrumentKey,
        },
      });
      return response.data;
    }),

  getMarketQuotes: async (token: string, instrumentKeys: string[]) => {
    const keys = uniqueKeys(instrumentKeys);
    if (keys.length === 0) {
      return { status: 'success', data: {} };
    }

    return guardedRequest(`quote-ltp:${token.slice(-8)}:${keys.join(',')}`, 500, async () => {
      const response = await api.get(`${BASE_URL}/market-quote/ltp`, {
        headers: authHeaders(token),
        params: {
          instrument_key: keys.join(','),
        },
      });
      return response.data;
    });
  },

  getOptionChainBulk: async (token: string, instrumentKey: string, expiries: string[]) => {
    // Parallel fetch up to 8 expiries to avoid long waterfalls
    const results = await Promise.allSettled(
      expiries.slice(0, 8).map(expiry => 
        upstoxApi.getOptionChain(token, instrumentKey, expiry)
      )
    );
    
    return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
  },

  getHistoricalVolatility: async (token: string, instrumentKey: string, lookback: number = 100) =>
    guardedRequest(`hist-vol:${token.slice(-8)}:${instrumentKey}:${lookback}`, 3600000, async () => {
      const now = new Date();
      const past = new Date(now.getTime() - (lookback + 20) * 24 * 60 * 60 * 1000); // Buffer for market holidays
      
      const toDate = now.toISOString().split('T')[0];
      const fromDate = past.toISOString().split('T')[0];
      
      const response = await api.get(
        `${BASE_URL}/historical-candle/${encodeURIComponent(instrumentKey)}/day/${toDate}/${fromDate}`,
        {
          headers: authHeaders(token),
        }
      );
      return response.data;
    }),

  getOptionChain: async (token: string, instrumentKey: string, expiry: string) =>
    guardedRequest(`opt-chain:${token.slice(-8)}:${instrumentKey}:${expiry}`, 1500, async () => {
      let key = instrumentKey;
      if (key.toUpperCase().includes('NIFTY 50')) key = 'NSE_INDEX|Nifty 50';
      if (key.toUpperCase().includes('BANK')) key = 'NSE_INDEX|Nifty Bank';
      if (key.toUpperCase().includes('FIN')) key = 'NSE_INDEX|Nifty Fin Service';
      
      const encodedKey = encodeURIComponent(key).replace(/\+/g, '%20');
      const response = await api.get(`${BASE_URL}/option/chain?instrument_key=${encodedKey}&expiry_date=${expiry}`, {
        headers: authHeaders(token),
      });
      return response.data;
    }),

  getExpiries: async (token: string, instrumentKey: string) =>
    guardedRequest(`expiries:${token.slice(-8)}:${instrumentKey}`, 3600000, async () => {
      let key = instrumentKey;
      if (key.toUpperCase().includes('NIFTY 50')) key = 'NSE_INDEX|Nifty 50';
      if (key.toUpperCase().includes('BANK')) key = 'NSE_INDEX|Nifty Bank';
      if (key.toUpperCase().includes('FIN')) key = 'NSE_INDEX|Nifty Fin Service';

      const encodedKey = encodeURIComponent(key).replace(/\+/g, '%20');
      const response = await api.get(`${BASE_URL}/option/expiry?instrument_key=${encodedKey}`, {
        headers: authHeaders(token),
      });
      return response.data;
    }),
};
