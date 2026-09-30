'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useInstallPrompt } from '@/lib/pwa';

/** Link to the install page; hidden when already running as the installed app. */
export default function InstallAppCard({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const { installed } = useInstallPrompt();
  if (installed) return null;
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;

  if (compact) {
    return (
      <Link href="/install" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy">
        <Smartphone className="h-4 w-4" />
        {t('install.card.title')}
      </Link>
    );
  }

  return (
    <Link href="/install" className="panel flex items-center gap-4 p-4 hover:ring-brand-blue/40 transition">
      <span className="h-11 w-11 shrink-0 rounded-xl bg-brand-blue-light text-brand-navy flex items-center justify-center">
        <Smartphone className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-slate-900">{t('install.card.title')}</span>
        <span className="block text-sm text-slate-500">{t('install.card.text')}</span>
      </span>
      <Chevron className="h-5 w-5 text-slate-300" />
    </Link>
  );
}
