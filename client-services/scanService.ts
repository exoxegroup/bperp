import { fetchAllUsdtSymbols, fetchKlineData } from './binanceService';
import { getTechnicalSignal } from './indicatorService';
import type { RankedSignal, MarketSummary, SignalData } from '../types';

const LOWER_TIMEFRAMES = ['1m', '5m', '15m', '30m'];
const HIGHER_TIMEFRAMES = ['1h', '4h', '1d', '1w'];
const ALL_TIMEFRAMES = [...LOWER_TIMEFRAMES, ...HIGHER_TIMEFRAMES];

export async function scanMarket(onProgress?: (progress: number, total: number) => void): Promise<MarketSummary> {
    const symbols = await fetchAllUsdtSymbols();
    
    // Shuffle symbols to get variety if stopped early? No, keep deterministic.
    
    const results: RankedSignal[] = [];
    let bullish = 0, bearish = 0, neutral = 0;
    
    const BATCH_SIZE = 3; // Low concurrency to prevent rate limits
    const DELAY_BETWEEN_BATCHES = 300; // ms

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(batch.map(async (symbol) => {
            try {
                // Fetch all timeframes for this symbol
                const klinePromises = ALL_TIMEFRAMES.map(tf => fetchKlineData(symbol, tf, 100)); // 100 candles enough
                const klineResults = await Promise.all(klinePromises);
                
                const signalData: SignalData = {};
                
                klineResults.forEach((kline, index) => {
                    const tf = ALL_TIMEFRAMES[index];
                    if (kline && kline.length >= 50) {
                        const { signal } = getTechnicalSignal(kline);
                        signalData[tf] = { signal };
                    } else {
                        signalData[tf] = { signal: 'NEUTRAL' };
                    }
                });
                
                return rankSignalData(symbol, signalData);
            } catch (err) {
                console.warn(`Failed to process ${symbol}`, err);
                return null;
            }
        }));

        batchResults.forEach(res => {
            if (res) {
                results.push(res);
                if (res.signal.includes('BUY')) bullish++;
                else if (res.signal.includes('SELL')) bearish++;
                else neutral++;
            }
        });

        if (onProgress) {
            onProgress(Math.min(i + BATCH_SIZE, symbols.length), symbols.length);
        }
        
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
    
    // Sort results
    const rankOrder: Record<string, number> = { 'A+': 1, 'A': 2, 'B+': 3 };
    const sortedResults = results.sort((a, b) => {
        if (rankOrder[a.rank] !== rankOrder[b.rank]) {
            return rankOrder[a.rank] - rankOrder[b.rank];
        }
        return a.symbol.localeCompare(b.symbol);
    });

    return {
        bullishCount: bullish,
        bearishCount: bearish,
        neutralCount: neutral,
        topSetups: sortedResults
    };
}

// Helper: Ranking Logic
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
  const totalSignals = signals.length; 

  let direction = 'MIXED';
  if (totalBuys === totalSignals && totalBuys > 0) direction = 'BUY';
  else if (totalSells === totalSignals && totalSells > 0) direction = 'SELL';
  
  return {
    direction: direction,
    isUnanimous: (totalBuys === totalSignals) || (totalSells === totalSignals),
    dissentCount: Math.min(totalBuys, totalSells),
    dissentSignal: totalBuys > totalSells ? 'SELL' : 'BUY',
    neutralCount: timeframes.length - totalSignals, 
  };
};

const rankSignalData = (symbol: string, data: SignalData): RankedSignal | null => {
  if (Object.keys(data).length < ALL_TIMEFRAMES.length) return null;
  
  const ltf = getSignalDirection(data, LOWER_TIMEFRAMES);
  const htf = getSignalDirection(data, HIGHER_TIMEFRAMES);

  let rank: 'A+' | 'A' | 'B+' | null = null;
  let finalSignal = 'NEUTRAL';

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
      const hasStrong = data[HIGHER_TIMEFRAMES[0]]?.signal.includes('STRONG') || data[HIGHER_TIMEFRAMES[1]]?.signal.includes('STRONG');
      const finalSignalType = hasStrong ? `STRONG_${finalSignal}` : finalSignal;
      return { symbol, ltf: ltf.direction, htf: htf.direction, signal: finalSignalType, rank };
  }
  return null;
};
