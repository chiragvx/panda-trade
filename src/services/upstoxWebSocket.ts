import protobuf from 'protobufjs';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { upstoxApi } from './upstoxApi';

// Proto definition for MarketData V3
const protoSrc = `
syntax = "proto3";
package com.upstox.marketdatafeederv3udapi.rpc.proto;

message LTPC {
  double ltp = 1;
  int64 ltt = 2;
  int64 ltq = 3;
  double cp = 4;
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
  MarketOHLC marketOHLC = 4;
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

message Feed {
  oneof FeedUnion {
    LTPC ltpc = 1;
    FullFeed fullFeed = 2;
  }
}

message FeedResponse{
  int32 type = 1;
  map<string, Feed> feeds = 2;
  int64 currentTs = 3;
}
`;

class UpstoxWebSocketService {
    private socket: WebSocket | null = null;
    private root: protobuf.Root | null = null;
    private FeedResponse: protobuf.Type | null = null;
    private isConnecting = false;

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

    async connect() {
        const { accessToken, status } = useUpstoxStore.getState();
        if (status !== 'connected' || !accessToken || this.isConnecting || this.socket?.readyState === WebSocket.OPEN) return;

        this.isConnecting = true;
        try {
            const authData = await upstoxApi.getMarketDataFeedUrl(accessToken);
            if (authData?.data?.authorized_redirect_url) {
                this.socket = new WebSocket(authData.data.authorized_redirect_url);
                this.socket.binaryType = "arraybuffer";
                
                this.socket.onopen = (e) => {
                    console.log("Upstox WebSocket connected");
                    this.isConnecting = false;
                    // Auto-subscribe to watchlist or common symbols if needed
                };

                this.socket.onmessage = async (event) => {
                    if (event.data instanceof ArrayBuffer && this.FeedResponse) {
                        try {
                            const buffer = new Uint8Array(event.data);
                            const message = this.FeedResponse.decode(buffer);
                            const decoded = this.FeedResponse.toObject(message);
                            this.handleFeedData(decoded);
                        } catch (err) {
                            console.error("Proto decode error:", err);
                        }
                    }
                };

                this.socket.onerror = (e) => {
                    console.error("Upstox WebSocket error:", e);
                    this.isConnecting = false;
                };

                this.socket.onclose = () => {
                   console.log("Upstox WebSocket closed. Reconnecting...");
                   this.isConnecting = false;
                   setTimeout(() => this.connect(), 5000);
                };
            }
        } catch (err) {
            console.error("Failed to authorize Upstox WebSocket:", err);
            this.isConnecting = false;
        }
    }

    handleFeedData(data: any) {
        if (data.marketInfo) {
            // Update global market status if available
            // Note: In real app, we'd store this in useUpstoxStore
        }
        
        if (!data.feeds) return;
        const prices: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(data.feeds)) {
            const feed = value as any;
            let ltp = 0;
            let cp = 0;

            if (feed.ltpc) {
                ltp = feed.ltpc.ltp;
                cp = feed.ltpc.cp;
            } else if (feed.fullFeed) {
                const ff = feed.fullFeed.marketFF || feed.fullFeed.indexFF;
                if (ff?.ltpc) {
                    ltp = ff.ltpc.ltp;
                    cp = ff.ltpc.cp;
                }
            }

            if (ltp) {
                prices[key] = {
                    ltp,
                    cp,
                    change: ltp - cp,
                    pChange: cp ? ((ltp - cp) / cp) * 100 : 0,
                    ts: Date.now()
                };
            }
        }

        if (Object.keys(prices).length > 0) {
            useUpstoxStore.getState().setPrices(prices);
        }
    }

    subscribe(instrumentKeys: string[], mode: 'ltpc' | 'full' = 'ltpc') {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const request = {
            guid: "guid-" + Date.now(),
            method: "sub",
            data: {
                mode: mode,
                instrumentKeys: instrumentKeys
            }
        };
        this.socket.send(JSON.stringify(request));
    }

    unsubscribe(instrumentKeys: string[]) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        const request = {
            guid: "guid-" + Date.now(),
            method: "unsub",
            data: {
                instrumentKeys: instrumentKeys
            }
        };
        this.socket.send(JSON.stringify(request));
    }

    disconnect() {
        this.socket?.close();
        this.socket = null;
    }
}

export const upstoxWebSocket = new UpstoxWebSocketService();
