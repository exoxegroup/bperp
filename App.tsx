import React, { useState, useEffect, useCallback } from 'react';
import { RankedSignal, MarketSummary } from './types';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { MarketStatusHeader } from './components/features/MarketStatusHeader';
import { SignalGrid } from './components/features/SignalGrid';
import { useLocalStorage } from './hooks/useLocalStorage';

const API_BASE_URL = 'http://localhost:3000/api';

const App: React.FC = () => {
  const { cachedData, saveToStorage } = useLocalStorage();
  const [rankedSignals, setRankedSignals] = useState<RankedSignal[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 100, symbol: '' });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);

  // Hydrate from local storage
  useEffect(() => {
    if (cachedData) {
      setRankedSignals(cachedData.data.signals);
      setMarketSummary(cachedData.data.marketSummary);
      setAiAnalysis(cachedData.data.aiAnalysis);
      setLastUpdated(new Date(cachedData.timestamp));
    }
  }, [cachedData]);

  const runScanner = useCallback(async () => {
    setScanning(true);
    setProgress({ current: 10, total: 100, symbol: 'Connecting...' });

    try {
      const response = await fetch(`${API_BASE_URL}/scan`);
      if (!response.ok) throw new Error('Scan failed');
      
      const data = await response.json();
      const newRankedSignals: RankedSignal[] = data.results || [];
      const newMarketSummary: MarketSummary = data.marketSummary || {
          bullishCount: 0, bearishCount: 0, neutralCount: 0, topSetups: []
      };

      // Sort: A+ first, then A, then B+
      const rankOrder = { 'A+': 1, 'A': 2, 'B+': 3 };
      newRankedSignals.sort((a: any, b: any) => {
          if (rankOrder[a.rank] !== rankOrder[b.rank]) {
              return rankOrder[a.rank] - rankOrder[b.rank];
          }
          return a.symbol.localeCompare(b.symbol);
      });

      setRankedSignals(newRankedSignals);
      setMarketSummary(newMarketSummary);
      setLastUpdated(new Date());

      // Fetch AI Analysis immediately after scan
      if (newRankedSignals.length > 0) {
        setProgress({ current: 90, total: 100, symbol: 'Analyzing...' });
        try {
            const aiResponse = await fetch(`${API_BASE_URL}/ai-insight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMarketSummary)
            });
            const aiData = await aiResponse.json();
            const analysis = aiData.analysis || "Analysis unavailable.";
            setAiAnalysis(analysis);
            
            // Save everything to storage
            saveToStorage(newRankedSignals, newMarketSummary, analysis);
        } catch (e) {
            console.error("AI Analysis failed", e);
            setAiAnalysis("AI Analysis failed to connect.");
            saveToStorage(newRankedSignals, newMarketSummary, null);
        }
      } else {
        saveToStorage(newRankedSignals, newMarketSummary, null);
      }

    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setScanning(false);
      setProgress({ current: 100, total: 100, symbol: 'Complete' });
    }
  }, [saveToStorage]);

  return (
    <DashboardLayout 
      lastUpdated={lastUpdated} 
      onScan={runScanner} 
      isScanning={scanning}
      scanProgress={progress}
    >
      <MarketStatusHeader 
        aiAnalysis={aiAnalysis} 
        isLoading={scanning && !aiAnalysis} 
        marketSummary={marketSummary} 
      />
      
      <div className="mb-6 flex items-center gap-3">
        <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
        <h2 className="text-2xl font-bold text-white">Live Signals</h2>
        <span className="text-sm text-gray-400 bg-slate-800 px-3 py-1 rounded-full">
          {rankedSignals.length} Active Setups
        </span>
      </div>

      <SignalGrid signals={rankedSignals} />
    </DashboardLayout>
  );
};

export default App;