import { useEffect } from 'react';
import { useGlobalStore } from '../store/globalStore';
import { useLayoutStore } from '../store/useStore';

export const useKeyboardShortcuts = () => {
  const { activeSymbol, addToWatchlist } = useGlobalStore();
  const { openOrderModal, setWorkspace } = useLayoutStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      // Shift + Key shortcuts
      if (e.shiftKey) {
        switch (e.key.toUpperCase()) {
          case 'B':
            e.preventDefault();
            openOrderModal('BUY');
            break;
          case 'S':
            e.preventDefault();
            openOrderModal('SELL');
            break;
          case 'A':
            e.preventDefault();
            if (activeSymbol) addToWatchlist(activeSymbol);
            break;
        }
      }

      // Single key shortcuts
      switch (e.key) {
        case '/':
          e.preventDefault();
          // Logic to focus NL screener - could use a global ref or state
          setWorkspace('ANALYSIS');
          setTimeout(() => {
             const nlInput = document.querySelector('input[placeholder*="TYPE_QUERY"]') as HTMLInputElement;
             nlInput?.focus();
          }, 100);
          break;
        case ' ':
          if (e.target === document.body) {
            e.preventDefault();
            // Trigger command palette (already handled by existing logic usually, but let's be explicit)
            const event = new CustomEvent('toggle-command-palette');
            window.dispatchEvent(event);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSymbol, addToWatchlist, openOrderModal, setWorkspace]);
};
