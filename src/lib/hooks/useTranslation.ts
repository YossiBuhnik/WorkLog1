import { useLanguage } from '@/lib/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { useCallback } from 'react';

export function useTranslation() {
  const { language } = useLanguage();

  const t = useCallback((key: string) => {
    if (!translations[key]) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translations[key][language];
  }, [language]);

  return { t };
} 