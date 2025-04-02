'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

type Language = 'en' | 'he' | 'ar';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-[var(--primary-dark)] rounded-md transition-colors"
      >
        <Globe className="h-5 w-5" />
        <span>{languages.find(l => l.code === language)?.nativeName}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                language === lang.code ? 'text-emerald-600 font-medium' : 'text-gray-700'
              }`}
            >
              <span>{lang.name}</span>
              <span className="text-gray-500">{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 