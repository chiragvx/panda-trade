import { useState, useEffect } from 'react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSelectionStore } from '../store/useStore';
import { upstoxApi } from '../services/upstoxApi';
import { calculateRSI, calculateSMA, calculateEMA } from '../utils/ta';

export const useTechnicals = (overrideSymbol?: any) => {
    const { selectedSymbol: globalSymbol } = useSelectionStore();
    const selectedSymbol = overrideSymbol || globalSymbol;
    const { accessToken } = useUpstoxStore();
    const [indicators, setIndicators] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!selectedSymbol || !accessToken) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const now = new Date();
                const past = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);
                const toDate = now.toISOString().split('T')[0];
                const fromDate = past.toISOString().split('T')[0];

                if (!selectedSymbol?.instrument_key) return;
                const res = await upstoxApi.getHistoricalData(accessToken, selectedSymbol.instrument_key, 'day', fromDate, toDate);
                if (res.status === 'success' && res.data?.candles) {
                    const closes = res.data.candles.map((c: any) => c[4]).reverse();
                    
                    setIndicators({
                        rsi: calculateRSI(closes),
                        sma20: calculateSMA(closes, 20),
                        ema50: calculateEMA(closes, 50),
                        ema200: calculateEMA(closes, closes.length > 200 ? 200 : closes.length),
                        lastPrice: closes[closes.length - 1]
                    });
                }
            } catch (err) {
                console.error("Failed to fetch technical data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [selectedSymbol, accessToken]);

    return { indicators, isLoading, symbol: selectedSymbol?.ticker };
};
