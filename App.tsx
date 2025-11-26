import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllUsdtSymbols, fetchKlineData } from './services/binanceService';
import { getTechnicalSignal } from './services/indicatorService';
import { analyzeMarket } from './services/geminiService';
import { SignalData, RankedSignal, MarketSummary } from './types';
import AIInsight from './components/AIInsight';
import SignalRow from './components/SignalRow';
import SignalCard from './components/SignalCard';
import ScanningControls from './components/ScanningControls';

const LOWER_TIMEFRAMES = ['1m', '5m', '15m', '30m'];
const HIGHER_TIMEFRAMES = ['1h', '4h', '1d', '1w'];
const ALL_TIMEFRAMES = [...LOWER_TIMEFRAMES, ...HIGHER_TIMEFRAMES];

const App: React.FC = () => {
  const [rankedSignals, setRankedSignals] = useState<RankedSignal[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, symbol: '' });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [previousSignals, setPreviousSignals] = useState<RankedSignal[]>([]);
  const [scanInterval, setScanInterval] = useState(15 * 60 * 1000); // 15 mins default
  const [marketVolatility, setMarketVolatility] = useState<number>(0);
  const [confidenceRatio, setConfidenceRatio] = useState<number>(0);

  // Helper logic for signal aggregation (ported from original)
  const getSignalDirection = (data: SignalData, timeframes: string[]) => {
    const signals = timeframes.map(tf => data[tf] ? data[tf].signal : null).filter(s => s && s !== 'NEUTRAL');
    
    if (signals.length === 0) {
      const neutralCount = timeframes.filter(tf => data[tf] && data[tf].signal === 'NEUTRAL').length;
      return { direction: 'NEUTRAL', neutralCount, dissentCount: 0, isUnanimous: false };
    }
    
    const strongBuys = signals.filter(s => s === 'STRONG_BUY').length;
    const buys = signals.filter(s => s === 'BUY').length;
    const strongSells = signals.filter(s => s === 'STRONG_SELL').length;
    const sells = signals.filter(s => s === 'SELL').length;

    const totalBuys = strongBuys + buys;
    const totalSells = strongSells + sells;
    const totalSignals = signals.length; // Excluding neutrals

    let direction = 'MIXED';
    if (totalBuys === totalSignals && totalBuys > 0) direction = 'BUY';
    else if (totalSells === totalSignals && totalSells > 0) direction = 'SELL';
    
    return {
      direction: direction,
      isUnanimous: (totalBuys === totalSignals) || (totalSells === totalSignals),
      dissentCount: Math.min(totalBuys, totalSells),
      dissentSignal: totalBuys > totalSells ? 'SELL' : 'BUY',
      neutralCount: timeframes.length - totalSignals, // Approximate
    };
  };

  const rankSignalData = (symbol: string, data: SignalData): RankedSignal | null => {
    if (Object.keys(data).length < ALL_TIMEFRAMES.length) return null;
    
    const ltf = getSignalDirection(data, LOWER_TIMEFRAMES);
    const htf = getSignalDirection(data, HIGHER_TIMEFRAMES);

    let rank: 'A+' | 'A' | 'B+' | null = null;
    let finalSignal = 'NEUTRAL';

    // Ranking Logic
    if (ltf.isUnanimous && htf.isUnanimous && ltf.direction === htf.direction && ltf.direction !== 'NEUTRAL') {
        rank = 'A+';
        finalSignal = ltf.direction;
    }
    else if (htf.isUnanimous && htf.direction !== 'NEUTRAL' && ltf.dissentCount <= 1 && ltf.dissentSignal !== htf.direction) {
        rank = 'A';
        finalSignal = htf.direction;
    } else if (ltf.isUnanimous && ltf.direction !== 'NEUTRAL' && htf.dissentCount <= 1 && htf.dissentSignal !== ltf.direction) {
        rank = 'A';
        finalSignal = ltf.direction;
    }
    else if (htf.isUnanimous && htf.direction !== 'NEUTRAL' && ltf.neutralCount >= 1 && ltf.dissentCount === 0) {
        rank = 'B+';
        finalSignal = htf.direction;
    } else if (ltf.isUnanimous && ltf.direction !== 'NEUTRAL' && htf.neutralCount >= 1 && htf.dissentCount === 0) {
        rank = 'B+';
        finalSignal = ltf.direction;
    }

    if (rank) {
        // Upgrade signal text if HTF contains strong signals
        const hasStrong = data[HIGHER_TIMEFRAMES[0]]?.signal.includes('STRONG') || data[HIGHER_TIMEFRAMES[1]]?.signal.includes('STRONG');
        const finalSignalType = hasStrong ? `STRONG_${finalSignal}` : finalSignal;
        return { symbol, ltf: ltf.direction, htf: htf.direction, signal: finalSignalType, rank };
    }
    return null;
  };

  // Intelligent scanning functions
  const calculateOptimalScanInterval = (signals: RankedSignal[]): number => {
    const highConfidenceSignals = signals.filter(s => s.rank === 'A+').length;
    const totalSignals = signals.length;
    const confidence = highConfidenceSignals / totalSignals;
    setConfidenceRatio(confidence);
    
    // More frequent scanning when market is decisive (high confidence signals)
    if (confidence > 0.3) return 5 * 60 * 1000; // 5 mins
    if (confidence > 0.15) return 10 * 60 * 1000; // 10 mins
    return 15 * 60 * 1000; // 15 mins for choppy markets
  };

  const analyzeMarketVolatility = (signals: RankedSignal[]): number => {
    const buySignals = signals.filter(s => s.signal.includes('BUY')).length;
    const sellSignals = signals.filter(s => s.signal.includes('SELL')).length;
    const totalSignals = signals.length;
    
    // High volatility = big difference between buy/sell signals
    const volatility = Math.abs(buySignals - sellSignals) / totalSignals;
    setMarketVolatility(volatility);
    return volatility;
  };

  const detectSignificantChanges = (current: RankedSignal[], previous: RankedSignal[]): boolean => {
    if (previous.length === 0) return false;
    
    const significantChanges = current.filter(currentSignal => {
      const previousSignal = previous.find(p => p.symbol === currentSignal.symbol);
      if (!previousSignal) return false;
      
      // Detect rank upgrades/downgrades
      const rankChanged = currentSignal.rank !== previousSignal.rank;
      const signalFlipped = (currentSignal.signal.includes('BUY') && previousSignal.signal.includes('SELL')) ||
                            (currentSignal.signal.includes('SELL') && previousSignal.signal.includes('BUY'));
      
      return rankChanged || signalFlipped;
    });
    
    return significantChanges.length > 3; // Trigger rescan if 3+ major changes
  };

  const runScanner = useCallback(async () => {
    setScanning(true);
    setAiAnalysis(null); // Reset AI when new data comes in
    
    const symbols = await fetchAllUsdtSymbols();
    setProgress({ current: 0, total: symbols.length, symbol: 'Initializing scanner...' });

    const newRankedSignals: RankedSignal[] = [];

    // Process all symbols sequentially with proper rate limiting
    // This matches the SAMPLE.txt approach for handling 503+ coins
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const progress = ((i + 1) / symbols.length) * 100;
      
      setProgress({ current: i + 1, total: symbols.length, symbol });

      const signalData: SignalData = {};
      
      // Conservative delay to prevent rate limiting (250ms like SAMPLE.txt)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      try {
        // Fetch all timeframes
        const klinePromises = ALL_TIMEFRAMES.map(tf => fetchKlineData(symbol, tf, 100));
        const klineResults = await Promise.all(klinePromises);

        klineResults.forEach((kline, index) => {
          const tf = ALL_TIMEFRAMES[index];
          if (kline && kline.length >= 50) {
            signalData[tf] = { signal: getTechnicalSignal(kline) };
          } else {
            signalData[tf] = { signal: 'NEUTRAL' };
          }
        });

        const rank = rankSignalData(symbol, signalData);
        if (rank) {
          newRankedSignals.push(rank);
        }
      } catch (error) {
        console.warn(`Failed to process ${symbol}:`, error);
        // Continue with next symbol if one fails
        continue;
      }
    }

    // Sort: A+ first, then A, then B+
    const rankOrder = { 'A+': 1, 'A': 2, 'B+': 3 };
    newRankedSignals.sort((a, b) => {
      if (rankOrder[a.rank] !== rankOrder[b.rank]) {
        return rankOrder[a.rank] - rankOrder[b.rank];
      }
      return a.symbol.localeCompare(b.symbol);
    });

    // Intelligent scanning logic
    const volatility = analyzeMarketVolatility(newRankedSignals);
    const newInterval = calculateOptimalScanInterval(newRankedSignals);
    
    // Check for significant changes and trigger immediate rescan if needed
    if (detectSignificantChanges(newRankedSignals, previousSignals)) {
      console.log('Significant market changes detected - scheduling immediate rescan');
      setTimeout(() => runScanner(), 2 * 60 * 1000); // Rescan in 2 minutes
    }
    
    // Update scan interval based on market conditions
    if (newInterval !== scanInterval) {
      console.log(`Adjusting scan interval to ${newInterval / 1000 / 60} minutes based on market conditions`);
      setScanInterval(newInterval);
    }

    setPreviousSignals(newRankedSignals);
    setRankedSignals(newRankedSignals);
    setLastUpdated(new Date());
    setScanning(false);
  }, [previousSignals, scanInterval]);

  const handleAiAnalysis = async () => {
    if (rankedSignals.length === 0) return;
    setAnalyzingAi(true);

    let bullish = 0;
    let bearish = 0;
    let neutral = 0;

    rankedSignals.forEach(s => {
        if (s.signal.includes('BUY')) bullish++;
        else if (s.signal.includes('SELL')) bearish++;
        else neutral++;
    });

    const summary: MarketSummary = {
        bullishCount: bullish,
        bearishCount: bearish,
        neutralCount: neutral,
        topSetups: rankedSignals.slice(0, 5) // Top 5
    };

    const text = await analyzeMarket(summary);
    setAiAnalysis(text);
    setAnalyzingAi(false);
  };

  useEffect(() => {
    runScanner();
    const interval = setInterval(runScanner, scanInterval);
    console.log(`Auto-scanning interval set to ${scanInterval / 1000 / 60} minutes`);
    return () => clearInterval(interval);
  }, [runScanner, scanInterval]);

  return (
    <div className="min-h-screen bg-[#131722] text-[#d1d4dc] font-sans">
      <div className="container mx-auto p-4 md:p-8">
        
        <header className="mb-6 md:mb-8 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Crypto Perpetual <span className="text-[#2962ff]">Futures</span> Signals
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-lg">
            Multi-timeframe confluence scanner & AI Analysis
          </p>
        </header>

        {/* AI Section */}
        <AIInsight 
            analysis={aiAnalysis} 
            isLoading={analyzingAi} 
            onGenerate={handleAiAnalysis} 
        />

        {/* Smart Scanning Controls */}
        <ScanningControls
            currentInterval={scanInterval}
            onIntervalChange={setScanInterval}
            marketVolatility={marketVolatility}
            confidenceRatio={confidenceRatio}
            isScanning={scanning}
        />

        {/* Main Card */}
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden">
          
          <div className="p-4 md:p-6 border-b border-[#2a2e39] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full md:w-auto flex justify-between md:block items-center">
                <h3 className="text-lg md:text-xl font-bold text-white border-l-4 border-[#2962ff] pl-3">
                    Signal Ranking
                </h3>
                {lastUpdated && !scanning && (
                    <p className="text-xs text-gray-500 md:mt-1 md:pl-4">
                        {lastUpdated.toLocaleTimeString()}
                    </p>
                )}
            </div>

            {scanning && (
                <div className="w-full md:w-1/3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Scanning {progress.symbol}...</span>
                        <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-[#131722] rounded-full h-2">
                        <div 
                            className="bg-[#2962ff] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}
            
            {!scanning && (
                <button 
                    onClick={runScanner}
                    className="w-full md:w-auto text-xs text-[#2962ff] hover:text-white border border-[#2962ff] hover:bg-[#2962ff] px-3 py-2 rounded transition flex justify-center items-center"
                >
                    <i className="fas fa-sync-alt mr-1"></i> Refresh
                </button>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2a2e39]/50 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Symbol</th>
                  <th className="p-4 font-semibold">LTF (1m-30m)</th>
                  <th className="p-4 font-semibold">HTF (1h-1w)</th>
                  <th className="p-4 font-semibold">Signal</th>
                  <th className="p-4 font-semibold text-center">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2e39]">
                {rankedSignals.length > 0 ? (
                    rankedSignals.map((signal) => (
                        <SignalRow key={signal.symbol} data={signal} />
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                            {scanning ? 'Scanning market...' : 'No high-probability setups found.'}
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4">
             {rankedSignals.length > 0 ? (
                 rankedSignals.map((signal) => (
                     <SignalCard key={signal.symbol} data={signal} />
                 ))
             ) : (
                 <div className="text-center text-gray-500 py-8">
                     {scanning ? 'Scanning market...' : 'No high-probability setups found.'}
                 </div>
             )}
          </div>
        </div>
        
        <footer className="mt-8 text-center text-gray-600 text-xs pb-4">
            <p>Data provided by Binance Futures API. AI Analysis by Google Gemini.</p>
            <p className="mt-1">Trading involves risk. This dashboard is for educational purposes only.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;