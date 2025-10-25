'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppMode, MODE_STORAGE_KEY, detectMode } from '@/lib/api/config';

type ModeContextValue = {
  mode: AppMode;
  setMode: (m: AppMode) => void;
};

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('property');

  useEffect(() => {
    // Initialize from URL/localStorage heuristics
    const initial = detectMode();
    setModeState(initial);
    try {
      if (typeof window !== 'undefined')
        localStorage.setItem(MODE_STORAGE_KEY, initial);
    } catch {
      /* ignore */
    }
  }, []);

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    try {
      if (typeof window !== 'undefined')
        localStorage.setItem(MODE_STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
    // Keep URL param in sync for clarity without full reload
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('view', m);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}
