import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchAllUsdtSymbols, fetchKlineData } from './services/binanceService.js';
import { getTechnicalSignal } from './services/indicatorService.js';
import { analyzeMarket } from './services/ollamaService.js';
import { analyzeMarketWithGemini } from './services/geminiService.js';
import type { SignalData, RankedSignal, MarketSummary } from './types.js';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Constants for Ranking
const LOWER_TIMEFRAMES = ['1m', '5m', '15m', '30m'];
const HIGHER_TIMEFRAMES = ['1h', '4h', '1d', '1w'];
const ALL_TIMEFRAMES = [...LOWER_TIMEFRAMES, ...HIGHER_TIMEFRAMES];

// Helper: Ranking Logic (Moved from App.tsx)
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

// API: Debug Connectivity
app.get('/api/debug-connectivity', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const results: any = {};
        
        // Test Google (Internet Check)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const google = await fetch('https://www.google.com', { method: 'HEAD', signal: controller.signal });
            clearTimeout(timeoutId);
            results.internet = google.ok ? 'OK' : `Failed: ${google.status}`;
        } catch (e: any) {
            results.internet = `Error: ${e.message}`;
        }

        // Test Binance Futures
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const fapi = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo', { method: 'HEAD', signal: controller.signal });
            clearTimeout(timeoutId);
            results.binanceFutures = fapi.ok ? 'OK' : `Failed: ${fapi.status}`;
        } catch (e: any) {
            results.binanceFutures = `Error: ${e.message}`;
        }

        // Test Binance Spot (Often less restricted)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const api = await fetch('https://api.binance.com/api/v3/ping', { method: 'GET', signal: controller.signal });
            clearTimeout(timeoutId);
            results.binanceSpot = api.ok ? 'OK' : `Failed: ${api.status}`;
        } catch (e: any) {
            results.binanceSpot = `Error: ${e.message}`;
        }

        res.json({
            region: process.env.RENDER_REGION || 'Unknown',
            results
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API: Full Market Scan
app.get('/api/scan', async (req, res) => {
  try {
    const symbols = await fetchAllUsdtSymbols();
    
    if (!symbols || symbols.length === 0) {
        console.error("Critical Error: No symbols fetched from Binance. API might be unreachable.");
        // Check if it's likely a geo-block based on empty result but no explicit throw yet (or add try/catch around fetchAll)
        res.status(502).json({ error: "Failed to connect to Binance API. Server region might be restricted (Geo-blocked)." });
        return;
    }

    // LIMIT FOR DEMO/DEV: First 20 symbols to avoid massive wait times if not batched
    // In production, implement a queue or worker system.
    // For now, let's try 50 symbols.
    const symbolsToScan = symbols.slice(0, 50); 
    
    console.log(`Scanning ${symbolsToScan.length} symbols...`);

    const results: RankedSignal[] = [];
    const marketStats = { bullish: 0, bearish: 0, neutral: 0 };

    // Process symbols in chunks to avoid overwhelming the event loop/API
    // Simple serial for now to respect rate limits safely
    for (const symbol of symbolsToScan) {
      const signalData: SignalData = {};
      
      // We need data for ALL timeframes
      // Parallelize timeframes for a single symbol
      const timeframePromises = ALL_TIMEFRAMES.map(async (tf) => {
        const klines = await fetchKlineData(symbol, tf, 60); // 60 candles enough for SMA50
        if (!klines || klines.length === 0) {
             // console.log(`No klines for ${symbol} ${tf}`);
             return null;
        }
        const { signal } = getTechnicalSignal(klines);
        return { tf, signal };
      });

      const tfResults = await Promise.all(timeframePromises);
      
      let complete = true;
      tfResults.forEach(r => {
        if (r) signalData[r.tf] = { signal: r.signal };
        else complete = false;
      });

      if (complete) {
        const ranked = rankSignalData(symbol, signalData);
        if (ranked) {
          results.push(ranked);
          if (ranked.signal.includes('BUY')) marketStats.bullish++;
          else if (ranked.signal.includes('SELL')) marketStats.bearish++;
          else marketStats.neutral++;
        } else {
             // Debug: Log why it wasn't ranked
             // console.log(`Symbol ${symbol} not ranked. Signal Data:`, JSON.stringify(signalData));
        }
      } else {
          console.log(`Symbol ${symbol} incomplete data`);
      }
    }

    const response: MarketSummary = {
      bullishCount: marketStats.bullish,
      bearishCount: marketStats.bearish,
      neutralCount: marketStats.neutral,
      topSetups: results.sort((a, b) => (a.rank === 'A+' ? -1 : 1)) // Prioritize A+
    };

    res.json(response);
  } catch (error) {
    console.error("Scan failed:", error);
    res.status(500).json({ error: "Scan failed" });
  }
});

// API: AI Insight
app.post('/api/ai-insight', async (req, res) => {
  try {
    const summary: MarketSummary = req.body;
    if (!summary || !summary.topSetups) {
        res.status(400).json({ error: "Invalid market summary data" });
        return;
    }

    const provider = process.env.AI_PROVIDER || 'ollama';
    let analysis: string;

    if (provider === 'gemini') {
      analysis = await analyzeMarketWithGemini(summary);
    } else {
      analysis = await analyzeMarket(summary);
    }
    
    res.json({ analysis });
  } catch (error) {
    console.error("AI Analysis failed:", error);
    res.status(500).json({ error: "AI Analysis failed" });
  }
});

// Serve Static Files (Production)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for SPA routing
app.get('*', (req, res) => {
    // Check if request is for API, if so, return 404
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API endpoint not found' });
        return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
  console.log(`AI Provider: ${process.env.AI_PROVIDER || 'ollama'}`);
});
