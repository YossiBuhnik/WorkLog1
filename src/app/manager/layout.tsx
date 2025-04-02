'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePendingRequests } from '@/lib/hooks/usePendingRequests';
import { useTranslation } from '@/lib/hooks/useTranslation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pendingCount = usePendingRequests(user?.id);
  const pathname = usePathname();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    return pathname === path
      ? 'nav-link-active'
      : 'nav-link';
  };

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