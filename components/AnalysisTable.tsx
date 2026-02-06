
import React from 'react';
import { SupportResistance, IndicatorSignal } from '../types';

interface AnalysisTableProps {
  levels: SupportResistance[];
  indicators: IndicatorSignal[];
}

const AnalysisTable: React.FC<AnalysisTableProps> = ({ levels, indicators }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Levels Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <i className="fas fa-bullseye text-[#F37021] text-xs"></i>
          <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Levels Distribution</h3>
        </div>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-50 bg-slate-50/50">
              <th className="px-6 py-3 font-black uppercase tracking-widest">Level</th>
              <th className="px-6 py-3 font-black uppercase tracking-widest">Type</th>
              <th className="px-6 py-3 font-black uppercase tracking-widest text-right">Reliability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {levels.map((lvl, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-700">${lvl.level.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                    lvl.type === 'Resistance' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {lvl.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {[1, 2, 3].map((s) => (
                      <div 
                        key={s} 
                        className={`h-1 w-3 rounded-full ${
                          s <= (lvl.strength === 'Strong' ? 3 : lvl.strength === 'Moderate' ? 2 : 1)
                            ? (lvl.type === 'Resistance' ? 'bg-red-400' : 'bg-green-400')
                            : 'bg-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Indicators Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <i className="fas fa-wave-square text-[#8B2E8B] text-xs"></i>
          <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Oscillators & Trend</h3>
        </div>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-50 bg-slate-50/50">
              <th className="px-6 py-3 font-black uppercase tracking-widest">Name</th>
              <th className="px-6 py-3 font-black uppercase tracking-widest">Reading</th>
              <th className="px-6 py-3 font-black uppercase tracking-widest">Bias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {indicators.map((ind, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-black text-slate-700 uppercase tracking-tighter">{ind.name}</div>
                  <div className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">{ind.description}</div>
                </td>
                <td className="px-6 py-4 font-mono text-slate-500 font-bold">{ind.value}</td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-2 font-black text-[9px] ${
                    ind.trend === 'Bullish' ? 'text-green-600' : ind.trend === 'Bearish' ? 'text-red-600' : 'text-slate-400'
                  }`}>
                    {ind.trend}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalysisTable;
