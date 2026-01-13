import axios from 'axios';
import type { Kline } from '../types';

const FAPI_BASE_URL = 'https://fapi.binance.com/fapi/v1';
const SPOT_API_BASE_URL = 'https://api.binance.com/api/v3';

// Simple in-memory cache to avoid redundant calls during a session
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

export async function fetchAllUsdtSymbols(): Promise<string[]> {
  const cacheKey = 'usdt_symbols';
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL * 60) { // Cache symbols longer
    return cache[cacheKey].data;
  }

  try {
    const response = await axios.get(`${FAPI_BASE_URL}/exchangeInfo`);
    const symbols = response.data.symbols
      .filter((s: any) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map((s: any) => s.symbol);
    
    cache[cacheKey] = { data: symbols, timestamp: Date.now() };
    return symbols;
  } catch (error) {
    console.warn('Futures API failed for symbols, trying Spot...');
    try {
      const response = await axios.get(`${SPOT_API_BASE_URL}/exchangeInfo`);
      const symbols = response.data.symbols
        .filter((s: any) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
        .map((s: any) => s.symbol);
      
      cache[cacheKey] = { data: symbols, timestamp: Date.now() };
      return symbols;
    } catch (e) {
      console.error('All APIs failed to fetch symbols', e);
      return [];
    }
  }
}

export async function fetchKlineData(symbol: string, interval: string, limit = 200): Promise<Kline[] | null> {
    const cacheKey = `kline_${symbol}_${interval}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
        return cache[cacheKey].data;
    }

    try {
        const response = await axios.get(`${FAPI_BASE_URL}/klines`, {
            params: { symbol, interval, limit }
        });
        const data = mapKlines(response.data);
        cache[cacheKey] = { data, timestamp: Date.now() };
        return data;
    } catch (error) {
        // Fallback to Spot
         try {
            const response = await axios.get(`${SPOT_API_BASE_URL}/klines`, {
                params: { symbol, interval, limit }
            });
            const data = mapKlines(response.data);
            cache[cacheKey] = { data, timestamp: Date.now() };
            return data;
        } catch (e) {
            console.warn(`Failed to fetch klines for ${symbol}`);
            return null;
        }
    }
}

function mapKlines(data: any[]): Kline[] {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((k: any) => ({
      time: k[0] / 1000,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));
}
