export interface SymbolData {
  ticker: string;          // "IRFC"
  name: string;
  exchange: "NSE" | "BSE";
  ltp: number;             // Last traded price
  change: number;          // Absolute change
  changePct: number;       // % change
  volume: number;          // Raw volume
  open: number;
  high: number;
  low: number;
  close: number;
  bid?: number;
  ask?: number;
  deliveryPct?: number;
  low52w?: number;
  high52w?: number;
  circuitLimit?: number;
  oiChangePct?: number;
  lotSize?: number;
  expiry?: string;
  iv?: number;
  instrument_key?: string; // Upstox specific key e.g. NSE_EQ|INE848E01016
}

export interface InstrumentData {
  instrument_key: string;
  exchange: string;
  symbol: string;
  name: string;
  tick_size: number;
  lot_size: number;
  instrument_type: string;
}

export interface Holding {
  isin: string;
  symbol: string;
  exchange: string;
  quantity: number;
  avg_price: number;
  last_price: number;
  pnl: number;
  pnl_pct: number;
}

export interface OHLCV {
  time: number | string;   // Unix timestamp or ISODate
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Order {
  id: string;
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "SL" | "SL-M";
  quantity: number;
  price?: number;
  status: "PENDING" | "EXECUTED" | "CANCELLED";
  timestamp: number;
  productType: "TRADING" | "DELIVERY" | "INTRADAY";
}

export interface Position {
  symbol: string;
  exchange: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPct: number;
}

export interface Alert {
  id: string;
  symbol: string;
  type: 'price' | 'event';
  condition: string;
  value: number;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'triggered' | 'dismissed';
  timestamp: number;
  message: string;
}

export interface WidgetProps {
  id: string;
  isLinked: boolean;
}

export interface Widget {
  id: string;
  title: string;
  defaultSize: { w: number, h: number };
  minSize: { w: number, h: number };
  isLinked: boolean;
  refreshInterval: number;
  component: React.FC<any>; // Use any temporarily if WidgetProps is too strict or needs more
}


