
import React, { createContext, useContext, useState, useCallback } from 'react';
import { LIGHT_COLORS, DARK_COLORS } from '../themes/colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children, initialDark = false }) {
  const [dark, setDark] = useState(initialDark);

  const toggleDark = useCallback((val) => {
    setDark(typeof val === 'boolean' ? val : prev => !prev);
  }, []);

  const C = dark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ C, dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook every screen uses ─────────────────
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}