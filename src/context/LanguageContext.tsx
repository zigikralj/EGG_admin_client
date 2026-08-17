import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, serviceTypeTranslations } from '../i18n/translations';
import type { Language, TranslationKeys } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys, params?: Record<string, string | number>) => string;
  getServiceLabel: (typeCode: string) => string;
  getResponsibleLabel: (
    userOrGender?: string | { gender?: string | null } | null,
    usersList?: { id: string; name: string; gender?: string | null }[]
  ) => string;
}

const STORAGE_KEY = 'app_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'sr-Latn' || saved === 'sr-Cyrl')) {
      return saved as Language;
    }
    return 'sr-Latn'; // Default language is Serbian (Latin)
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: keyof TranslationKeys, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations['sr-Latn'] || translations['en'];
    let text = dict[key] || translations['sr-Latn']?.[key] || translations['en']?.[key] || String(key);

    if (params) {
      Object.entries(params).forEach(([pKey, pValue]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pValue));
      });
    }

    return text;
  };

  const getServiceLabel = (typeCode: string): string => {
    const langDict = serviceTypeTranslations[language] || serviceTypeTranslations['sr-Latn'] || serviceTypeTranslations['en'];
    return langDict[typeCode] || serviceTypeTranslations['sr-Latn']?.[typeCode] || serviceTypeTranslations['en']?.[typeCode] || typeCode;
  };

  const getResponsibleLabel = (
    userOrGender?: string | { gender?: string | null } | null,
    usersList?: { id: string; name: string; gender?: string | null }[]
  ): string => {
    let gender: string | null | undefined = null;
    if (userOrGender && typeof userOrGender === 'object') {
      gender = userOrGender.gender;
    } else if (typeof userOrGender === 'string') {
      if (userOrGender === 'Female' || userOrGender === 'Male' || userOrGender === 'Other') {
        gender = userOrGender;
      } else if (usersList && usersList.length > 0) {
        const found = usersList.find(
          (u) => u.id === userOrGender || (u.name && u.name.trim().toLowerCase() === userOrGender.trim().toLowerCase())
        );
        if (found) gender = found.gender;
      }
    }

    if (gender === 'Female') return t('responsibleFemale');
    if (gender === 'Other') return t('responsibleOther');
    if (gender === 'Male') return t('responsibleMale');
    return t('responsible');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getServiceLabel, getResponsibleLabel }}>
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
