'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { T, type Lang } from '@/locales/translations';

type LangCtx = { lang: Lang; setLang: (l: Lang) => void };

const LangCtx = createContext<LangCtx>({ lang: 'fr', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'fr' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLanguage() { return useContext(LangCtx); }
export function useT() { return T[useContext(LangCtx).lang]; }
