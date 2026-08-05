import React, { createContext, useContext, useMemo, useState } from 'react';
import { translations, Language, Translations, loadLanguage, saveLanguage } from '@/i18n';
import { dateLocaleFromLanguage, type DateLocale } from '@/utils/date';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  /** fr-FR when French, en-GB when English — for date/day labels only. */
  dateLocale: DateLocale;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => loadLanguage());

  const setLanguage = (lang: Language) => {
    saveLanguage(lang);
    setLanguageState(lang);
  };

  const t = translations[language];
  const dateLocale = useMemo(() => dateLocaleFromLanguage(language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dateLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
