'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
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
                {t('my.requests')}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/employee"
                className={isActive('/employee')}
              >
                {t('all.requests')}
              </Link>
              <Link
                href="/employee/new-request"
                className={isActive('/employee/new-request')}
              >
                {t('new.request')}
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