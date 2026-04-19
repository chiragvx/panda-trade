import { resolveInstrumentText } from '../utils/liveSymbols';
import type { InstrumentMeta } from '../store/useUpstoxStore';

// Proxied through Vercel to avoid CORS (assets.upstox.com blocks direct browser fetches)
const CDN_URL = '/api/proxy/upstox-instruments';

const masterCache = new Map<string, InstrumentMeta>();
let loadPromise: Promise<void> | null = null;

function parseRows(rows: any[]): void {
  rows.forEach((row) => {
    const key = String(row?.instrument_key || row?.instrument_token || '').trim();
    if (!key) return;

    const { ticker, name } = resolveInstrumentText({
      instrumentKey: key,
      candidates: [
        row?.trading_symbol,
        row?.tradingsymbol,
        row?.symbol,
        row?.short_name,
        row?.name,
        row?.company_name,
      ],
    });

    if (!ticker) return;

    const exchangeRaw = String(row?.exchange || key.split('|')[0] || 'NSE');
    const exchange = exchangeRaw.split('_')[0];
    masterCache.set(key, { ticker, name: name || ticker, exchange });
  });
}

async function fetchAndParse(): Promise<void> {
  const response = await fetch(CDN_URL);
  if (!response.ok) throw new Error(`CDN responded ${response.status}`);

  let rows: any[];
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json') || contentType.includes('text/')) {
    rows = await response.json();
  } else {
    // Gzip binary — decompress manually
    const ds = new DecompressionStream('gzip');
    const decompressed = response.body!.pipeThrough(ds);
    const text = await new Response(decompressed).text();
    rows = JSON.parse(text);
  }

  parseRows(Array.isArray(rows) ? rows : (rows as any)?.data ?? []);
}

export const instrumentMaster = {
  prefetch(): Promise<void> {
    if (!loadPromise) {
      loadPromise = fetchAndParse()
        .then(() => {
          console.log(`[instrumentMaster] CDN loaded: ${masterCache.size} instruments`);
        })
        .catch((e) => {
          console.warn('[instrumentMaster] CDN failed, will rely on search fallback:', e);
          loadPromise = null; // allow retry on next call
        });
    }
    return loadPromise ?? Promise.resolve();
  },

  resolve(instrumentKey: string): InstrumentMeta | null {
    return masterCache.get(instrumentKey) ?? null;
  },

  size(): number {
    return masterCache.size;
  },
};
