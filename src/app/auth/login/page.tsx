'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import InstallAppCard from '../../components/InstallAppCard';

const LANGUAGES = [
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // The home page sends each user to the area of their role
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      const wrong = ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email'];
      toast.error(t(wrong.includes(err?.code) ? 'login.error' : 'login.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel (large screens) */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-navy via-[#2C5C8F] to-brand-blue p-12 text-white">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.10]" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden>
          <path d="M420 -20 L120 720" stroke="white" strokeWidth="90" />
          <path d="M540 -20 L300 720" stroke="white" strokeWidth="60" />
          <ellipse cx="300" cy="360" rx="330" ry="110" transform="rotate(-12 300 360)" stroke="white" strokeWidth="18" />
        </svg>
        <div className="relative">
          <div className="inline-flex rounded-2xl bg-white p-3 shadow-lg">
            <Image src="/images/tsk-logo-crop.png" alt="TSK הנדסה אזרחית" width={1510} height={1160} className="h-16 w-auto" priority />
          </div>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">{t('login.app.name')}</h2>
          <p className="mt-3 text-lg text-white/80">{t('login.subtitle')}</p>
        </div>
        <p className="relative text-sm text-white/60">TSK · הנדסה אזרחית</p>
      </div>

      {/* Sign-in form */}
      <div className="relative flex flex-col items-center justify-center px-5 py-10 bg-[var(--background)]">
        <div className="absolute top-4 end-4 flex rounded-xl bg-white p-1 text-xs shadow-soft ring-1 ring-slate-100">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`rounded-lg px-2.5 py-1 font-medium ${language === l.code ? 'bg-brand-blue-light text-brand-navy' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/tsk-logo-crop.png" alt="TSK הנדסה אזרחית" width={1510} height={1160} className="h-24 w-auto" priority />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">{t('login.welcome')}</h1>
          <p className="mt-1.5 text-slate-500">{t('login.subtitle')}</p>

          <form className="mt-8 space-y-4" onSubmit={handleEmailLogin}>
            <div>
              <label htmlFor="email-address" className="field-label">{t('login.email')}</label>
              <div className="relative" dir="ltr">
                <Mail className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-4 h-5 w-5 text-slate-400" />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  dir="ltr"
                  required
                  className="field-input ps-12 text-start"
                  placeholder="name@company.co.il"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="field-label">{t('login.password')}</label>
              <div className="relative" dir="ltr">
                <Lock className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-4 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  dir="ltr"
                  required
                  className="field-input ps-12 pe-12 text-start"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                  aria-label={t('login.password')}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-navy/20 hover:bg-brand-navy-dark active:scale-[0.99] transition disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              {isLoading ? t('login.signing.in') : t('login.submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('login.no.account')}{' '}
            <Link href="/auth/register" className="font-medium text-brand-blue hover:text-brand-navy">
              {t('login.register')}
            </Link>
          </p>
          <p className="mt-4 text-center">
            <InstallAppCard compact />
          </p>
        </div>
      </div>
    </div>
  );
}
