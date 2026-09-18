import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { t as translate, type Language } from '@/i18n';

interface LocaleValue { language: Language; setLanguage: (language: Language) => void; t: (key: Parameters<typeof translate>[0]) => string; }
const LocaleContext = createContext<LocaleValue | null>(null);
export function LocaleProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>('en');
  useEffect(() => { if (typeof localStorage !== 'undefined') setLanguageState((localStorage.getItem('yaycha.language') as Language | null) ?? 'en'); }, []);
  const setLanguage = (next: Language) => { setLanguageState(next); if (typeof localStorage !== 'undefined') localStorage.setItem('yaycha.language', next); };
  return <LocaleContext.Provider value={{ language, setLanguage, t: (key) => translate(key, language) }}>{children}</LocaleContext.Provider>;
}
export function useLocale() { const value = useContext(LocaleContext); if (!value) throw new Error('useLocale must be used within LocaleProvider'); return value; }