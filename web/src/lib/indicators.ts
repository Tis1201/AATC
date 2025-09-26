/**
 * Technical Indicators Library
 * Contains all technical analysis calculation functions
 */

/**
 * Calculate Simple Moving Average
 * @param values Array of price values
 * @param period Period for SMA calculation
 * @returns Array of SMA values
 */
export function calculateSMA(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    const slice = values.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

/**
 * Calculate Exponential Moving Average
 * @param values Array of price values
 * @param period Period for EMA calculation
 * @returns Array of EMA values
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (!values.length) return [];
  const result: number[] = [];
  const k = 2 / (period + 1);
  let emaPrev = values[0];
  result.push(emaPrev);
  for (let i = 1; i < values.length; i++) {
    const ema = values[i] * k + emaPrev * (1 - k);
    result.push(ema);
    emaPrev = ema;
  }
  return result;
}

/**
 * Calculate Relative Strength Index
 * @param values Array of price values
 * @param period Period for RSI calculation (default: 14)
 * @returns Array of RSI values
 */
export function calculateRSI(values: number[], period = 14): number[] {
  const len = values.length;
  const result = Array(len).fill(NaN);
  if (len <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < len; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param values Array of price values
 * @param shortPeriod Short period EMA (default: 12)
 * @param longPeriod Long period EMA (default: 26)
 * @param signalPeriod Signal line EMA period (default: 9)
 * @returns Object containing MACD line, signal line, and histogram
 */
export function calculateMACD(
  values: number[],
  shortPeriod = 12,
  longPeriod = 26,
  signalPeriod = 9
) {
  const emaShort = calculateEMA(values, shortPeriod);
  const emaLong = calculateEMA(values, longPeriod);

  const macdLine = emaShort.map((v, i) => {
    const long = emaLong[i];
    return typeof v === "number" && typeof long === "number" ? v - long : NaN;
  });

  const validForSignal = macdLine.map((v) => (isNaN(v) ? 0 : v));
  const signalLineRaw = calculateEMA(validForSignal, signalPeriod);
  const signalLine = macdLine.map((v, i) =>
    isNaN(v) ? NaN : signalLineRaw[i]
  );

  const histogram = macdLine.map((v, i) => {
    if (isNaN(v) || isNaN(signalLine[i])) return NaN;
    return v - signalLine[i];
  });

  return { macdLine, signalLine, histogram };
}

/**
 * Calculate Bollinger Bands
 * @param values Array of price values
 * @param period Period for calculation (default: 20)
 * @param multiplier Standard deviation multiplier (default: 2)
 * @returns Object containing upper, lower, and middle bands
 */
export function calculateBollingerBands(
  values: number[],
  period = 20,
  multiplier = 2
) {
  const sma = calculateSMA(values, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1 || isNaN(sma[i])) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }

    const slice = values.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance =
      slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    upper.push(mean + multiplier * stdDev);
    lower.push(mean - multiplier * stdDev);
  }

  return { upper, lower, middle: sma };
}
