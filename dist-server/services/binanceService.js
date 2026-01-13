import axios from 'axios';
import NodeCache from 'node-cache';
const API_BASE_URL = 'https://fapi.binance.com/fapi/v1';
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // TTL 60 seconds
// Binance FAPI Weight Limits:
// /exchangeInfo: 1
// /klines: 1
// Default limit: 2400 per minute
// We can safely do ~40 requests per second.
export async function fetchAllUsdtSymbols() {
    const cacheKey = 'usdt_symbols';
    const cached = cache.get(cacheKey);
    if (cached)
        return cached;
    try {
        const response = await axios.get(`${API_BASE_URL}/exchangeInfo`);
        const symbols = response.data.symbols
            .filter((s) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT' && s.status === 'TRADING')
            .map((s) => s.symbol);
        cache.set(cacheKey, symbols, 3600); // Cache symbols for 1 hour
        return symbols;
    }
    catch (error) {
        console.error("Failed to fetch symbols:", error);
        return [];
    }
}
export async function fetchKlineData(symbol, interval, limit = 500) {
    const cacheKey = `kline_${symbol}_${interval}`;
    const cached = cache.get(cacheKey);
    if (cached)
        return cached;
    try {
        const response = await axios.get(`${API_BASE_URL}/klines`, {
            params: { symbol, interval, limit }
        });
        const data = response.data;
        if (!Array.isArray(data) || data.length === 0)
            return null;
        const klines = data.map((k) => ({
            time: k[0] / 1000,
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
        }));
        cache.set(cacheKey, klines); // Cache for 60s
        return klines;
    }
    catch (error) {
        // console.warn(`Failed to fetch kline for ${symbol} ${interval}:`, error);
        return null;
    }
}
