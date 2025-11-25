import React from 'react';
import { RankedSignal } from '../types';

interface SignalRowProps {
  data: RankedSignal;
}

const SignalRow: React.FC<SignalRowProps> = ({ data }) => {
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
    <tr className="border-b border-[#2a2e39] hover:bg-[#2a2e39] transition-colors duration-200">
      <td className="p-4 font-bold text-white">{data.symbol}</td>
      <td className={`p-4 font-medium ${getSignalColor(data.ltf)}`}>{data.ltf}</td>
      <td className={`p-4 font-medium ${getSignalColor(data.htf)}`}>{data.htf}</td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${getSignalBadge(data.signal)}`}>
          {data.signal.replace('_', ' ')}
        </span>
      </td>
      <td className="p-4 text-center">
        <span className={`inline-block w-8 h-8 leading-8 rounded-full text-xs ${getRankBadge(data.rank)}`}>
          {data.rank}
        </span>
      </td>
    </tr>
  );
};

export default SignalRow;