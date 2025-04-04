'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function RouteHandler() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!loading && !user) {
        console.log('No user found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      if (!loading && user) {
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
          // Desktop users always go to office view
          router.push('/office');
        }
      }
    } catch (err) {
      console.error('Error in RouteHandler:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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