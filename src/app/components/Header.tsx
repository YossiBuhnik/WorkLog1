'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Globe, Check } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { usePendingRequests } from '@/lib/hooks/usePendingRequests';
import { navItemsFor, isActivePath } from './navItems';
import { initialsOf } from '@/lib/initials';

const LANGUAGES = [
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
] as const;

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const isManager = !!user?.roles?.includes('manager');
  const pendingCount = usePendingRequests(isManager ? user?.id : undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const name = user.displayName || (user as any).name || user.email;
  const items = navItemsFor(user.roles);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="TSK">
            <Image
              src="/images/tsk-logo-crop.png"
              alt="TSK הנדסה אזרחית"
              width={1510}
              height={1160}
              priority
              className="h-11 w-auto"
            />
            <span className="hidden sm:block h-8 w-px bg-slate-200" />
            <span className="hidden sm:block text-sm font-medium text-slate-500">{t('login.app.name')}</span>
          </Link>

          {/* Desktop navigation (phones use the bottom bar) */}
          <nav className="hidden md:flex items-center gap-1">
            {items.filter((i) => !i.primary && i.key !== 'profile').map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'bg-brand-blue-light text-brand-navy' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                  {item.badge === 'pending' && pendingCount > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
            {items.some((i) => i.primary) && (
              <Link
                href="/employee/new-request"
                className="ms-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy text-white text-sm font-medium hover:bg-brand-navy-dark transition-colors shadow-sm"
              >
                <span className="text-lg leading-none">+</span>
                {t('new.request')}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 transition-colors"
                aria-label={t('profile')}
              >
                <span className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-blue to-brand-navy text-white text-sm font-semibold flex items-center justify-center">
                  {initialsOf(name)}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute end-0 mt-2 w-64 bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{name}</p>
                    <p className="text-sm text-slate-500 truncate" dir="ltr">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon className="h-4 w-4 text-slate-400" />
                    {t('profile')}
                  </Link>
                  <div className="px-4 py-2 border-t border-slate-100">
                    <p className="flex items-center gap-3 text-xs font-medium text-slate-400 mb-1.5">
                      <Globe className="h-4 w-4" />
                      {t('nav.language')}
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => setLanguage(l.code)}
                          className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-sm ${
                            language === l.code ? 'bg-brand-blue-light text-brand-navy font-medium' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {language === l.code && <Check className="h-3.5 w-3.5" />}
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
