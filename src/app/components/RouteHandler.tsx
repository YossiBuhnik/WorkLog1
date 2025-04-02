'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function RouteHandler() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading && user) {
      // Check if the user is accessing from a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        if (user.roles.includes('manager')) {
          router.push('/manager');
        } else if (user.roles.includes('employee')) {
          router.push('/employee');
        } else {
          router.push('/office'); // Fallback to office view even on mobile
        }
      } else {
        // Desktop users always go to office view
        router.push('/office');
      }
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // The actual content won't be shown as we're always redirecting
  return null;
} 