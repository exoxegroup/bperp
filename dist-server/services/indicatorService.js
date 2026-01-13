function calculateSMA(data, period) {
    const sma = [];
    if (data.length < period)
        return sma;
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
        sma.push(sum / period);
    }
    return sma;
}
function calculateEMA(data, period) {
    const ema = [];
    if (data.length < period)
        return ema;
    let sum = data.slice(0, period).reduce((acc, val) => acc + val, 0);
    ema.push(sum / period);
    const multiplier = 2 / (period + 1);
    for (let i = period; i < data.length; i++) {
        const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
        ema.push(currentEMA);
    }
    return ema;
}
function calculateRSI(data, period = 14) {
    const rsiValues = [];
    if (data.length <= period)
        return rsiValues;
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 1; i <= period; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) {
            avgGain += diff;
        }
        else {
            avgLoss -= diff;
        }
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
function calculateStoch(klineData, kPeriod = 9, dPeriod = 6) {
    const stochValues = [];
    if (klineData.length < kPeriod)
        return stochValues;
    const kLineRawValues = [];
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
        }
        else {
            d = k;
        }
        stochValues.push({ k, d });
    }
    return stochValues;
}
function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const macdValues = [];
    if (closes.length < slowPeriod + signalPeriod)
        return macdValues;
    const emaFast = calculateEMA(closes, fastPeriod);
    const emaSlow = calculateEMA(closes, slowPeriod);
    const alignmentOffset = slowPeriod - fastPeriod;
    const alignedEmaFast = emaFast.slice(alignmentOffset);
    const macdLineSeries = [];
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
export function getTechnicalSignal(klines) {
    if (klines.length < 50)
        return { signal: 'NEUTRAL', values: {} };
    const closes = klines.map(k => k.close);
    const sma10 = calculateSMA(closes, 10).pop();
    const sma20 = calculateSMA(closes, 20).pop();
    const sma50 = calculateSMA(closes, 50).pop();
    const rsi = calculateRSI(closes).pop();
    const stoch = calculateStoch(klines).pop();
    const macd = calculateMACD(closes).pop();
    if (!sma10 || !sma20 || !sma50 || !rsi || !stoch || !macd) {
        return { signal: 'NEUTRAL', values: {} };
    }
    let bullScore = 0;
    let bearScore = 0;
    // SMA Trend
    if (sma10 > sma20)
        bullScore++;
    else
        bearScore++;
    if (sma20 > sma50)
        bullScore++;
    else
        bearScore++;
    if (closes[closes.length - 1] > sma20)
        bullScore++;
    else
        bearScore++;
    // RSI
    if (rsi < 30)
        bullScore += 2; // Oversold -> Buy
    else if (rsi > 70)
        bearScore += 2; // Overbought -> Sell
    else if (rsi > 50)
        bullScore++;
    else
        bearScore++;
    // Stoch
    if (stoch.k < 20 && stoch.d < 20 && stoch.k > stoch.d)
        bullScore += 2; // Golden Cross in oversold
    else if (stoch.k > 80 && stoch.d > 80 && stoch.k < stoch.d)
        bearScore += 2; // Death Cross in overbought
    // MACD
    if (macd.histogram > 0 && macd.macdLine > macd.signalLine)
        bullScore += 2;
    else if (macd.histogram < 0 && macd.macdLine < macd.signalLine)
        bearScore += 2;
    let signal = 'NEUTRAL';
    if (bullScore >= 6)
        signal = 'STRONG_BUY';
    else if (bullScore >= 4)
        signal = 'BUY';
    else if (bearScore >= 6)
        signal = 'STRONG_SELL';
    else if (bearScore >= 4)
        signal = 'SELL';
    return {
        signal,
        values: { sma10, sma20, sma50, rsi, stoch, macd }
    };
}
