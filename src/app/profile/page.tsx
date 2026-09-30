'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check, Globe, Loader2, LogOut, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { updateUser } from '@/lib/firebase/firebaseUtils';
import { initialsOf } from '@/lib/initials';

const LANGUAGES = [
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      setName(user.displayName || (user as any).name || '');
      setPhoneNumber((user as any).phoneNumber || '');
    }
  }, [user, loading, router]);

  // The email is the sign-in name, so it is shown but not editable here
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUser(user.id, { displayName: name.trim(), name: name.trim(), phoneNumber: phoneNumber.trim() } as any);
      toast.success(t('profile.saved'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.save.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (loading || !user) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-8 space-y-4 animate-pulse">
        <div className="h-40 rounded-3xl bg-slate-200/70" />
        <div className="h-64 rounded-3xl bg-slate-200/70" />
      </div>
    );
  }

  const displayName = name || user.email;

  return (
    <main className="px-4 pt-5 pb-8 md:pt-8">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#2C5C8F] to-brand-blue p-6 text-white shadow-lg shadow-brand-navy/20">
          <div className="flex items-center gap-4">
            <span className="h-16 w-16 shrink-0 rounded-2xl bg-white/15 ring-1 ring-white/25 text-2xl font-bold flex items-center justify-center">
              {initialsOf(displayName)}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{displayName}</h1>
              <p className="text-sm text-white/75 truncate" dir="ltr">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.roles?.map((role) => (
                  <span key={role} className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">{t(`role.${role}`)}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="panel p-5 sm:p-7 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t('profile.details')}</h2>
          <div>
            <label htmlFor="name" className="field-label">{t('profile.name')}</label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-4 h-5 w-5 text-slate-400" />
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="field-input ps-12" />
            </div>
          </div>
          <div>
            <label htmlFor="phoneNumber" className="field-label">{t('phone')}</label>
            <div className="relative" dir="ltr">
              <Phone className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-4 h-5 w-5 text-slate-400" />
              <input
                id="phoneNumber"
                type="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="field-input ps-12"
                placeholder="050-0000000"
              />
            </div>
          </div>
          <div>
            <label className="field-label">{t('login.email')}</label>
            <div className="relative" dir="ltr">
              <Mail className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-4 h-5 w-5 text-slate-400" />
              <input value={user.email} readOnly className="field-input ps-12 bg-slate-50 text-slate-500" />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{t('profile.email.note')}</p>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-6 py-3.5 font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-60">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            {isSubmitting ? t('saving') : t('profile.save')}
          </button>
        </form>

        <div className="panel p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-3">
            <Globe className="h-5 w-5 text-slate-400" />
            {t('nav.language')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`rounded-xl py-2.5 text-sm font-medium ring-1 transition ${
                  language === l.code ? 'bg-brand-blue-light text-brand-navy ring-brand-blue/40' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-medium text-red-600 ring-1 ring-red-200 bg-white hover:bg-red-50">
          <LogOut className="h-5 w-5" />
          {t('logout')}
        </button>
      </div>
    </main>
  );
}
