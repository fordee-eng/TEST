
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Line,
  Brush
} from 'recharts';
import { OhlcData, SupportResistance, SMCZone, TrendLine } from '../types';
import { calculateEMA } from '../utils/technicalCalculations';

interface MarketChartProps {
  data: OhlcData[];
  levels: SupportResistance[];
  smcZones: SMCZone[];
  trendLines: TrendLine[];
  symbol: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white/95 border border-slate-200 p-4 rounded-xl shadow-2xl backdrop-blur-sm">
        <p className="text-slate-400 text-[10px] mb-2 font-mono font-bold border-b pb-1">{label}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
          <span className="text-slate-400 font-bold uppercase">Price:</span> 
          <span className="text-slate-900 font-mono font-bold">${d.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          
          <span className="text-slate-400 font-bold uppercase">Volume:</span> 
          <span className="text-slate-500 font-mono font-bold">{d.volume.toFixed(2)}</span>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
          <p className="text-orange-500 text-[9px] font-black uppercase tracking-wider">EMA 5: ${d.ema5.toLocaleString()}</p>
          <p className="text-purple-600 text-[9px] font-black uppercase tracking-wider">EMA 21: ${d.ema21.toLocaleString()}</p>
        </div>
      </div>
    );
  }
  return null;
};

const MarketChart: React.FC<MarketChartProps> = ({ data, levels, smcZones, trendLines, symbol }) => {
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number }>({ start: 0, end: 100 });
  const [yDomain, setYDomain] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const startIndex = Math.floor((zoomRange.start / 100) * data.length);
    const endIndex = Math.ceil((zoomRange.end / 100) * data.length);
    const visibleData = data.slice(startIndex, endIndex);
    
    if (visibleData.length > 0) {
      const min = Math.min(...visibleData.map(d => d.low));
      const max = Math.max(...visibleData.map(d => d.high));
      setYDomain([min * 0.999, max * 1.001]);
    }
  }, [data, zoomRange]);

  if (!data || data.length === 0) return (
    <div className="h-[550px] flex items-center justify-center bg-white rounded-3xl border border-slate-200">
      <p className="text-slate-400 animate-pulse font-bold uppercase tracking-widest text-[10px]">Connecting to Binance WebSocket...</p>
    </div>
  );

  const ema5 = calculateEMA(data, 5);
  const ema21 = calculateEMA(data, 21);

  const chartData = data.map((d, i) => ({
    ...d,
    ema5: ema5[i],
    ema21: ema21[i]
  }));

  const handleBrushChange = (range: any) => {
    if (range && typeof range.startIndex === 'number' && typeof range.endIndex === 'number') {
      const start = (range.startIndex / data.length) * 100;
      const end = (range.endIndex / data.length) * 100;
      setZoomRange({ start, end });
    }
  };

  return (
    <div className="h-[600px] w-full bg-white rounded-3xl p-6 border border-slate-200 relative overflow-hidden shadow-sm group">
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <div className="bg-[#8B2E8B] p-2.5 rounded-xl shadow-lg shadow-purple-900/10">
          <i className="fas fa-chart-area text-white text-xs"></i>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">{symbol}</h3>
            <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-600 text-[8px] font-black uppercase border border-green-200 animate-pulse">Live 1s</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Stream Terminal</p>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
         <div className="flex items-center gap-4 bg-slate-50/80 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-500 shadow-sm">
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> <span>Real-time</span>
           </div>
           <div className="w-px h-3 bg-slate-200"></div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-orange-500"></div> <span>EMA 5</span>
           </div>
           <div className="w-px h-3 bg-slate-200"></div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-purple-500"></div> <span>EMA 21</span>
           </div>
         </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 80, right: 10, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B2E8B" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#8B2E8B" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
            minTickGap={60}
          />
          <YAxis 
            domain={yDomain} 
            orientation="right" 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            allowDataOverflow={true}
          />
          <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
          
          {smcZones.map((zone, idx) => (
            <ReferenceArea 
              key={`smc-${idx}`}
              x1={zone.startTime}
              x2={zone.endTime}
              y1={zone.bottom}
              y2={zone.top}
              fill={zone.type === 'OB' ? (zone.bias === 'Bullish' ? '#22c55e08' : '#ef444408') : '#F3702105'}
              stroke={zone.type === 'OB' ? (zone.bias === 'Bullish' ? '#22c55e15' : '#ef444415') : '#F3702110'}
              strokeWidth={1}
            />
          ))}

          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="#8B2E8B" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            isAnimationActive={false}
          />

          <Line type="monotone" dataKey="ema5" stroke="#F37021" strokeWidth={1} dot={false} strokeDasharray="5 5" opacity={0.6} isAnimationActive={false} />
          <Line type="monotone" dataKey="ema21" stroke="#8B2E8B" strokeWidth={1.5} dot={false} opacity={0.4} isAnimationActive={false} />

          {levels.map((lvl, idx) => (
            <ReferenceLine 
              key={`lvl-${idx}`}
              y={lvl.level} 
              stroke={lvl.type === 'Resistance' ? '#ef4444' : '#22c55e'} 
              strokeDasharray="4 4"
              opacity={0.15}
            />
          ))}
          
          {trendLines.map((line, idx) => {
            // Determine if it's likely a support or resistance line based on y-values relative to current price
            // Or just use ascending/descending for visual distinction
            const isAscending = line.type === 'Ascending';
            return (
              <ReferenceLine
                key={`trend-${idx}`}
                stroke={isAscending ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                opacity={0.4}
                strokeDasharray="10 5"
                segment={[{x: line.x1, y: line.y1}, {x: line.x2, y: line.y2}]}
              />
            );
          })}

          <Brush 
            dataKey="time" 
            height={30} 
            stroke="#8B2E8B" 
            fill="#f8fafc" 
            startIndex={Math.max(0, chartData.length - 100)}
            onChange={handleBrushChange}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketChart;
