'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Request } from '@/lib/types';
import toast from 'react-hot-toast';

export default function AllRequests() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) {
        setError(t('error.no.user'));
        setLoadingRequests(false);
        return;
      }

      if (!user.id) {
        setError(t('error.no.user.id'));
        setLoadingRequests(false);
        return;
      }

      // Check if user has manager role
      if (!user.roles?.includes('manager')) {
        setError(t('error.access.denied'));
        setLoadingRequests(false);
        return;
      }

      try {
        console.log('Fetching requests for manager:', user.id);
        const requestsRef = collection(db, 'requests');
        let q = query(
          requestsRef,
          where('managerId', '==', user.id),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        console.log('Fetched requests count:', querySnapshot.docs.length);
        
        const fetchedRequests = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Request data:', { id: doc.id, ...data });
          return {
            ...data,
            id: doc.id,
          } as Request;
        });

        setRequests(fetchedRequests);
        setError(null);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError(error instanceof Error ? error.message : t('error.loading.requests'));
        toast.error(t('error.loading.requests'));
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, [user, t]);

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (loading || loadingRequests) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{t('error.loading.requests.title')}</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('all.requests.title')}</h1>
        <p className="text-gray-500">{t('view.requests.history')}</p>
      </div>

      <div className="mb-6">
        <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
          {t('filter.by.status')}
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="all">{t('all.requests')}</option>
          <option value="pending">{t('status.pending')}</option>
          <option value="approved">{t('status.approved')}</option>
          <option value="rejected">{t('status.rejected')}</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">{t('no.requests.found')}</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <li key={request.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {t(request.type === 'extra_shift' ? 'extra.shift' : 'vacation')}
                      </p>
                      <span
                        className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {t(`status.${request.status}`)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.createdAt.toDate().toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      {request.projectName && (
                        <p className="flex items-center text-sm text-gray-500">
                          {t('project')}: {request.projectName}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {t('start.date')}: {request.startDate.toDate().toLocaleDateString()}
                        {request.endDate && (
                          <span>
                            {' • '}
                            {t('end.date')}: {request.endDate.toDate().toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 