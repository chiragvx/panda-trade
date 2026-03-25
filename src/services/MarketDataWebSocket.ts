import protobuf from 'protobufjs';
import { useDataStore } from '../store/useDataStore';
import { useUpstoxStore } from '../store/useUpstoxStore';

// Proto definition for Upstox V3 Market Data
const protoSource = `
syntax = "proto3";
package com.upstox.marketdatafeederv3udapi.rpc.proto;

message LTPC {
  double ltp = 1;
  int64 ltt = 2;
  int64 ltq = 3;
  double cp = 4;
}

message Feed {
  oneof FeedUnion {
    LTPC ltpc = 1;
  }
}

message FeedResponse {
  map<string, Feed> feeds = 2;
}
`;

class MarketDataWebSocket {
  private ws: WebSocket | null = null;
  private protobufRoot: protobuf.Root | null = null;
  private subscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initProtobuf();
  }

  private async initProtobuf() {
    this.protobufRoot = protobuf.parse(protoSource).root;
  }

  public connect(accessToken: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const url = `wss://api.upstox.com/v3/feed/market-data-feed`;
    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      console.log('─── MARKET DATA FEED CONNECTED ───');
      this.reconnectAttempts = 0;
      if (this.subscriptions.size > 0) {
        this.subscribe(Array.from(this.subscriptions));
      }
    };

    this.ws.onmessage = (event) => {
      if (!this.protobufRoot) return;
      const buffer = new Uint8Array(event.data as ArrayBuffer);
      try {
        const FeedResponse = this.protobufRoot.lookupType('com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse');
        const message = FeedResponse.decode(buffer) as any;
        
        if (message.feeds) {
          const prices: Record<string, number> = {};
          Object.entries(message.feeds).forEach(([key, feed]: [string, any]) => {
            if (feed.ltpc?.ltp) {
              prices[key] = feed.ltpc.ltp;
            }
          });
          useDataStore.getState().setPrices(prices);
        }
      } catch (err) {
        console.error('PROTOCAL_ERROR_DECODE:', err);
      }
    };

    this.ws.onerror = (err) => console.error('WS_ERROR:', err);

    this.ws.onclose = () => {
      console.log('─── MARKET DATA FEED DISCONNECTED ───');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          const token = useUpstoxStore.getState().accessToken;
          if (token) this.connect(token);
        }, 3000 * this.reconnectAttempts);
      }
    };
  }

  public subscribe(instrumentKeys: string[]) {
    instrumentKeys.forEach(k => this.subscriptions.add(k));
    if (this.ws?.readyState === WebSocket.OPEN) {
      const request = {
        guid: crypto.randomUUID(),
        method: 'sub',
        data: { instrumentKeys, mode: 'ltpc' }
      };
      this.ws.send(JSON.stringify(request));
    }
  }

  public unsubscribe(instrumentKeys: string[]) {
    instrumentKeys.forEach(k => this.subscriptions.delete(k));
    if (this.ws?.readyState === WebSocket.OPEN) {
      const request = {
        guid: crypto.randomUUID(),
        method: 'unsub',
        data: { instrumentKeys }
      };
      this.ws.send(JSON.stringify(request));
    }
  }

  public disconnect() {
    this.ws?.close();
    this.subscriptions.clear();
  }
}

export const marketDataWS = new MarketDataWebSocket();
