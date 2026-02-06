
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MarketSymbol, Timeframe, OhlcData, TechnicalAnalysis } from './types';
import { getTechnicalAnalysisFromRealData } from './utils/dataGenerator';
import { getAIAnalysis } from './services/geminiService';
import { fetchBinanceKlines, fetchBinanceTicker } from './services/binanceService';
import { detectSMC, calculateEMA } from './utils/technicalCalculations';
import MarketChart from './components/MarketChart';
import AnalysisTable from './components/AnalysisTable';

interface TimeframeTrend {
  tf: Timeframe;
  label: string;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  price: number;
}

const AI_COOLDOWN_SEC = 60;

const App: React.FC = () => {
  const [symbol, setSymbol] = useState<MarketSymbol>('BTC');
  const [timeframe, setTimeframe] = useState<Timeframe>('4H');
  const [chartData, setChartData] = useState<OhlcData[]>([]);
  const [analysis, setAnalysis] = useState<TechnicalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lastAiUpdated, setLastAiUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [multiTrends, setMultiTrends] = useState<TimeframeTrend[]>([]);
  const [cooldown, setCooldown] = useState<number>(0);
  
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const timeframes: { label: string; value: Timeframe }[] = [
    { label: '5 นาที', value: '5m' },
    { label: '15 นาที', value: '15m' },
    { label: '30 นาที', value: '30m' },
    { label: '1 ชม.', value: '1H' },
    { label: '4 ชม.', value: '4H' },
    { label: '1 วัน', value: '1D' },
  ];

  const triggerAI = async (currentAnalysis: TechnicalAnalysis) => {
    if (loadingAI || cooldown > 0) return;

    setLoadingAI(true);
    try {
      const insight = await getAIAnalysis(currentAnalysis);
      setAiInsight(insight);
      setLastAiUpdated(new Date());
    } catch (error: any) {
      if (error.message === 'QUOTA_EXHAUSTED') {
        setAiInsight("⚠️ โควตา API ฟรีเต็มแล้ว\nกรุณารอประมาณ 1 นาทีเพื่อให้ระบบรีเซ็ต แล้วกดปุ่ม Update ใหม่อีกครั้ง");
        startCooldown(AI_COOLDOWN_SEC);
      } else {
        setAiInsight("⚠️ ไม่สามารถวิเคราะห์ได้ในขณะนี้ โปรดลองใหม่อีกครั้ง");
      }
    } finally {
      setLoadingAI(false);
    }
  };

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (cooldownInterval.current) clearInterval(cooldownInterval.current);
    cooldownInterval.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (cooldownInterval.current) clearInterval(cooldownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const loadMultiTrends = useCallback(async () => {
    const trendIntervals = ['15m', '1H', '4H', '1D'] as Timeframe[];
    try {
      const results: TimeframeTrend[] = [];
      for (const tf of trendIntervals) {
        try {
          const klines = await fetchBinanceKlines(symbol, tf, 40);
          const ema20 = calculateEMA(klines, 20);
          const lastClose = klines[klines.length - 1].close;
          const lastEma = ema20[ema20.length - 1];
          results.push({ tf, label: tf, trend: lastClose > lastEma ? 'Bullish' : 'Bearish', price: lastClose });
        } catch { /* skip */ }
      }
      setMultiTrends(results);
    } catch (err) { console.error(err); }
  }, [symbol]);

  const loadMarketData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [klines, ticker] = await Promise.all([
        fetchBinanceKlines(symbol, timeframe),
        fetchBinanceTicker(symbol)
      ]);
      const lastPrice = parseFloat(ticker.lastPrice);
      const change24h = parseFloat(ticker.priceChangePercent);
      const smc = detectSMC(klines);
      const techAnalysis = getTechnicalAnalysisFromRealData(symbol, timeframe, lastPrice, change24h);
      
      setChartData(klines);
      setAnalysis({ ...techAnalysis, smcZones: smc.zones, trendLines: smc.trendLines });
      setLastUpdated(new Date());
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    loadMarketData();
    loadMultiTrends();
    refreshInterval.current = setInterval(() => loadMarketData(true), 20000);
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      if (cooldownInterval.current) clearInterval(cooldownInterval.current);
    };
  }, [loadMarketData, loadMultiTrends]);

  // ล้าง AI Insight เมื่อเปลี่ยนคู่เงินเพื่อให้ผู้ใช้กดวิเคราะห์ใหม่
  useEffect(() => {
    setAiInsight("กดปุ่ม 'Update' เพื่อเริ่มการวิเคราะห์ด้วย AI สำหรับคู่เงินนี้");
  }, [symbol, timeframe]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#8B2E8B] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">PEA Terminal Booting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="bg-[#8B2E8B] p-2 rounded-xl">
            <i className="fas fa-terminal text-white text-xs"></i>
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">PEA <span className="text-[#F37021]">TERMINAL</span></h1>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                {isConnected ? 'Market Online' : 'Sync Error'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value as MarketSymbol)} className="bg-slate-100 border-none rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wider focus:ring-2 ring-purple-200 outline-none">
            <optgroup label="Commodities">
              <option value="XAUUSD">GOLD (XAU/USD)</option>
              <option value="XAGUSD">SILVER (XAG/USD)</option>
            </optgroup>
            <optgroup label="Crypto">
              <option value="BTC">Bitcoin</option>
              <option value="ETH">Ethereum</option>
              <option value="SOL">Solana</option>
            </optgroup>
          </select>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as Timeframe)} className="bg-[#8B2E8B] text-white border-none rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-purple-900/10">
            {timeframes.map(tf => <option key={tf.value} value={tf.value} className="text-slate-900">{tf.label}</option>)}
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {multiTrends.map((t, i) => (
            <div key={i} className={`bg-white border-l-4 p-5 rounded-2xl shadow-sm ${t.trend === 'Bullish' ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.label} Trend</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[12px] font-black uppercase ${t.trend === 'Bullish' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.trend}
                </span>
                <i className={`fas ${t.trend === 'Bullish' ? 'fa-arrow-trend-up text-green-400' : 'fa-arrow-trend-down text-red-400'}`}></i>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-10">
            <MarketChart 
              data={chartData} 
              levels={analysis?.levels || []} 
              smcZones={analysis?.smcZones || []} 
              trendLines={analysis?.trendLines || []} 
              symbol={symbol} 
            />
            {analysis && <AnalysisTable levels={analysis.levels} indicators={analysis.indicators} />}
          </div>

          <div className="space-y-10">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl shadow-slate-200/40 border-b-8 border-b-[#8B2E8B]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <i className="fas fa-robot mr-2 text-[#F37021]"></i> AI ANALYST
                </h3>
                <button 
                  onClick={() => analysis && triggerAI(analysis)}
                  disabled={loadingAI || cooldown > 0}
                  className="bg-[#8B2E8B] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-purple-900/10"
                >
                  {loadingAI ? <i className="fas fa-circle-notch animate-spin"></i> : cooldown > 0 ? `Wait ${cooldown}s` : 'Update'}
                </button>
              </div>
              
              <div className="p-8 min-h-[400px]">
                {loadingAI ? (
                  <div className="space-y-4">
                    <div className="h-3 bg-slate-100 rounded-full animate-pulse w-full"></div>
                    <div className="h-3 bg-slate-100 rounded-full animate-pulse w-[90%]"></div>
                    <div className="h-3 bg-slate-100 rounded-full animate-pulse w-[95%]"></div>
                    <div className="h-3 bg-slate-100 rounded-full animate-pulse w-[70%]"></div>
                    <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-10">Processing Technical Data...</p>
                  </div>
                ) : (
                  <div className="text-slate-700 text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                    {aiInsight}
                  </div>
                )}
              </div>
              
              {lastAiUpdated && (
                <div className="px-8 py-4 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">
                  Last Insight: {lastAiUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <i className="fas fa-shield-halved text-6xl"></i>
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Terminal Security</h4>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[11px] font-bold text-slate-400">Data Feed</span>
                  <span className="text-[11px] font-mono text-green-400">ENCRYPTED</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[11px] font-bold text-slate-400">API Status</span>
                  <span className={`text-[11px] font-mono ${cooldown > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                    {cooldown > 0 ? 'COOLDOWN' : 'READY'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Latency</span>
                  <span className="text-[11px] font-mono">24ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
