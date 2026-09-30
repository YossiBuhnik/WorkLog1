'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle2, Copy, Download, MoreVertical, PlusSquare, Share, Smartphone } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { detectPlatform, Platform, useInstallPrompt } from '@/lib/pwa';

/** Public page (no sign-in needed) that explains how to put the TSK app on the phone's home screen. */
export default function InstallPage() {
  const { t } = useTranslation();
  const { canPrompt, installed, promptInstall } = useInstallPrompt();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [tab, setTab] = useState<'ios' | 'android'>('android');
  const [link, setLink] = useState('');

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    setTab(p === 'ios' ? 'ios' : 'android');
    setLink(`${window.location.origin}/install`);
  }, []);

  const handleInstall = async () => {
    if (await promptInstall()) toast.success(t('install.done'));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t('install.link.copied'));
    } catch {
      // clipboard blocked - the link is visible and can be copied by hand
    }
  };

  const steps = tab === 'ios'
    ? [
        { icon: null, text: t('install.ios.1') },
        { icon: Share, text: t('install.ios.2') },
        { icon: PlusSquare, text: t('install.ios.3') },
        { icon: CheckCircle2, text: t('install.ios.4') },
      ]
    : [
        { icon: null, text: t('install.android.1') },
        { icon: MoreVertical, text: t('install.android.2') },
        { icon: Download, text: t('install.android.3') },
        { icon: CheckCircle2, text: t('install.android.4') },
      ];

  return (
    <main className="px-4 pt-8 pb-10">
      <div className="max-w-md mx-auto">
        {/* How the icon will look on the home screen */}
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-[28px] bg-white shadow-lg shadow-brand-navy/15 ring-1 ring-slate-200 overflow-hidden">
            <Image src="/icons/icon-192.png" alt="TSK" width={192} height={192} className="h-full w-full" priority />
          </div>
          <p className="mt-2 text-sm font-medium text-slate-600">TSK</p>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">{t('install.title')}</h1>
          <p className="mt-2 text-slate-500">{t('install.subtitle')}</p>
        </div>

        {installed ? (
          <div className="mt-8 rounded-3xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="mt-2 font-semibold text-emerald-900">{t('install.already')}</p>
            <Link href="/" className="mt-4 inline-flex btn-brand">{t('install.open')}</Link>
          </div>
        ) : (
          <>
            {canPrompt && (
              <button
                onClick={handleInstall}
                className="mt-8 w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-navy/20 hover:bg-brand-navy-dark active:scale-[0.99] transition"
              >
                <Download className="h-5 w-5" />
                {t('install.button')}
              </button>
            )}

            {platform === 'desktop' && (
              <div className="mt-8 rounded-3xl bg-brand-blue-light/60 p-5 ring-1 ring-brand-blue/20">
                <p className="flex items-center gap-2 font-semibold text-brand-navy">
                  <Smartphone className="h-5 w-5" />
                  {t('install.desktop.title')}
                </p>
                <p className="mt-1 text-sm text-slate-600">{t('install.desktop.text')}</p>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-slate-200">
                  <span className="flex-1 truncate px-2 text-sm text-slate-700" dir="ltr">{link}</span>
                  <button onClick={copyLink} className="btn-soft !px-3" aria-label={t('install.copy')}>
                    <Copy className="h-4 w-4" />
                    {t('install.copy')}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 panel p-5 sm:p-6">
              <div className="flex rounded-xl bg-slate-100 p-1 text-sm mb-5">
                {(['ios', 'android'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTab(p)}
                    className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
                      tab === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {p === 'ios' ? 'iPhone' : 'Android'}
                  </button>
                ))}
              </div>

              <ol className="space-y-4">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className="h-8 w-8 shrink-0 rounded-full bg-brand-navy text-white text-sm font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="flex-1 pt-1 text-slate-700 leading-relaxed">
                        {step.text}
                        {Icon && (
                          <span className="ms-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 align-middle text-brand-blue">
                            <Icon className="h-4 w-4" />
                          </span>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ol>

              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
                {t(tab === 'ios' ? 'install.tip.ios' : 'install.tip.android')}
              </p>
            </div>
          </>
        )}

        <p className="mt-8 text-center">
          <Link href="/" className="text-sm font-medium text-brand-blue hover:text-brand-navy">{t('install.continue.web')}</Link>
        </p>
      </div>
    </main>
  );
}
