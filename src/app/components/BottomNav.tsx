'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { usePendingRequests } from '@/lib/hooks/usePendingRequests';
import { navItemsFor, isActivePath } from './navItems';

/** Phone navigation: a bar at the bottom of the screen, within reach of the thumb. */
export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { t } = useTranslation();
  const isManager = !!user?.roles?.includes('manager');
  const pendingCount = usePendingRequests(isManager ? user?.id : undefined);

  if (!user || pathname.startsWith('/auth')) return null;

  const items = navItemsFor(user.roles);

  return (
    <>
      {/* keeps page content from hiding behind the bar */}
      <div className="h-24 md:hidden" aria-hidden />
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-safe">
        <div className="flex items-end justify-around px-2 h-16">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            if (item.primary) {
              return (
                <Link key={item.key} href={item.href} className="flex flex-col items-center -mt-6" aria-label={t('new.request')}>
                  <span className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-navy/30 ring-4 ring-white transition-transform active:scale-95 ${
                    active ? 'bg-brand-blue' : 'bg-brand-navy'
                  }`}>
                    <Icon className="h-7 w-7" strokeWidth={2.5} />
                  </span>
                  <span className="mt-1 text-[11px] font-medium text-slate-600">{t(item.labelKey)}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 h-full text-[11px] font-medium transition-colors ${
                  active ? 'text-brand-navy' : 'text-slate-400'
                }`}
              >
                <span className={`relative flex items-center justify-center h-8 w-12 rounded-full transition-colors ${active ? 'bg-brand-blue-light' : ''}`}>
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  {item.badge === 'pending' && pendingCount > 0 && (
                    <span className="absolute -top-1 -end-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </span>
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
