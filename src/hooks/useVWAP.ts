import { useState, useEffect } from 'react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSelectionStore } from '../store/useStore';
import { upstoxApi } from '../services/upstoxApi';
import { NIFTY_50 } from '../utils/defaultSymbol';

export const useVWAP = (overrideSymbol?: any) => {
    const { selectedSymbol: globalSymbol } = useSelectionStore();
    const selectedSymbol = overrideSymbol || globalSymbol || NIFTY_50;
    const { accessToken } = useUpstoxStore();
    const [vwap, setVwap] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!selectedSymbol || !accessToken) {
            setVwap(null);
            return;
        }

        const loadIntraday = async () => {
            setIsLoading(true);
            try {
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                
                // Fetch intraday 1-minute candles for today
                if (!selectedSymbol?.instrument_key) return;
                const res = await upstoxApi.getHistoricalData(accessToken, selectedSymbol.instrument_key, '1minute', today, today);
                
                if (res.status === 'success' && Array.isArray(res.data?.candles)) {
                    let totalPV = 0;
                    let totalVolume = 0;
                    
                    // Upstox returns [timestamp, open, high, low, close, volume]
                    res.data.candles.forEach((candle: any) => {
                        const price = (candle[1] + candle[2] + candle[3] + candle[4]) / 4; // Typical price
                        const vol = candle[5];
                        totalPV += price * vol;
                        totalVolume += vol;
                    });
                    
                    if (totalVolume > 0) {
                        setVwap(totalPV / totalVolume);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch VWAP data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadIntraday();
        const interval = setInterval(loadIntraday, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [selectedSymbol, accessToken]);

    return { vwap, isLoading, symbol: selectedSymbol?.ticker };
};
