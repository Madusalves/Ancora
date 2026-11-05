import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setScheme, type Scheme } from './index';

/** O app abre sempre no escuro; o claro só entra se o usuário escolher. */
export type Preference = 'light' | 'dark';

const KEY = 'ancora:theme-preference';

type ThemeControl = {
  scheme: Scheme;
  preference: Preference;
  setPreference: (next: Preference) => void;
  /** Alterna entre claro e escuro (guarda como escolha explícita). */
  toggle: () => void;
};

const ThemeContext = createContext<ThemeControl | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<Preference>('dark');
  const [loaded, setLoaded] = useState(false);

  // Preferência salva (se não der para ler, fica no escuro).
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (active && (v === 'light' || v === 'dark')) setPref(v);
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  const scheme: Scheme = preference;
  // Atualiza o esquema global antes de os filhos renderizarem (os estilos leem dele).
  setScheme(scheme);

  const setPreference = useCallback((next: Preference) => {
    setPref(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  const toggle = useCallback(() => setPreference(scheme === 'dark' ? 'light' : 'dark'), [scheme, setPreference]);

  const value = useMemo(() => ({ scheme, preference, setPreference, toggle }), [scheme, preference, setPreference, toggle]);

  if (!loaded) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeControl(): ThemeControl {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControl precisa estar dentro de <ThemeProvider>.');
  return ctx;
}
