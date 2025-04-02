import { useLanguage } from '@/lib/contexts/LanguageContext';
import { translations } from '@/lib/translations';

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: string) => {
    if (!translations[key]) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translations[key][language];
  };

  return { t };
} 