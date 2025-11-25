export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type SignalType = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface IndicatorValues {
  sma10?: number;
  sma20?: number;
  sma50?: number;
  rsi?: number;
  stoch?: { k: number; d: number };
  macd?: { macdLine: number; signalLine: number; histogram: number };
}

export interface SignalData {
  [timeframe: string]: {
    signal: SignalType;
  };
}

export interface RankedSignal {
  symbol: string;
  ltf: string; // Lower Time Frame direction
  htf: string; // Higher Time Frame direction
  signal: string; // Combined Signal
  rank: 'A+' | 'A' | 'B+';
}

export interface MarketSummary {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  topSetups: RankedSignal[];
}