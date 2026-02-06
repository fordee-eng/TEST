
import { OhlcData, SMCZone, TrendLine } from '../types';

export const calculateEMA = (data: OhlcData[], period: number): number[] => {
  const k = 2 / (period + 1);
  const ema = [data[0].close];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i].close * k + ema[i - 1] * (1 - k));
  }
  return ema;
};

export const detectSMC = (data: OhlcData[]): { zones: SMCZone[], trendLines: TrendLine[] } => {
  const zones: SMCZone[] = [];
  const trendLines: TrendLine[] = [];

  // 1. Detect FVG (Fair Value Gap)
  for (let i = 2; i < data.length - 1; i++) {
    const c1 = data[i - 2];
    const c2 = data[i - 1];
    const c3 = data[i];

    if (c3.low > c1.high) {
      zones.push({
        type: 'FVG',
        top: c3.low,
        bottom: c1.high,
        startTime: c2.time,
        endTime: data[data.length - 1].time,
        bias: 'Bullish'
      });
    } else if (c3.high < c1.low) {
      zones.push({
        type: 'FVG',
        top: c1.low,
        bottom: c3.high,
        startTime: c2.time,
        endTime: data[data.length - 1].time,
        bias: 'Bearish'
      });
    }
  }

  // 2. Detect Order Blocks
  for (let i = 1; i < data.length - 5; i++) {
    const current = data[i];
    const moveRange = data[i + 3].close - data[i + 1].open;
    
    if (Math.abs(moveRange) > (current.high - current.low) * 2.5) {
      zones.push({
        type: 'OB',
        top: current.high,
        bottom: current.low,
        startTime: current.time,
        endTime: data[data.length - 1].time,
        bias: moveRange > 0 ? 'Bullish' : 'Bearish'
      });
    }
  }

  // 3. Advanced Trendlines (Swing Highs & Lows)
  // Detect Swing Highs (Resistance Trendlines)
  const swingHighs = data.filter((d, idx) => {
    if (idx < 2 || idx > data.length - 3) return false;
    return d.high >= data[idx - 1].high && d.high >= data[idx - 2].high && 
           d.high > data[idx + 1].high && d.high > data[idx + 2].high;
  });

  // Detect Swing Lows (Support Trendlines)
  const swingLows = data.filter((d, idx) => {
    if (idx < 2 || idx > data.length - 3) return false;
    return d.low <= data[idx - 1].low && d.low <= data[idx - 2].low && 
           d.low < data[idx + 1].low && d.low < data[idx + 2].low;
  });

  // Generate Resistance Trendline (High to High)
  if (swingHighs.length >= 2) {
    const lastTwoHighs = swingHighs.slice(-2);
    trendLines.push({
      x1: lastTwoHighs[0].time,
      y1: lastTwoHighs[0].high,
      x2: lastTwoHighs[1].time,
      y2: lastTwoHighs[1].high,
      type: lastTwoHighs[1].high > lastTwoHighs[0].high ? 'Ascending' : 'Descending'
    });
  }

  // Generate Support Trendline (Low to Low)
  if (swingLows.length >= 2) {
    const lastTwoLows = swingLows.slice(-2);
    trendLines.push({
      x1: lastTwoLows[0].time,
      y1: lastTwoLows[0].low,
      x2: lastTwoLows[1].time,
      y2: lastTwoLows[1].low,
      type: lastTwoLows[1].low > lastTwoLows[0].low ? 'Ascending' : 'Descending'
    });
  }

  return { zones: zones.slice(-8), trendLines };
};
