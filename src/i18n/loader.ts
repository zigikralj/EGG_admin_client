import type { Language, TranslationKeys } from './translations';

export async function loadTranslation(lang: Language): Promise<TranslationKeys> {
  switch (lang) {
    case 'en': return (await import('./locales/en')).default;
    case 'sr-Latn': return (await import('./locales/sr-Latn')).default;
    case 'sr-Cyrl': return (await import('./locales/sr-Cyrl')).default;
  }
}
