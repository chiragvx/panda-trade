import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  aisStreamApiKey: string;
  setAisStreamApiKey: (key: string) => void;
  nasaApiKey: string;
  setNasaApiKey: (key: string) => void;
  rapidApiKey: string;
  setRapidApiKey: (key: string) => void;
  flightAwareApiKey: string;
  setFlightAwareApiKey: (key: string) => void;
  // List of connection IDs that the user has "added" to their dashboard
  enabledConnections: string[]; 
  addConnection: (id: string) => void;
  removeConnection: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aisStreamApiKey: '',
      setAisStreamApiKey: (aisStreamApiKey) => set({ aisStreamApiKey }),
      nasaApiKey: '',
      setNasaApiKey: (nasaApiKey) => set({ nasaApiKey }),
      rapidApiKey: '',
      setRapidApiKey: (rapidApiKey) => set({ rapidApiKey }),
      flightAwareApiKey: '',
      setFlightAwareApiKey: (flightAwareApiKey) => set({ flightAwareApiKey }),
      // Enabled connections - default list without the legacy OpenSky
      enabledConnections: ['upstox-01', 'aisstream-01', 'nasa-01', 'rapidapi-01', 'flightaware-01'], 
      addConnection: (id) => set((state) => ({
        enabledConnections: state.enabledConnections.includes(id) 
          ? state.enabledConnections 
          : [...state.enabledConnections, id]
      })),
      removeConnection: (id) => set((state) => ({
        enabledConnections: state.enabledConnections.filter(c => c !== id)
      }))
    }),
    {
      name: 'settings-storage',
    }
  )
);
