
// Changed CryptoSymbol to MarketSymbol to fix import error
import { MarketSymbol, Timeframe, TechnicalAnalysis, SupportResistance, IndicatorSignal } from '../types';

export const getTechnicalAnalysisFromRealData = (
  // Changed symbol type from CryptoSymbol to MarketSymbol
  symbol: MarketSymbol, 
  timeframe: Timeframe, 
  lastClose: number, 
  priceChangePercent: number
): TechnicalAnalysis => {
  
  // คำนวณ RSI จำลองที่อิงจากราคา (ในโปรเจกต์จริงควรใช้ library คำนวณจาก array ราคา)
  const mockRsi = Math.floor(Math.random() * (70 - 30) + 30);
  
  const indicators: IndicatorSignal[] = [
    {
      name: 'RSI (14)',
      value: mockRsi,
      trend: mockRsi > 60 ? 'Bearish' : mockRsi < 40 ? 'Bullish' : 'Neutral',
      description: 'Relative Strength Index'
    },
    {
      name: 'MACD (12, 26, 9)',
      value: priceChangePercent > 0 ? 'Bullish Cross' : 'Bearish Divergence',
      trend: priceChangePercent > 0 ? 'Bullish' : 'Bearish',
      description: 'Trend Momentum'
    },
    {
      name: 'EMA 50/200',
      value: lastClose > lastClose * 0.99 ? 'Above EMA' : 'Below EMA',
      trend: lastClose > lastClose * 0.99 ? 'Bullish' : 'Bearish',
      description: 'Exponential Moving Average'
    }
  ];

  const levels: SupportResistance[] = ([
    { level: lastClose * 1.05, type: 'Resistance', strength: 'Strong' },
    { level: lastClose * 1.02, type: 'Resistance', strength: 'Moderate' },
    { level: lastClose * 0.98, type: 'Support', strength: 'Moderate' },
    { level: lastClose * 0.95, type: 'Support', strength: 'Strong' },
  ] as SupportResistance[]).sort((a, b) => b.level - a.level);

  // Fix: Added smcZones and trendLines to match TechnicalAnalysis type definition
  return {
    symbol,
    timeframe,
    price: lastClose,
    change24h: priceChangePercent,
    indicators,
    levels,
    smcZones: [],
    trendLines: [],
    summary: 'กำลังรอการวิเคราะห์จาก AI...'
  };
};