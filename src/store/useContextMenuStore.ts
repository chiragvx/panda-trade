import { create } from 'zustand';

export interface ContextMenuOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'danger' | 'success' | 'info' | 'primary' | 'muted';
}

interface ContextMenuStore {
  isOpen: boolean;
  x: number;
  y: number;
  options: ContextMenuOption[];
  openContextMenu: (x: number, y: number, options: ContextMenuOption[]) => void;
  closeContextMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuStore>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  options: [],
  openContextMenu: (x, y, options) => set({ isOpen: true, x, y, options }),
  closeContextMenu: () => set({ isOpen: false }),
}));
