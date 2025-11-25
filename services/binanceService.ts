import { Kline } from '../types';

const API_BASE_URL = 'https://fapi.binance.com/fapi/v1';

export async function fetchAllUsdtSymbols(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/exchangeInfo`);
    const data = await response.json();
    
    const symbols = data.symbols
      .filter((s: any) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map((s: any) => s.symbol);
      
    // Return top 20 for performance in this demo env, 
    // or user can implement a robust queue system for all symbols.
    // For now, let's pick a diverse set of popular ones to ensure rate limits aren't hit immediately.
    const priorityList = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'TRXUSDT', 'DOTUSDT'];
    return priorityList; 
  } catch (error) {
    console.error("Failed to fetch symbols:", error);
    return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  }
}

export async function fetchKlineData(symbol: string, interval: string, limit = 500): Promise<Kline[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!response.ok) throw new Error(`Network response was not ok for ${symbol} ${interval}`);
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
    
    return data.map((k: any) => ({
      time: k[0] / 1000,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "Unknown error fetching kline");
    return null;
  }
}