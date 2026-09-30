'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePendingRequests } from '@/lib/hooks/usePendingRequests';
import { useTranslation } from '@/lib/hooks/useTranslation';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authState = useAuth();
  const { user } = authState;

  // Only users with the manager role may use this area
  const { loading, hasRole } = authState;
  const router = useRouter();
  const allowed = !!user && hasRole('manager');
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/auth/login');
    else if (!hasRole('manager')) router.replace('/');
  }, [loading, user, hasRole, router]);
  const pendingCount = usePendingRequests(user?.id);
  const pathname = usePathname();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    return pathname === path
      ? 'nav-link-active'
      : 'nav-link';
  };

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-[var(--primary)] shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">
                {user?.name || t('unknown.employee')} {t('manager.dashboard')}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/manager"
                className={isActive('/manager')}
              >
                {t('pending.requests')}
                {pendingCount > 0 && pathname !== '/manager' && (
                  <span className="ml-2 bg-[var(--accent)] text-white text-xs px-2 py-1 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link
                href="/manager/all-requests"
                className={isActive('/manager/all-requests')}
              >
                {t('all.requests')}
              </Link>
              <Link
                href="/manager/schedule"
                className={isActive('/manager/schedule')}
              >
                {t('schedule')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 bg-[var(--background)] p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 