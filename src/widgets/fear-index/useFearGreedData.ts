import { useState, useEffect, useMemo } from 'react';
import { useUpstoxStore } from '../../store/useUpstoxStore';
import { upstoxApi } from '../../services/upstoxApi';

export interface FearGreedData {
  score: number;
  components: {
    volatility: number;      // India VIX relative state
    marketMomentum: number;  // Price vs 50-SMA
    riskAppetite: number;    // Midcap vs Largecap
    optionsSentiment: number; // Put/Call Ratio
    safeHaven: number;       // Gold vs Equity momentum
  };
  loading: boolean;
  error: string | null;
}

const NIFTY_50 = 'NSE_INDEX|Nifty 50';
const RISK_INDEX = 'NSE_INDEX|Nifty Bank'; // Use Bank Nifty for risk ratio as it is better supported than Midcap 150 for historical
const VIX = 'NSE_INDEX|India VIX';
const GOLD = 'NSE_EQ|GOLDBEES';

export const useFearGreedData = () => {
  const { accessToken, prices } = useUpstoxStore();
  const [data, setData] = useState<FearGreedData>({
    score: 50,
    components: {
      volatility: 50,
      marketMomentum: 50,
      riskAppetite: 50,
      optionsSentiment: 50,
      safeHaven: 50
    },
    loading: true,
    error: null
  });

  const normalise = (val: number, min: number, max: number, inverse = false) => {
    if (val === undefined || isNaN(val)) return 50;
    const raw = ((val - min) / (max - min)) * 100;
    const clamped = Math.max(0, Math.min(100, raw));
    return inverse ? 100 - clamped : clamped;
  };

  useEffect(() => {
    if (!accessToken) return;

    const fetchData = async () => {
      try {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const sub = (dayOfWeek === 0) ? 2 : (dayOfWeek === 6) ? 1 : 0;
        const refDate = new Date(now.getTime() - sub * 24 * 60 * 60 * 1000);
        
        const today = refDate.toISOString().split('T')[0];
        const past30d = new Date(refDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const results = await Promise.allSettled([
          upstoxApi.getHistoricalData(accessToken, NIFTY_50, 'day', past30d, today),
          upstoxApi.getHistoricalData(accessToken, RISK_INDEX, 'day', past30d, today),
          upstoxApi.getHistoricalData(accessToken, GOLD, 'day', past30d, today)
        ]);

        const niC = results[0].status === 'fulfilled' ? results[0].value?.data?.candles || [] : [];
        const riC = results[1].status === 'fulfilled' ? results[1].value?.data?.candles || [] : [];
        const goC = results[2].status === 'fulfilled' ? results[2].value?.data?.candles || [] : [];

        // 2. Market Momentum: Nifty LTP vs SMA
        let momentumScore = 50;
        if (niC.length >= 20) {
            const currentPrice = niC[0][4];
            const lookback = Math.min(20, niC.length);
            const sma = niC.slice(0, lookback).reduce((acc: number, c: any) => acc + c[4], 0) / lookback;
            momentumScore = normalise(((currentPrice - sma) / sma) * 100, -5, 5);
        }

        // 3. Risk Appetite: Bank Nifty 15D Return vs Nifty 50 15D Return
        let riskScore = 50;
        if (riC.length >= 15 && niC.length >= 15) {
            const mRet = ((riC[0][4] - riC[14][4]) / riC[14][4]) * 100;
            const nRet = ((niC[0][4] - niC[14][4]) / niC[14][4]) * 100;
            riskScore = normalise(mRet - nRet, -3, 3);
        }

        // 4. Safe Haven: Gold 15D Return vs Nifty 50 15D Return (Inverse)
        let goldScore = 50;
        if (goC.length >= 15 && niC.length >= 15) {
            const gRet = ((goC[0][4] - goC[14][4]) / goC[14][4]) * 100;
            const nRet = ((niC[0][4] - niC[14][4]) / niC[14][4]) * 100;
            goldScore = normalise(gRet - nRet, -2, 2, true);
        }

        // 5. Volatility: India VIX
        const currentVix = Number(prices[VIX]?.ltp || 15);
        const vixScore = normalise(currentVix, 10, 25, true);

        // 6. Options Sentiment: PCR
        let pcrScore = 50;
        try {
            const expData = await upstoxApi.getExpiries(accessToken, NIFTY_50);
            if (expData?.data?.[0]) {
                const chain = await upstoxApi.getOptionChain(accessToken, NIFTY_50, expData.data[0]);
                if (chain?.data) {
                    let putOI = 0; let callOI = 0;
                    chain.data.forEach((strike: any) => {
                        putOI += strike.put_options?.oi || 0;
                        callOI += strike.call_options?.oi || 0;
                    });
                    pcrScore = normalise(putOI / (callOI || 1), 0.7, 1.4);
                }
            }
        } catch (e) {
            console.warn('PCR fetch failed', e);
        }

        const validScores: number[] = [vixScore, pcrScore];
        if (niC.length > 0) validScores.push(momentumScore);
        if (riC.length > 0) validScores.push(riskScore);
        if (goC.length > 0) validScores.push(goldScore);

        const compositeScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;

        setData({
          score: Math.round(compositeScore),
          components: {
            volatility: Math.round(vixScore),
            marketMomentum: Math.round(momentumScore),
            riskAppetite: Math.round(riskScore),
            optionsSentiment: Math.round(pcrScore),
            safeHaven: Math.round(goldScore)
          },
          loading: false,
          error: null
        });

      } catch (err: any) {
        console.error('Fear & Greed calculation error:', err);
        setData(prev => ({ ...prev, loading: false, error: err.message }));
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 min refresh
    return () => clearInterval(interval);
  }, [accessToken, prices[VIX]?.ltp]);

  return data;
};
