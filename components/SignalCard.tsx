import React from 'react';
import { RankedSignal } from '../types';

interface SignalCardProps {
  data: RankedSignal;
}

const SignalCard: React.FC<SignalCardProps> = ({ data }) => {
  const getSignalColor = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('buy')) return 'text-[#26a69a]';
    if (lower.includes('sell')) return 'text-[#ef5350]';
    return 'text-[#ffc107]';
  };

  const getSignalBadge = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('strong buy')) return 'bg-[#26a69a] text-white';
    if (lower.includes('buy')) return 'bg-[#26a69a]/20 text-[#26a69a] border border-[#26a69a]';
    if (lower.includes('strong sell')) return 'bg-[#ef5350] text-white';
    if (lower.includes('sell')) return 'bg-[#ef5350]/20 text-[#ef5350] border border-[#ef5350]';
    return 'bg-[#ffc107]/20 text-[#ffc107] border border-[#ffc107]';
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'A+': return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black font-extrabold shadow-lg shadow-orange-500/20';
      case 'A': return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold';
      case 'B+': return 'bg-gradient-to-br from-green-400 to-emerald-600 text-white font-semibold';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="bg-[#2a2e39]/30 rounded-lg p-4 mb-3 border border-[#2a2e39] shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-lg text-white">{data.symbol}</span>
        <span className={`px-3 py-1 rounded-full text-xs ${getRankBadge(data.rank)}`}>
          {data.rank}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs mb-1">LTF</span>
          <span className={`font-medium ${getSignalColor(data.ltf)}`}>{data.ltf}</span>
        </div>
        <div className="flex flex-col">
           <span className="text-gray-500 text-xs mb-1">HTF</span>
           <span className={`font-medium ${getSignalColor(data.htf)}`}>{data.htf}</span>
        </div>
        <div className="flex flex-col">
           <span className="text-gray-500 text-xs mb-1">Signal</span>
           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide w-fit ${getSignalBadge(data.signal)}`}>
            {data.signal.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;