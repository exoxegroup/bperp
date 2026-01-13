import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import type { RankedSignal } from '../../types';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface SignalCardProps {
  data: RankedSignal;
}

export const SignalCard: React.FC<SignalCardProps> = ({ data }) => {
  const isBuy = data.signal.includes('BUY');
  const isStrong = data.signal.includes('STRONG');
  
  const signalColor = isBuy ? 'text-emerald-400' : data.signal.includes('SELL') ? 'text-red-400' : 'text-gray-400';
  const glowClass = isBuy 
    ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)] border-emerald-500/30' 
    : data.signal.includes('SELL') 
      ? 'shadow-[0_0_15px_rgba(239,68,68,0.15)] border-red-500/30' 
      : '';

  return (
    <GlassCard 
      hoverEffect 
      className={`p-5 relative overflow-hidden group ${isStrong ? glowClass : ''}`}
    >
      {/* Rank Badge */}
      <div className="absolute top-0 right-0">
        <div className={`px-3 py-1 rounded-bl-xl text-xs font-bold ${
          data.rank === 'A+' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' :
          data.rank === 'A' ? 'bg-blue-900/50 text-blue-200' :
          'bg-slate-700/50 text-gray-300'
        }`}>
          {data.rank}
        </div>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">{data.symbol}</h3>
          <p className="text-xs text-gray-500">Perpetual</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase">Signal</span>
          <div className={`flex items-center gap-1 font-bold ${signalColor}`}>
            {isBuy ? <ArrowUpRight size={16} /> : data.signal.includes('SELL') ? <ArrowDownRight size={16} /> : <Minus size={16} />}
            {data.signal.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-800/50 p-2 rounded-lg text-center">
          <span className="block text-gray-500 mb-1">LTF (1m-30m)</span>
          <span className={data.ltf === 'BUY' ? 'text-emerald-400' : data.ltf === 'SELL' ? 'text-red-400' : 'text-gray-400'}>
            {data.ltf}
          </span>
        </div>
        <div className="bg-slate-800/50 p-2 rounded-lg text-center">
          <span className="block text-gray-500 mb-1">HTF (1h-1w)</span>
          <span className={data.htf === 'BUY' ? 'text-emerald-400' : data.htf === 'SELL' ? 'text-red-400' : 'text-gray-400'}>
            {data.htf}
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
