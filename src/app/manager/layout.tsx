'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePendingRequests } from '@/lib/hooks/usePendingRequests';
import { useTranslation } from '@/lib/hooks/useTranslation';
import SubNav from '../components/SubNav';
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


  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SubNav
        title={t('manager.dashboard')}
        tabs={[
          { href: '/manager', label: t('pending.requests'), badge: pendingCount },
          { href: '/manager/all-requests', label: t('all.requests') },
          { href: '/manager/schedule', label: t('schedule') },
        ]}
      />

      <main className="flex-1 bg-[var(--background)] px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 