import { create } from 'zustand';
import { Alert } from '../types';

interface AlertState {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'status'>) => void;
  removeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  addAlert: (alertData) => {
    const newAlert: Alert = {
      ...alertData,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      status: 'active',
    };
    set((state) => ({ alerts: [newAlert, ...state.alerts] }));
  },
  removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
  dismissAlert: (id) => set((state) => ({
    alerts: state.alerts.map((a) => a.id === id ? { ...a, status: 'dismissed' } : a)
  })),
  clearAlerts: () => set({ alerts: [] }),
}));
