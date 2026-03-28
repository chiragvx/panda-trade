
/**
 * Black-Scholes Formula & IV Solver
 * Standard European Option pricing and Greek derivation
 */

/**
 * Standard normal cumulative distribution function
 */
function cdfs(x: number): number {
  const a1 = 0.319381530;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const L = Math.abs(x);
  const K = 1.0 / (1.0 + 0.2316419 * L);
  let d = 1.0 - 1.0 / Math.sqrt(2 * Math.PI) * Math.exp(-L * L / 2.0) * (a1 * K + a2 * K * K + a3 * Math.pow(K, 3) + a4 * Math.pow(K, 4) + a5 * Math.pow(K, 5));
  if (x < 0) d = 1.0 - d;
  return d;
}

/**
 * Normal probability density function
 */
function pdfs(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

/**
 * Black-Scholes Price
 */
export function blackScholes(
  S: number, // Spot Price
  K: number, // Strike Price
  r: number, // Risk-free rate (e.g. 0.05)
  T: number, // Time to expiry (in years)
  v: number, // Volatility (e.g. 0.2)
  type: 'CE' | 'PE'
): number {
  if (T <= 0) return Math.max(0, type === 'CE' ? S - K : K - S);

  const d1 = (Math.log(S / K) + (r + v * v / 2) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);

  if (type === 'CE') {
    return S * cdfs(d1) - K * Math.exp(-r * T) * cdfs(d2);
  } else {
    return K * Math.exp(-r * T) * cdfs(-d2) - S * cdfs(-d1);
  }
}

/**
 * Vega calculation (needed for Newton-Raphson)
 */
export function vega(S: number, K: number, r: number, T: number, v: number): number {
  const d1 = (Math.log(S / K) + (r + v * v / 2) * T) / (v * Math.sqrt(T));
  return S * Math.sqrt(T) * pdfs(d1);
}

/**
 * Implied Volatility Solver (Newton-Raphson)
 */
export function calcIV(
  price: number,
  S: number,
  K: number,
  r: number,
  T: number,
  type: 'CE' | 'PE',
  initialGuess: number = 0.5
): number {
  if (price <= 0) return 0;
  
  // Intrinsic value check
  const intrinsic = Math.max(0, type === 'CE' ? S - K : K - S);
  if (price <= intrinsic) return 0.01; // Floor

  let v = initialGuess;
  const epsilon = 0.0001;
  const maxIter = 100;

  for (let i = 0; i < maxIter; i++) {
    const diff = blackScholes(S, K, r, T, v, type) - price;
    if (Math.abs(diff) < epsilon) return v;
    
    const vga = vega(S, K, r, T, v);
    if (vga < 0.0001) break; // Avoid division by zero/flat slope

    v = v - diff / vga;
    
    // Bounds check
    if (v <= 0) v = 0.0001;
    if (v > 5) v = 5; // Cap at 500%
  }

  return v;
}

/**
 * Historical Volatility Formula
 * Annualized StdDev of log-returns
 */
export function calcHV(closes: number[], window: number = 30): number {
  if (closes.length < window + 1) return 0;

  const logReturns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    logReturns.push(Math.log(closes[i] / closes[i - 1]));
  }

  const subset = logReturns.slice(-window);
  const mean = subset.reduce((a, b) => a + b, 0) / subset.length;
  const variance = subset.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / subset.length;
  const dailyVol = Math.sqrt(variance);

  // Annualize (assuming 252 trading days)
  return dailyVol * Math.sqrt(252);
}
