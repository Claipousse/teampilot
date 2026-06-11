'use client';

import { createContext, useContext, useState } from 'react';
import { T, type Lang } from '@/locales/translations';

type LangCtx = { lang: Lang; setLang: (l: Lang) => void };

const LangCtx = createContext<LangCtx>({ lang: 'fr', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

// Hook pour accéder à la langue actuelle et la changer
export function useLanguage() { return useContext(LangCtx); }

// Raccourci : retourne directement l'objet de traductions pour la langue courante
// Usage : const t = useT();  puis  t.nav.dashboard
export function useT() { return T[useContext(LangCtx).lang]; }
