import axios from 'axios';
import NodeCache from 'node-cache';
import type { Kline } from '../types.js';

// Fallback to Public API if FAPI is blocked (Geo-restriction workaround)
const FAPI_BASE_URL = 'https://fapi.binance.com/fapi/v1';
const SPOT_API_BASE_URL = 'https://api.binance.com/api/v3';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // TTL 60 seconds

export async function fetchAllUsdtSymbols(): Promise<string[]> {
  const cacheKey = 'usdt_symbols';
  const cached = cache.get<string[]>(cacheKey);
  if (cached) return cached;

  try {
    // Try Futures API first
    const response = await axios.get(`${FAPI_BASE_URL}/exchangeInfo`);
    const symbols = response.data.symbols
      .filter((s: any) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map((s: any) => s.symbol);

    cache.set(cacheKey, symbols, 3600); 
    return symbols;
  } catch (error: any) {
    console.warn("Binance Futures API blocked/failed. Attempting Spot API fallback for symbols...");
    
    // Fallback: Use Spot API and filter for USDT pairs
    // Note: This won't perfectly match perp contracts, but covers major pairs.
    try {
        const spotResponse = await axios.get(`${SPOT_API_BASE_URL}/exchangeInfo`);
        const spotSymbols = spotResponse.data.symbols
            .filter((s: any) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
            .map((s: any) => s.symbol);
        
        cache.set(cacheKey, spotSymbols, 3600);
        return spotSymbols;
    } catch (spotError) {
        console.error("Failed to fetch symbols from Spot API:", spotError);
        return [];
    }
  }
}

export async function fetchKlineData(symbol: string, interval: string, limit = 500): Promise<Kline[] | null> {
  const cacheKey = `kline_${symbol}_${interval}`;
  const cached = cache.get<Kline[]>(cacheKey);
  if (cached) return cached;

  try {
    // Try Futures API first
    const response = await axios.get(`${FAPI_BASE_URL}/klines`, {
      params: { symbol, interval, limit }
    });
    const klines = mapKlines(response.data);
    cache.set(cacheKey, klines);
    return klines;
  } catch (error: any) {
    // console.warn(`Futures kline fetch failed for ${symbol}. Trying Spot API...`);
    
    // Fallback: Try Spot API
    try {
        const response = await axios.get(`${SPOT_API_BASE_URL}/klines`, {
            params: { symbol, interval, limit }
        });
        const klines = mapKlines(response.data);
        cache.set(cacheKey, klines);
        return klines;
    } catch (spotError) {
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
