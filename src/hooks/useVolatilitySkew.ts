import { useState, useEffect } from 'react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { upstoxApi } from '../services/upstoxApi';

export const useVolatilitySkew = (symbolKey?: string) => {
    const { accessToken } = useUpstoxStore();
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expiries, setExpiries] = useState<string[]>([]);
    const [selectedExpiry, setSelectedExpiry] = useState<string>('');

    useEffect(() => {
        if (!symbolKey || !accessToken) return;

        const loadExpiries = async () => {
            try {
                const res = await upstoxApi.getExpiries(accessToken, symbolKey);
                if (res.status === 'success' && Array.isArray(res.data)) {
                    setExpiries(res.data);
                    if (res.data.length > 0) setSelectedExpiry(res.data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch expiries:", err);
            }
        };

        loadExpiries();
    }, [symbolKey, accessToken]);

    useEffect(() => {
        if (!symbolKey || !accessToken || !selectedExpiry) return;

        const loadSkew = async () => {
            setIsLoading(true);
            try {
                const res = await upstoxApi.getOptionChain(accessToken, symbolKey, selectedExpiry);
                if (res.status === 'success' && Array.isArray(res.data)) {
                    const processed = res.data.map((item: any) => ({
                        strike: item.strike_price,
                        callIV: item.call_options?.market_data?.iv || 0,
                        putIV: item.put_options?.market_data?.iv || 0,
                    })).filter((item: any) => item.callIV > 0 || item.putIV > 0)
                      .sort((a: any, b: any) => a.strike - b.strike);
                    
                    setData(processed);
                }
            } catch (err) {
                console.error("Failed to fetch Skew data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSkew();
    }, [symbolKey, accessToken, selectedExpiry]);

    return { 
        data, 
        isLoading, 
        expiries, 
        selectedExpiry, 
        setSelectedExpiry
    };
};
