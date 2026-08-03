'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Mode } from '@/lib/types';

interface ModeContextValue {
  mode: Mode;
  modeSelected: boolean;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('b2b');
  const [modeSelected, setModeSelected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mode') as Mode | null;
    if (saved === 'b2b') {
      setModeState('b2b');
      setModeSelected(true);
    }
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState('b2b');
    setModeSelected(true);
    localStorage.setItem('mode', 'b2b');
  }, []);

  return (
    <ModeContext.Provider value={{ mode, modeSelected, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}
