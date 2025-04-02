'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { getRequestsByEmployee, cancelRequest } from '@/lib/firebase/firebaseUtils';
import { Request } from '@/lib/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, loading, hasRole } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading && !hasRole('employee')) {
      router.push('/');
      return;
    }
  }, [user, loading, hasRole, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (user) {
        try {
          const userRequests = await getRequestsByEmployee(user.id);
          setRequests(userRequests);
        } catch (error) {
          console.error('Error fetching requests:', error);
          toast.error(t('error.loading.requests'));
        } finally {
          setLoadingRequests(false);
        }
      }
    };

    fetchRequests();
  }, [user, t]);

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelRequest(requestId);
      // Update the local state to reflect the cancellation
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { ...request, status: 'cancelled' } 
          : request
      ));
      toast.success(t('request.cancelled'));
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error instanceof Error ? error.message : t('error.cancelling.request'));
    }
  };

  if (loading || loadingRequests) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Quick Actions Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('quick.actions')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/employee/new-request"
              className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('new.extra.shift')}
            </Link>
            <Link
              href="/employee/new-request?type=vacation"
              className="flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('new.vacation')}
            </Link>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('my.requests')}</h1>
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 mb-4">
                {t('no.requests.found')}
              </p>
              <Link
                href="/employee/new-request"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('create.request')}
              </Link>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-lg font-medium text-gray-900">
                      {t(request.type === 'extra_shift' ? 'extra.shift' : 'vacation')}
                    </span>
                    {request.projectName && (
                      <p className="text-sm text-gray-500">
                        {t('project')}: {request.projectName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {t(`status.${request.status}`)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  <p>
                    {t('start.date')}:{' '}
                    {request.startDate.toDate().toLocaleDateString()}
                  </p>
                  {request.endDate && (
                    <p>
                      {t('end.date')}:{' '}
                      {request.endDate.toDate().toLocaleDateString()}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {t('requested.on')}{' '}
                  {request.createdAt.toDate().toLocaleDateString()}
                </p>
                {request.status !== 'cancelled' && new Date(request.startDate.toDate()) > new Date() && (
                  <button
                    onClick={() => handleCancelRequest(request.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    {t('cancel.request')}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 