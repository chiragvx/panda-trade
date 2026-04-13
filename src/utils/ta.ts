export interface IndicatorResult {
    time: number;
    value: number;
    color?: string;
}

/**
 * Calculates Simple Moving Average Series
 */
export const calculateSMASeries = (data: { time: number, close: number }[], period: number): IndicatorResult[] => {
    if (data.length < period) return [];
    
    const results: IndicatorResult[] = [];
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
        results.push({
            time: data[i].time,
            value: sum / period
        });
    }
    return results;
};

/**
 * Calculates Exponential Moving Average Series
 */
export const calculateEMASeries = (data: { time: number, close: number }[], period: number): IndicatorResult[] => {
    if (data.length < period) return [];
    
    const results: IndicatorResult[] = [];
    const k = 2 / (period + 1);
    
    // Initial SMA for first entry
    let ema = data.slice(0, period).reduce((acc, curr) => acc + curr.close, 0) / period;
    results.push({ time: data[period - 1].time, value: ema });
    
    for (let i = period; i < data.length; i++) {
        ema = data[i].close * k + ema * (1 - k);
        results.push({ time: data[i].time, value: ema });
    }
    return results;
};

/**
 * Calculates Relative Strength Index (RSI) Series
 */
export const calculateRSISeries = (data: { time: number, close: number }[], period: number = 14): IndicatorResult[] => {
    if (data.length <= period) return [];
    
    const results: IndicatorResult[] = [];
    let gains = 0;
    let losses = 0;

    // Initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const diff = data[i].close - data[i - 1].close;
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    const firstRS = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
    results.push({ time: data[period].time, value: firstRS });

    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i].close - data[i - 1].close;
        if (diff >= 0) {
            avgGain = (avgGain * (period - 1) + diff) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - diff) / period;
        }
        
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        results.push({ time: data[i].time, value: 100 - (100 / (1 + rs)) });
    }
    
    return results;
};

/**
 * Calculates a single SMA value (usually the most recent)
 */
export const calculateSMA = (data: number[], period: number): number => {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return sum / period;
};

/**
 * Calculates a single EMA value
 */
export const calculateEMA = (data: number[], period: number): number => {
    if (data.length < period) return 0;
    const k = 2 / (period + 1);
    
    // Initial SMA for first entry
    let ema = data.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
    
    for (let i = period; i < data.length; i++) {
        ema = (data[i] * k) + (ema * (1 - k));
    }
    return ema;
};

/**
 * Calculates a single RSI value
 */
export const calculateRSI = (data: number[], period: number = 14): number => {
    if (data.length <= period) return 0;
    
    let gains = 0;
    let losses = 0;

    // Initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) {
            avgGain = (avgGain * (period - 1) + diff) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - diff) / period;
        }
    }
    
    return avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
};

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 */
export const calculateMACDSeries = (data: { time: number, close: number }[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    if (data.length < slowPeriod) return { macd: [], signal: [], histogram: [] };

    const fastEMA = calculateEMASeries(data, fastPeriod);
    const slowEMA = calculateEMASeries(data, slowPeriod);
    
    // Only where we have both
    const macdLine: IndicatorResult[] = [];
    const startIndex = slowPeriod - 1;
    
    for (let i = 0; i < slowEMA.length; i++) {
        const f = fastEMA.find(x => x.time === slowEMA[i].time);
        if (f) {
            macdLine.push({ time: slowEMA[i].time, value: f.value - slowEMA[i].value });
        }
    }

    if (macdLine.length < signalPeriod) return { macd: macdLine, signal: [], histogram: [] };

    // Signal Line (EMA of MACD Line)
    // We need to convert macdLine to { time, close } format for calculateEMASeries
    const macdLineAsData = macdLine.map(m => ({ time: m.time, close: m.value }));
    const signalLine = calculateEMASeries(macdLineAsData, signalPeriod);

    // Histogram
    const histogram: any[] = [];
    signalLine.forEach((s, i) => {
        const m = macdLine.find(x => x.time === s.time);
        if (m) {
            const val = m.value - s.value;
            const prevVal = i > 0 ? (histogram[i-1]?.value || 0) : 0;
            const color = val >= 0 
                ? (val > prevVal ? '#26a69a' : '#b2dfdb') // Rising green vs falling green
                : (val < prevVal ? '#ef5350' : '#ffcdd2'); // Falling red vs rising red
            histogram.push({ time: s.time, value: val, color });
        }
    });

    return { macd: macdLine, signal: signalLine, histogram };
};

/**
 * Calculates Bollinger Bands
 */
export const calculateBollingerBandsSeries = (data: { time: number, close: number }[], period = 20, multiplier = 2) => {
    if (data.length < period) return { upper: [], middle: [], lower: [] };

    const middle = calculateSMASeries(data, period);
    const upper: IndicatorResult[] = [];
    const lower: IndicatorResult[] = [];

    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = middle.find(m => m.time === data[i].time)?.value || 0;
        const variance = slice.reduce((acc, curr) => acc + Math.pow(curr.close - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);

        upper.push({ time: data[i].time, value: mean + (multiplier * stdDev) });
        lower.push({ time: data[i].time, value: mean - (multiplier * stdDev) });
    }

    return { upper, middle, lower };
};

/**
 * Calculates VWAP (Volume Weighted Average Price)
 * Resets on new day (if timestamps allow detection)
 */
export const calculateVWAPSeries = (data: { time: number, close: number, volume: number }[]) => {
    if (data.length === 0) return [];
    
    const results: IndicatorResult[] = [];
    let cumulativePV = 0;
    let cumulativeVol = 0;
    let lastDate = '';

    for (let i = 0; i < data.length; i++) {
        const currentDate = new Date(data[i].time * 1000).toDateString();
        
        // Reset VWAP on new trading day
        if (currentDate !== lastDate) {
            cumulativePV = 0;
            cumulativeVol = 0;
            lastDate = currentDate;
        }

        const typicalPrice = data[i].close; 
        cumulativePV += typicalPrice * data[i].volume;
        cumulativeVol += data[i].volume;

        results.push({
            time: data[i].time,
            value: cumulativeVol === 0 ? typicalPrice : cumulativePV / cumulativeVol
        });
    }
    return results;
};

/**
 * Calculates Stochastic Oscillator
 */
export const calculateStochasticSeries = (data: { time: number, high: number, low: number, close: number }[], kPeriod = 14, dPeriod = 3) => {
    if (data.length < kPeriod) return { k: [], d: [] };

    const kLine: IndicatorResult[] = [];
    for (let i = kPeriod - 1; i < data.length; i++) {
        const slice = data.slice(i - kPeriod + 1, i + 1);
        const highestHigh = Math.max(...slice.map(s => s.high));
        const lowestLow = Math.min(...slice.map(s => s.low));
        
        const k = ((data[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
        kLine.push({ time: data[i].time, value: isNaN(k) ? 50 : k });
    }

    if (kLine.length < dPeriod) return { k: kLine, d: [] };

    const kLineAsData = kLine.map(m => ({ time: m.time, close: m.value }));
    const dLine = calculateSMASeries(kLineAsData, dPeriod);

    return { k: kLine, d: dLine };
};

/**
 * Calculates Average True Range (ATR)
 */
export const calculateATRSeries = (data: { time: number, high: number, low: number, close: number }[], period = 14) => {
    if (data.length < period + 1) return [];

    const trueRanges: number[] = [];
    for (let i = 1; i < data.length; i++) {
        const tr = Math.max(
            data[i].high - data[i].low,
            Math.abs(data[i].high - data[i - 1].close),
            Math.abs(data[i].low - data[i - 1].close)
        );
        trueRanges.push(tr);
    }

    const results: IndicatorResult[] = [];
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    results.push({ time: data[period].time, value: atr });

    for (let i = period; i < trueRanges.length; i++) {
        atr = (atr * (period - 1) + trueRanges[i]) / period;
        results.push({ time: data[i + 1].time, value: atr });
    }

    return results;
};
