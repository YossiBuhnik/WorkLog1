'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function RouteHandler() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  // A user whose roles were all removed has no area to go to (would otherwise redirect in a loop)
  const noRoles = !!user && !['employee', 'manager', 'office'].some((r) => user.roles?.includes(r));

  useEffect(() => {
    try {
      if (!loading && !user) {
        console.log('No user found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      if (!loading && user && !noRoles) {
        console.log('User found:', user.email);
        // Check if the user is accessing from a mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          if (user.roles?.includes('manager')) {
            router.push('/manager');
          } else if (user.roles?.includes('employee')) {
            router.push('/employee');
          } else {
            router.push('/office'); // Fallback to office view even on mobile
          }
        } else {
          // Desktop: each user goes to the area of their role
          // (previously everyone went to the office view, including managers and employees)
          if (user.roles?.includes('office')) {
            router.push('/office');
          } else if (user.roles?.includes('manager')) {
            router.push('/manager');
          } else {
            router.push('/employee');
          }
        }
      }
    } catch (err) {
      console.error('Error in RouteHandler:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  }, [user, loading, router, noRoles]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (noRoles) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="panel max-w-sm p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">{t('no.roles.title')}</p>
          <p className="mt-2 text-slate-500">{t('no.roles.text')}</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <div className="text-gray-600">
          Debug info:
          <pre className="mt-2 p-4 bg-gray-100 rounded">
            {JSON.stringify({ loading, userExists: !!user }, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // The actual content won't be shown as we're always redirecting
  return null;
} 