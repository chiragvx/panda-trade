import { useQuery } from '@tanstack/react-query';

const NSE_PROXY = 'https://api.allorigins.win/raw?url='; 
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
      const response = await fetch(`${NSE_PROXY}${encodeURIComponent(BASE_URL + endpoint)}`);

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
