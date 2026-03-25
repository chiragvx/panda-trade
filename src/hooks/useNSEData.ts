import { useQuery } from '@tanstack/react-query';

const NSE_PROXY = 'https://corsproxy.io/?'; // Use a proxy because NSE blocks direct browser requests
const BASE_URL = 'https://www.nseindia.com';

export interface NSEDataOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

export const useNSEData = <T>(endpoint: string, options: NSEDataOptions = {}) => {
  const { pollingInterval = 0, enabled = false } = options;

  // Add jitter to avoid simultaneous hits
  const jitter = Math.floor(Math.random() * 5000);
  const finalInterval = pollingInterval > 0 ? pollingInterval + jitter : 0;

  return useQuery<T>({
    queryKey: ['nse', endpoint],
    queryFn: async () => {
      const response = await fetch(`${NSE_PROXY}${encodeURIComponent(BASE_URL + endpoint)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.nseindia.com',
        },
      });

      if (!response.ok) {
        throw new Error(`NSE API: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: finalInterval,
    enabled,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    staleTime: 60000,
  });
};
