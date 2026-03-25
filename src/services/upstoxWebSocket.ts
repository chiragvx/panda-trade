import protobuf from 'protobufjs';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { upstoxApi } from './upstoxApi';

type FeedMode = 'ltpc' | 'full' | 'option_greeks' | 'full_d30';

const protoSrc = `
syntax = "proto3";
package com.upstox.marketdatafeederv3udapi.rpc.proto;

message LTPC {
  double ltp = 1;
  int64 ltt = 2;
  int64 ltq = 3;
  double cp = 4;
}

message Quote {
  int64 bidQ = 1;
  double bidP = 2;
  int64 askQ = 3;
  double askP = 4;
}

message MarketLevel {
  repeated Quote bidAskQuote = 1;
}

message OptionGreeks {
  double delta = 1;
  double theta = 2;
  double gamma = 3;
  double vega = 4;
  double rho = 5;
}

message OHLC {
  string interval = 1;
  double open = 2;
  double high = 3;
  double low = 4;
  double close = 5;
  int64 vol = 6;
  int64 ts = 7;
}

message MarketOHLC {
  repeated OHLC ohlc = 1;
}

message MarketFullFeed{
  LTPC ltpc = 1;
  MarketLevel marketLevel = 2;
  OptionGreeks optionGreeks = 3;
  MarketOHLC marketOHLC = 4;
  double atp = 5;
  int64 vtt = 6;
  double oi = 7;
  double iv = 8;
  double tbq = 9;
  double tsq = 10;
}

message IndexFullFeed{
  LTPC ltpc = 1;
  MarketOHLC marketOHLC = 2;
}

message FullFeed {
  oneof FullFeedUnion {
    MarketFullFeed marketFF = 1;
    IndexFullFeed indexFF = 2;
  }
}

message FirstLevelWithGreeks{
  LTPC ltpc = 1;
  Quote firstDepth = 2;
  OptionGreeks optionGreeks = 3;
  int64 vtt = 4;
  double oi = 5;
  double iv = 6;
}

enum RequestMode {
  ltpc = 0;
  full_d5 = 1;
  option_greeks = 2;
  full_d30 = 3;
}

enum Type {
  initial_feed = 0;
  live_feed = 1;
  market_info = 2;
}

enum MarketStatus {
  PRE_OPEN_START = 0;
  PRE_OPEN_END = 1;
  NORMAL_OPEN = 2;
  NORMAL_CLOSE = 3;
  CLOSING_START = 4;
  CLOSING_END = 5;
}

message MarketInfo {
  map<string, MarketStatus> segmentStatus = 1;
}

message Feed {
  oneof FeedUnion {
    LTPC ltpc = 1;
    FullFeed fullFeed = 2;
    FirstLevelWithGreeks firstLevelWithGreeks = 3;
  }
  RequestMode requestMode = 4;
}

message FeedResponse{
  Type type = 1;
  map<string, Feed> feeds = 2;
  int64 currentTs = 3;
  MarketInfo marketInfo = 4;
}
`;

const MODE_PRIORITY: Record<FeedMode, number> = {
  ltpc: 1,
  option_greeks: 2,
  full: 3,
  full_d30: 4,
};

const createModeSet = () => ({
  ltpc: new Set<string>(),
  full: new Set<string>(),
  option_greeks: new Set<string>(),
  full_d30: new Set<string>(),
});

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

class UpstoxWebSocketService {
    private socket: WebSocket | null = null;
    private root: protobuf.Root | null = null;
    private FeedResponse: protobuf.Type | null = null;
    private isConnecting = false;
    private shouldReconnect = true;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private desiredSubscriptions = createModeSet();
    private activeSubscriptions = createModeSet();

    constructor() {
        this.initProto();
    }

    private initProto() {
        try {
            this.root = protobuf.parse(protoSrc).root;
            this.FeedResponse = this.root.lookupType("com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse");
        } catch (e) {
            console.error("Failed to parse proto:", e);
        }
    }

    private getModeLimit(mode: FeedMode): number {
        const hasMultipleModes = (Object.entries(this.desiredSubscriptions) as Array<[FeedMode, Set<string>]>)
            .some(([m, keys]) => m !== mode && keys.size > 0);

        if (mode === 'ltpc') return hasMultipleModes ? 2000 : 5000;
        if (mode === 'option_greeks') return hasMultipleModes ? 2000 : 3000;
        if (mode === 'full') return hasMultipleModes ? 1500 : 2000;
        return 1500;
    }

    private sanitizeKeys(instrumentKeys: string[], mode: FeedMode): string[] {
        const unique = Array.from(new Set(instrumentKeys.map((k) => String(k || '').trim()).filter(Boolean)));
        const limit = this.getModeLimit(mode);
        if (unique.length > limit) {
            console.warn(`Upstox ${mode} subscription capped at ${limit} keys.`);
            return unique.slice(0, limit);
        }
        return unique;
    }

    private markSocketClosed() {
        this.socket = null;
        this.activeSubscriptions = createModeSet();
    }

    private scheduleReconnect() {
        const { accessToken, status } = useUpstoxStore.getState();
        if (!this.shouldReconnect || status !== 'connected' || !accessToken) return;
        if (this.reconnectAttempts >= 10) return;

        const backoffMs = Math.min(12000, 1500 * (this.reconnectAttempts + 1));
        this.reconnectAttempts += 1;
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, backoffMs);
    }

    private clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    async connect() {
        const { accessToken, status } = useUpstoxStore.getState();
        if (status !== 'connected' || !accessToken || this.isConnecting) return;
        if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;

        this.shouldReconnect = true;
        this.clearReconnectTimer();
        this.isConnecting = true;

        try {
            const authData = await upstoxApi.getMarketDataFeedUrl(accessToken);
            const redirectUrl =
                authData?.data?.authorized_redirect_uri ||
                authData?.data?.authorizedRedirectUri ||
                authData?.data?.authorized_redirect_url ||
                authData?.data?.authorizedRedirectUrl;

            if (!redirectUrl) {
                throw new Error('Missing websocket redirect URL');
            }

            this.socket = new WebSocket(redirectUrl);
            this.socket.binaryType = "arraybuffer";
            
            this.socket.onopen = () => {
                    console.log("Upstox WebSocket connected");
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.reconcileAllSubscriptions();
            };

            this.socket.onmessage = (event) => {
                if (!(event.data instanceof ArrayBuffer) || !this.FeedResponse) return;

                try {
                    const buffer = new Uint8Array(event.data);
                    const message = this.FeedResponse.decode(buffer);
                    const decoded = this.FeedResponse.toObject(message, {
                        longs: Number,
                        enums: String,
                    });
                    this.handleFeedData(decoded);
                } catch (err) {
                    console.error("Proto decode error:", err);
                }
            };

            this.socket.onerror = (e) => {
                console.error("Upstox WebSocket error:", e);
                this.isConnecting = false;
            };

            this.socket.onclose = () => {
                   console.log("Upstox WebSocket closed.");
                   this.isConnecting = false;
                   this.markSocketClosed();
                   if (this.shouldReconnect) {
                       this.scheduleReconnect();
                    }
                };
        } catch (err) {
            console.error("Failed to authorize Upstox WebSocket:", err);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    private sendRequest(method: 'sub' | 'unsub', mode: FeedMode, instrumentKeys: string[]) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN || instrumentKeys.length === 0) return;

        const request = {
            guid: `guid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            method,
            data: method === 'sub'
                ? {
                    mode,
                    instrumentKeys,
                  }
                : {
                    instrumentKeys,
                  },
        };

        const payload = JSON.stringify(request);
        try {
            const encoded = new TextEncoder().encode(payload);
            this.socket.send(encoded);
        } catch {
            this.socket.send(payload);
        }
    }

    private reconcileMode(mode: FeedMode) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const desired = this.desiredSubscriptions[mode];
        const active = this.activeSubscriptions[mode];

        const toAdd = Array.from(desired).filter((key) => !active.has(key));
        const toRemove = Array.from(active).filter((key) => !desired.has(key));

        if (toAdd.length > 0) {
            this.sendRequest('sub', mode, toAdd);
            toAdd.forEach((key) => active.add(key));
        }

        if (toRemove.length > 0) {
            this.sendRequest('unsub', mode, toRemove);
            toRemove.forEach((key) => active.delete(key));
        }
    }

    private reconcileAllSubscriptions() {
        const modes = Object.keys(this.desiredSubscriptions) as FeedMode[];
        modes.sort((a, b) => MODE_PRIORITY[b] - MODE_PRIORITY[a]);
        modes.forEach((mode) => this.reconcileMode(mode));
    }

    private parseDepth(feed: any) {
        const marketQuotes = feed?.fullFeed?.marketFF?.marketLevel?.bidAskQuote;
        if (Array.isArray(marketQuotes) && marketQuotes.length > 0) {
            return {
                buy: marketQuotes.map((q: any) => ({
                    price: toNumber(q?.bidP),
                    quantity: toNumber(q?.bidQ),
                    orders: 0,
                })),
                sell: marketQuotes.map((q: any) => ({
                    price: toNumber(q?.askP),
                    quantity: toNumber(q?.askQ),
                    orders: 0,
                })),
            };
        }

        const firstDepth = feed?.firstLevelWithGreeks?.firstDepth;
        if (firstDepth) {
            return {
                buy: [{
                    price: toNumber(firstDepth?.bidP),
                    quantity: toNumber(firstDepth?.bidQ),
                    orders: 0,
                }],
                sell: [{
                    price: toNumber(firstDepth?.askP),
                    quantity: toNumber(firstDepth?.askQ),
                    orders: 0,
                }],
            };
        }

        return undefined;
    }

    private parseOHLC(feed: any) {
        const ohlcRows = feed?.fullFeed?.marketFF?.marketOHLC?.ohlc
            || feed?.fullFeed?.indexFF?.marketOHLC?.ohlc;

        if (!Array.isArray(ohlcRows) || ohlcRows.length === 0) return undefined;

        const day = ohlcRows.find((row: any) => row?.interval === '1d') || ohlcRows[0];
        if (!day) return undefined;

        return {
            open: toNumber(day.open),
            high: toNumber(day.high),
            low: toNumber(day.low),
            close: toNumber(day.close),
        };
    }

    handleFeedData(data: any) {
        if (!data.feeds) return;
        const prices: Record<string, any> = {};
        const currentTs = toNumber(data.currentTs, Date.now());
        const state = useUpstoxStore.getState();
        const existingPrices = state.prices;
        
        for (const [key, value] of Object.entries(data.feeds)) {
            const feed = value as any;
            const previous = existingPrices[key] || {};
            const ltpc = feed.ltpc
                || feed.fullFeed?.marketFF?.ltpc
                || feed.fullFeed?.indexFF?.ltpc
                || feed.firstLevelWithGreeks?.ltpc;

            const ltp = toNumber(ltpc?.ltp, toNumber(previous?.ltp, 0));
            const cp = toNumber(ltpc?.cp, toNumber(previous?.cp, ltp));
            const change = ltp - cp;
            const pChange = cp !== 0 ? (change / cp) * 100 : 0;

            const depth = this.parseDepth(feed);
            const ohlc = this.parseOHLC(feed);

            const bestBid = depth?.buy?.[0];
            const bestAsk = depth?.sell?.[0];
            const volume = toNumber(feed?.fullFeed?.marketFF?.vtt, toNumber(feed?.firstLevelWithGreeks?.vtt, toNumber(previous?.volume, 0)));
            const oi = toNumber(feed?.fullFeed?.marketFF?.oi, toNumber(feed?.firstLevelWithGreeks?.oi, toNumber(previous?.oi, 0)));

            prices[key] = {
                ...previous,
                ltp,
                cp,
                change,
                pChange,
                bid: toNumber(bestBid?.price, toNumber(previous?.bid, 0)),
                ask: toNumber(bestAsk?.price, toNumber(previous?.ask, 0)),
                bidQty: toNumber(bestBid?.quantity, toNumber(previous?.bidQty, 0)),
                askQty: toNumber(bestAsk?.quantity, toNumber(previous?.askQty, 0)),
                volume,
                oi,
                ...(ohlc || {}),
                depth: depth || previous?.depth,
                ts: currentTs,
            };
        }

        if (Object.keys(prices).length > 0) {
            state.setPrices(prices);
        }
    }

    syncSubscriptions(instrumentKeys: string[], mode: FeedMode = 'ltpc') {
        const sanitized = this.sanitizeKeys(instrumentKeys, mode);
        this.desiredSubscriptions[mode] = new Set(sanitized);
        this.reconcileMode(mode);
    }

    subscribe(instrumentKeys: string[], mode: 'ltpc' | 'full' = 'ltpc') {
        const next = new Set(this.desiredSubscriptions[mode]);
        this.sanitizeKeys(instrumentKeys, mode).forEach((key) => next.add(key));
        this.syncSubscriptions(Array.from(next), mode);
    }

    clearSubscriptions(mode?: FeedMode) {
        if (mode) {
            this.syncSubscriptions([], mode);
            return;
        }
        (Object.keys(this.desiredSubscriptions) as FeedMode[]).forEach((m) => {
            this.syncSubscriptions([], m);
        });
    }

    unsubscribe(instrumentKeys: string[]) {
        const removeSet = new Set(this.sanitizeKeys(instrumentKeys, 'ltpc'));
        (Object.keys(this.desiredSubscriptions) as FeedMode[]).forEach((mode) => {
            const next = Array.from(this.desiredSubscriptions[mode]).filter((key) => !removeSet.has(key));
            this.syncSubscriptions(next, mode);
        });
    }

    disconnect() {
        this.shouldReconnect = false;
        this.clearReconnectTimer();
        this.desiredSubscriptions = createModeSet();
        this.activeSubscriptions = createModeSet();
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export const upstoxWebSocket = new UpstoxWebSocketService();
