import { useState, useEffect, useMemo } from 'react';
import { useUpstoxStore } from '../store/useUpstoxStore';
import { useSelectionStore } from '../store/useStore';
import { upstoxApi } from '../services/upstoxApi';

export const useOIGraphData = (overrideSymbol?: { instrument_key: string, ticker: string }) => {
    const { selectedSymbol: globalSelectedSymbol } = useSelectionStore();
    const selectedSymbol = overrideSymbol || globalSelectedSymbol;
    const { accessToken } = useUpstoxStore();
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expiries, setExpiries] = useState<string[]>([]);
    const [selectedExpiry, setSelectedExpiry] = useState<string>('');

    useEffect(() => {
        if (!selectedSymbol || !accessToken) return;

        const loadExpiries = async () => {
            if (!selectedSymbol?.instrument_key) return;
            try {
                const res = await upstoxApi.getExpiries(accessToken, selectedSymbol.instrument_key);
                if (res.status === 'success' && Array.isArray(res.data)) {
                    setExpiries(res.data);
                    if (res.data.length > 0) setSelectedExpiry(res.data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch expiries:", err);
            }
        };

        loadExpiries();
    }, [selectedSymbol, accessToken]);

    useEffect(() => {
        if (!selectedSymbol || !accessToken || !selectedExpiry) return;

        const loadOI = async () => {
            if (!selectedSymbol?.instrument_key) return;
            setIsLoading(true);
            try {
                const res = await upstoxApi.getOptionChain(accessToken, selectedSymbol.instrument_key, selectedExpiry);
                if (res.status === 'success' && Array.isArray(res.data)) {
                    const processed = res.data.map((item: any) => ({
                        strike: item.strike_price,
                        callOI: item.call_options?.market_data?.oi || 0,
                        putOI: item.put_options?.market_data?.oi || 0,
                        pcr: item.put_options?.market_data?.oi / (item.call_options?.market_data?.oi || 1)
                    })).sort((a: any, b: any) => a.strike - b.strike);
                    
                    setData(processed);
                }
            } catch (err) {
                console.error("Failed to fetch OI data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadOI();
        const interval = setInterval(loadOI, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [selectedSymbol, accessToken, selectedExpiry]);

    const stats = useMemo(() => {
        if (data.length === 0) return null;
        const totalCallOI = data.reduce((acc, curr) => acc + curr.callOI, 0);
        const totalPutOI = data.reduce((acc, curr) => acc + curr.putOI, 0);
        return {
            totalCallOI,
            totalPutOI,
            pcr: totalPutOI / (totalCallOI || 1)
        };
    }, [data]);

    return { 
        data, 
        isLoading, 
        expiries, 
        selectedExpiry, 
        setSelectedExpiry, 
        stats,
        symbol: selectedSymbol?.ticker
    };
};
