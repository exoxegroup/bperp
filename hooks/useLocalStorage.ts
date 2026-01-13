import { useState, useEffect } from 'react';
import type { RankedSignal, MarketSummary } from '../types';

interface CachedScan {
  version: number;
  timestamp: number;
  data: {
    signals: RankedSignal[];
    marketSummary: MarketSummary;
    aiAnalysis: string | null;
  };
}

const STORAGE_KEY = 'crypto-analyst-v1';
const CURRENT_VERSION = 1;

export const useLocalStorage = () => {
  const [cachedData, setCachedData] = useState<CachedScan | null>(null);

  // Hydrate on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed: CachedScan = JSON.parse(item);
        if (parsed.version === CURRENT_VERSION) {
          setCachedData(parsed);
        } else {
          // Version mismatch handling (e.g., clear old data)
          console.warn('Storage version mismatch, clearing cache.');
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
    }
  }, []);

  const saveToStorage = (
    signals: RankedSignal[], 
    marketSummary: MarketSummary, 
    aiAnalysis: string | null
  ) => {
    try {
      const payload: CachedScan = {
        version: CURRENT_VERSION,
        timestamp: Date.now(),
        data: { signals, marketSummary, aiAnalysis }
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setCachedData(payload);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  return { cachedData, saveToStorage };
};
