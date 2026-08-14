import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, serviceTypeTranslations } from '../i18n/translations';
import type { Language, TranslationKeys } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys, params?: Record<string, string | number>) => string;
  getServiceLabel: (typeCode: string) => string;
}

const STORAGE_KEY = 'app_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'sr-Latn' || saved === 'sr-Cyrl')) {
      return saved as Language;
    }
    return 'en'; // Default language is English
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: keyof TranslationKeys, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations['en'];
    let text = dict[key] || translations['en'][key] || String(key);

    if (params) {
      Object.entries(params).forEach(([pKey, pValue]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pValue));
      });
    }

    return text;
  };

  const getServiceLabel = (typeCode: string): string => {
    const langDict = serviceTypeTranslations[language] || serviceTypeTranslations['en'];
    return langDict[typeCode] || serviceTypeTranslations['en'][typeCode] || typeCode;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getServiceLabel }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
