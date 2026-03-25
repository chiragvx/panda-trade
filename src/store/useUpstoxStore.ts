import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UpstoxState {
  apiKey: string;
  apiSecret: string;
  accessToken: string | null;
  expiryTime: number | null;
  status: 'connected' | 'disconnected' | 'expired';
  isSandbox: boolean;
  prices: Record<string, any>;
  
  setCredentials: (apiKey: string, apiSecret: string) => void;
  setToken: (token: string, expiresIn: number) => void;
  setPrices: (newPrices: Record<string, any>) => void;
  logout: () => void;
  toggleSandbox: (val: boolean) => void;
  checkTokenValidity: () => void;
}

export const useUpstoxStore = create<UpstoxState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      apiSecret: '',
      accessToken: null,
      expiryTime: null,
      status: 'disconnected',
      isSandbox: false,
      prices: {},

      setCredentials: (apiKey, apiSecret) => set({ apiKey, apiSecret }),
      
      setToken: (accessToken, expiresIn) => {
        const expiryTime = Date.now() + expiresIn * 1000;
        set({ accessToken, expiryTime, status: 'connected' });
      },

      setPrices: (newPrices) => set((state) => ({ 
        prices: { ...state.prices, ...newPrices } 
      })),

      logout: () => set({ accessToken: null, expiryTime: null, status: 'disconnected' }),

      toggleSandbox: (isSandbox) => set({ isSandbox }),

      checkTokenValidity: () => {
        const { accessToken, expiryTime } = get();
        if (!accessToken) {
          set({ status: 'disconnected' });
          return;
        }
        if (expiryTime && Date.now() > expiryTime) {
          set({ status: 'expired' });
        } else {
          set({ status: 'connected' });
        }
      },
    }),
    {
      name: 'upstox-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        apiSecret: state.apiSecret,
        accessToken: state.accessToken,
        expiryTime: state.expiryTime,
        isSandbox: state.isSandbox,
      }),
    }
  )
);
