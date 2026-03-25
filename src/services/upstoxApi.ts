import axios from 'axios';
import { useUpstoxStore } from '../store/useUpstoxStore';

const BASE_URL = 'https://api.upstox.com/v2';
const V3_URL = 'https://api.upstox.com/v3';

export const upstoxApi = {
    exchangeCodeForToken: async (code: string, apiKey: string, apiSecret: string, redirectUri: string) => {
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', apiKey);
        params.append('client_secret', apiSecret);
        params.append('redirect_uri', redirectUri);
        params.append('grant_type', 'authorization_code');

        const response = await axios.post(`${BASE_URL}/login/authorization/token`, params, {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    },

    getFunds: async (token: string) => {
        const response = await axios.get(`${BASE_URL}/user/get-funds-and-margin`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    },

    getOrders: async (token: string) => {
        const response = await axios.get(`${BASE_URL}/order/retrieve-all`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    },

    getHoldings: async (token: string) => {
        const response = await axios.get(`${BASE_URL}/portfolio/long-term-holdings`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    },

    getPositions: async (token: string) => {
        const response = await axios.get(`${BASE_URL}/portfolio/short-term-positions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    },

    placeOrder: async (token: string, orderData: any) => {
        const response = await axios.post(`${V3_URL}/order/place`, orderData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },

    getMarketDataFeedUrl: async (token: string) => {
        const response = await axios.get(`${V3_URL}/feed/market-data-feed/authorize`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    },

    getHistoricalData: async (token: string, instrumentKey: string, interval: string, fromDate: string, toDate: string) => {
        const response = await axios.get(`${BASE_URL}/historical-candle/${instrumentKey}/${interval}/${toDate}/${fromDate}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    },

    searchInstruments: async (token: string, symbol: string) => {
        const response = await axios.get(`${BASE_URL}/instrument/search?symbol=${symbol}&exchange=NSE`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    },

    getFullQuote: async (token: string, instrumentKey: string) => {
        const response = await axios.get(`${BASE_URL}/market-quote/quotes?symbol=${instrumentKey}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    },

    getMarketQuotes: async (token: string, instrumentKeys: string[]) => {
        const symbolList = instrumentKeys.join(',');
        const response = await axios.get(`${BASE_URL}/market-quote/ltp?symbol=${symbolList}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    }
};
