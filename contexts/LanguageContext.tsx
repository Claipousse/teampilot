'use client';

import { createContext, useContext, useState } from 'react';
import { T, type Lang } from '@/locales/translations';

type LangCtx = { lang: Lang; setLang: (l: Lang) => void };

const LangCtx = createContext<LangCtx>({ lang: 'fr', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'fr';
    const saved = localStorage.getItem('lang');
    return (saved === 'fr' || saved === 'en') ? saved : 'fr';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLanguage() { return useContext(LangCtx); }
export function useT() { return T[useContext(LangCtx).lang]; }
