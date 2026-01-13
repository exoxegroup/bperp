import axios from 'axios';
import NodeCache from 'node-cache';
import type { Kline } from '../types.js';

const API_BASE_URL = 'https://fapi.binance.com/fapi/v1';
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // TTL 60 seconds

// Binance FAPI Weight Limits:
// /exchangeInfo: 1
// /klines: 1
// Default limit: 2400 per minute
// We can safely do ~40 requests per second.

export async function fetchAllUsdtSymbols(): Promise<string[]> {
  const cacheKey = 'usdt_symbols';
  const cached = cache.get<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${API_BASE_URL}/exchangeInfo`);
    const symbols = response.data.symbols
      .filter((s: any) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map((s: any) => s.symbol);

    cache.set(cacheKey, symbols, 3600); // Cache symbols for 1 hour
    return symbols;
  } catch (error: any) {
    console.error("Failed to fetch symbols from Binance:", error.message);
    if (error.code) console.error("Error Code:", error.code);
    if (error.response) console.error("Response Status:", error.response.status);
    return [];
  }
}

export async function fetchKlineData(symbol: string, interval: string, limit = 500): Promise<Kline[] | null> {
  const cacheKey = `kline_${symbol}_${interval}`;
  const cached = cache.get<Kline[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${API_BASE_URL}/klines`, {
      params: { symbol, interval, limit }
    });

    const data = response.data;
    if (!Array.isArray(data) || data.length === 0) return null;

    const klines: Kline[] = data.map((k: any) => ({
      time: k[0] / 1000,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));

    cache.set(cacheKey, klines); // Cache for 60s
    return klines;
  } catch (error) {
    // console.warn(`Failed to fetch kline for ${symbol} ${interval}:`, error);
    return null;
  }
}
