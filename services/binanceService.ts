
import { OhlcData, MarketSymbol, Timeframe } from '../types';

const CLUSTERS = [
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com'
];

let currentClusterIndex = 0;

const getNextCluster = () => {
  currentClusterIndex = (currentClusterIndex + 1) % CLUSTERS.length;
  return CLUSTERS[currentClusterIndex];
};

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w', '1M': '1M', '3M': '1M', '6M': '1M', '1Y': '1M'
};

/**
 * Mapping สำหรับคู่เงินและสินค้าโภคภัณฑ์
 * เนื่องจาก Binance Spot อาจไม่มี XAUUSD โดยตรง จึงใช้ PAXGUSDT (Gold Token) แทน
 */
const SYMBOL_MAP: Record<string, string> = {
  'EURUSD': 'EURUSDT',
  'GBPUSD': 'GBPUSDT',
  'USDJPY': 'USDTJPY',
  'AUDUSD': 'AUDUSDT',
  'USDCAD': 'USDCAD',
  'USDCHF': 'USDCHF',
  'EURJPY': 'EURJPY',
  'GBPJPY': 'GBPJPY',
  'EURGBP': 'EURGBP',
  'XAUUSD': 'PAXGUSDT', // Gold backed token (Spot)
  'XAGUSD': 'XAGUSDT',  // Silver (Check availability or map to futures if needed)
};

const getBinanceSymbol = (symbol: MarketSymbol): string => {
  return SYMBOL_MAP[symbol] || `${symbol}USDT`;
};

async function fetchWithRetry(path: string, options: RequestInit = {}): Promise<any> {
  let lastError: any;
  for (let i = 0; i < CLUSTERS.length; i++) {
    const cluster = CLUSTERS[currentClusterIndex];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

      const response = await fetch(`${cluster}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429 || response.status === 418) {
          getNextCluster();
          throw new Error('Rate limit hit');
        }
        throw new Error(`Server ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      lastError = error;
      console.warn(`Fetch failed for cluster ${cluster}:`, error.message);
      getNextCluster();
      // รอเล็กน้อยก่อนลองใหม่
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw lastError || new Error("Network connection failed");
}

export const fetchBinanceKlines = async (symbol: MarketSymbol, timeframe: Timeframe, limit = 300): Promise<OhlcData[]> => {
  const binanceSymbol = getBinanceSymbol(symbol);
  const interval = TIMEFRAME_MAP[timeframe];
  try {
    const data = await fetchWithRetry(`/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`);
    return data.map((d: any) => {
      const date = new Date(d[0]);
      return {
        time: timeframe === '1D' || timeframe === '1W' 
          ? date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })
          : date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5])
      };
    });
  } catch (e) {
    throw e;
  }
};

export const fetchBinanceTicker = async (symbol: MarketSymbol) => {
  const binanceSymbol = getBinanceSymbol(symbol);
  return await fetchWithRetry(`/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
};
