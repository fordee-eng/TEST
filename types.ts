
export type MarketSymbol = 
  | 'BTC' | 'ETH' | 'SOL' | 'BNB' | 'ADA' | 'XRP' | 'DOT' // Crypto
  | 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'AUDUSD' | 'USDCAD' | 'USDCHF' | 'EURJPY' | 'GBPJPY' | 'EURGBP' // Forex
  | 'XAUUSD' | 'XAGUSD'; // Commodities (Gold/Silver)

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1H' | '4H' | '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';

export interface OhlcData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SupportResistance {
  level: number;
  type: 'Support' | 'Resistance';
  strength: 'Strong' | 'Moderate' | 'Weak';
}

export interface IndicatorSignal {
  name: string;
  value: string | number;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  description: string;
}

export interface SMCZone {
  type: 'FVG' | 'OB';
  top: number;
  bottom: number;
  startTime: string;
  endTime: string;
  bias: 'Bullish' | 'Bearish';
}

export interface TrendLine {
  x1: string;
  y1: number;
  x2: string;
  y2: number;
  type: 'Ascending' | 'Descending';
}

export interface TechnicalAnalysis {
  symbol: MarketSymbol;
  timeframe: Timeframe;
  price: number;
  change24h: number;
  indicators: IndicatorSignal[];
  levels: SupportResistance[];
  smcZones: SMCZone[];
  trendLines: TrendLine[];
  summary: string;
}
