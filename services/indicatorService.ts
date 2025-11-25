import { Kline, IndicatorValues, SignalType } from '../types';

function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  if (data.length < period) return sma;
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
    sma.push(sum / period);
  }
  return sma;
}

function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  if (data.length < period) return ema;
  let sum = data.slice(0, period).reduce((acc, val) => acc + val, 0);
  ema.push(sum / period);
  const multiplier = 2 / (period + 1);
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }
  return ema;
}

function calculateRSI(data: number[], period = 14): number[] {
  const rsiValues: number[] = [];
  if (data.length <= period) return rsiValues;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) { avgGain += diff; } else { avgLoss -= diff; }
  }
  avgGain /= period;
  avgLoss /= period;
  let rs = (avgLoss === 0) ? 100 : avgGain / avgLoss;
  rsiValues.push(100 - (100 / (1 + rs)));
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    let gain = diff >= 0 ? diff : 0;
    let loss = diff < 0 ? -diff : 0;
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    rs = (avgLoss === 0) ? 100 : avgGain / avgLoss;
    rsiValues.push(100 - (100 / (1 + rs)));
  }
  return rsiValues;
}

function calculateStoch(klineData: Kline[], kPeriod = 9, dPeriod = 6): { k: number; d: number }[] {
  const stochValues: { k: number; d: number }[] = [];
  if (klineData.length < kPeriod) return stochValues;
  const kLineRawValues: number[] = [];
  for (let i = kPeriod - 1; i < klineData.length; i++) {
    const slice = klineData.slice(i - kPeriod + 1, i + 1);
    const highPrices = slice.map(k => k.high);
    const lowPrices = slice.map(k => k.low);
    const currentClose = slice[slice.length - 1].close;
    const highestHigh = Math.max(...highPrices);
    const lowestLow = Math.min(...lowPrices);
    let k = 0;
    if ((highestHigh - lowestLow) !== 0) {
      k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    }
    kLineRawValues.push(k);
    let d = 0;
    if (kLineRawValues.length >= dPeriod) {
      d = kLineRawValues.slice(-dPeriod).reduce((sum, val) => sum + val, 0) / dPeriod;
    } else {
      d = k;
    }
    stochValues.push({ k, d });
  }
  return stochValues;
}

function calculateMACD(closes: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const macdValues: { macdLine: number; signalLine: number; histogram: number }[] = [];
  if (closes.length < slowPeriod + signalPeriod) return macdValues;

  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);

  const alignmentOffset = slowPeriod - fastPeriod;
  const alignedEmaFast = emaFast.slice(alignmentOffset);

  const macdLineSeries: number[] = [];
  for (let i = 0; i < emaSlow.length; i++) {
    macdLineSeries.push(alignedEmaFast[i] - emaSlow[i]);
  }
  
  const signalLineSeries = calculateEMA(macdLineSeries, signalPeriod);
  const macdLineForFinal = macdLineSeries.slice(signalPeriod - 1);

  for (let i = 0; i < signalLineSeries.length; i++) {
    const macdLine = macdLineForFinal[i];
    const signalLine = signalLineSeries[i];
    macdValues.push({
      macdLine: macdLine,
      signalLine: signalLine,
      histogram: macdLine - signalLine
    });
  }
  return macdValues;
}

export function calculateAllIndicatorSeries(klineData: Kline[]): IndicatorValues {
  const closes = klineData.map(k => k.close);
  const sma10 = calculateSMA(closes, 10);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const stoch = calculateStoch(klineData, 9, 6);
  const macd = calculateMACD(closes, 12, 26, 9);

  const latest = <T>(arr: T[]) => arr.length > 0 ? arr[arr.length - 1] : undefined;
  
  return {
    sma10: latest(sma10),
    sma20: latest(sma20),
    sma50: latest(sma50),
    rsi: latest(rsi),
    stoch: latest(stoch),
    macd: latest(macd),
  };
}

export function calculateHistoryForSignal(klineData: Kline[]) {
    const closes = klineData.map(k => k.close);
    const macd = calculateMACD(closes, 12, 26, 9);
    return {
        macd
    };
}

export function getTechnicalSignal(klineData: Kline[]): SignalType {
  if (!klineData || klineData.length < 50) {
    return 'NEUTRAL';
  }

  const closes = klineData.map(k => k.close);
  const latestClose = closes[closes.length - 1];
  const indicators = calculateAllIndicatorSeries(klineData);
  const history = calculateHistoryForSignal(klineData);

  let score = 0;

  // SMA
  if (indicators.sma10 !== undefined && latestClose > indicators.sma10) score += 1; 
  else if (indicators.sma10 !== undefined && latestClose < indicators.sma10) score -= 1;
  
  if (indicators.sma20 !== undefined && latestClose > indicators.sma20) score += 1; 
  else if (indicators.sma20 !== undefined && latestClose < indicators.sma20) score -= 1;
  
  if (indicators.sma50 !== undefined && latestClose > indicators.sma50) score += 1.5; 
  else if (indicators.sma50 !== undefined && latestClose < indicators.sma50) score -= 1.5;

  // RSI
  if (indicators.rsi !== undefined) {
    if (indicators.rsi < 30) score += 2; else if (indicators.rsi < 40) score += 1;
    if (indicators.rsi > 70) score -= 2; else if (indicators.rsi > 60) score -= 1;
  }

  // STOCH
  if (indicators.stoch) {
    if (indicators.stoch.k < 20 && indicators.stoch.k > indicators.stoch.d) score += 2;
    else if (indicators.stoch.k > 80 && indicators.stoch.k < indicators.stoch.d) score -= 2;
    else if (indicators.stoch.k > indicators.stoch.d) score += 1;
    else if (indicators.stoch.k < indicators.stoch.d) score -= 1;
  }

  // MACD
  // Need current and prev
  const macdCurrent = indicators.macd;
  const macdPrev = history.macd.length > 1 ? history.macd[history.macd.length - 2] : undefined;

  if (macdCurrent && macdPrev) {
    if (macdCurrent.macdLine > macdCurrent.signalLine && macdPrev.macdLine <= macdPrev.signalLine) score += 3;
    else if (macdCurrent.macdLine < macdCurrent.signalLine && macdPrev.macdLine >= macdPrev.signalLine) score -= 3;
    else if (macdCurrent.histogram > 0 && macdCurrent.histogram > macdPrev.histogram) score += 1;
    else if (macdCurrent.histogram < 0 && macdCurrent.histogram < macdPrev.histogram) score -= 1;
  }

  if (score >= 8) return 'STRONG_BUY';
  if (score >= 3) return 'BUY';
  if (score <= -8) return 'STRONG_SELL';
  if (score <= -3) return 'SELL';
  return 'NEUTRAL';
}