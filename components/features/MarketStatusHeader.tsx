import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { GlassCard } from '../ui/GlassCard';
import { Activity, Brain, TrendingUp, AlertTriangle } from 'lucide-react';

interface MarketStatusHeaderProps {
  aiAnalysis: string | null;
  isLoading: boolean;
  marketSummary: {
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
  } | null;
}

export const MarketStatusHeader: React.FC<MarketStatusHeaderProps> = ({ 
  aiAnalysis, 
  isLoading, 
  marketSummary 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (aiAnalysis && textRef.current) {
      gsap.fromTo(textRef.current, 
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }
  }, [aiAnalysis]);

  const getSentimentColor = () => {
    if (!marketSummary) return 'text-gray-400';
    if (marketSummary.bullishCount > marketSummary.bearishCount * 1.5) return 'text-emerald-400';
    if (marketSummary.bearishCount > marketSummary.bullishCount * 1.5) return 'text-red-400';
    return 'text-blue-400';
  };

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* AI Insight Section */}
      <GlassCard className="lg:col-span-2 p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Brain size={100} />
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Activity className="text-blue-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">AI Market Analyst</h2>
          {isLoading && <span className="text-xs text-blue-400 animate-pulse">Analyzing...</span>}
        </div>

        <div className="relative z-10 min-h-[100px]">
          {aiAnalysis ? (
            <div className="prose prose-invert max-w-none">
              <p ref={textRef} className="text-gray-300 leading-relaxed whitespace-pre-line">
                {aiAnalysis}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
              <Brain size={48} className="mb-2 opacity-50" />
              <p>Waiting for market data...</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Market Stats Section */}
      <GlassCard className="p-6 flex flex-col justify-center">
        <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-6 flex items-center gap-2">
          <TrendingUp size={16} /> Market Sentiment
        </h3>

        {marketSummary ? (
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-white">
                {marketSummary.bullishCount + marketSummary.bearishCount + marketSummary.neutralCount}
              </span>
              <span className={`text-lg font-medium ${getSentimentColor()}`}>
                {marketSummary.bullishCount > marketSummary.bearishCount ? 'Bullish' : 'Bearish'} Bias
              </span>
            </div>

            {/* Sentiment Bar */}
            <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                style={{ width: `${(marketSummary.bullishCount / (marketSummary.bullishCount + marketSummary.bearishCount + marketSummary.neutralCount)) * 100}%` }}
              />
              <div 
                className="h-full bg-slate-600 transition-all duration-1000"
                style={{ width: `${(marketSummary.neutralCount / (marketSummary.bullishCount + marketSummary.bearishCount + marketSummary.neutralCount)) * 100}%` }}
              />
              <div 
                className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-1000"
                style={{ width: `${(marketSummary.bearishCount / (marketSummary.bullishCount + marketSummary.bearishCount + marketSummary.neutralCount)) * 100}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Bullish ({marketSummary.bullishCount})
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                Neutral ({marketSummary.neutralCount})
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Bearish ({marketSummary.bearishCount})
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <AlertTriangle size={32} className="mb-2 opacity-50" />
            <p>No data available</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
