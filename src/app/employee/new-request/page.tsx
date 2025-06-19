'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { createRequest, getDocuments } from '@/lib/firebase/firebaseUtils';
import { User } from '@/lib/types';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

// Define RequestType here since it's not in types.ts
export type RequestType = 'vacation' | 'extra_shift';

function NewRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, hasRole } = useAuth();
  const { t } = useTranslation();
  const [requestType, setRequestType] = useState<RequestType>(() => {
    const type = searchParams.get('type');
    return type === 'vacation' ? 'vacation' : 'extra_shift';
  });
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [managerId, setManagerId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading && !hasRole('employee')) {
      router.push('/');
      return;
    }

    // Fetch manager when component mounts
    const fetchManager = async () => {
      try {
        const users = await getDocuments('users') as User[];
        const manager = users.find(u => u.roles.includes('manager'));
        if (manager) {
          setManagerId(manager.id);
        } else {
          toast.error(t('error.no.manager'));
        }
      } catch (error) {
        console.error('Error fetching manager:', error);
        toast.error(t('error.fetching.manager'));
      }
    };

    fetchManager();
  }, [user, loading, hasRole, router, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!managerId) {
      toast.error(t('error.no.manager.assigned'));
      setSubmitting(false);
      return;
    }

    if (!user) {
      toast.error(t('error.login.required'));
      setSubmitting(false);
      return;
    }

    try {
      // Create dates with time set to start of day
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);

      let endDateTime: Date | undefined;
      if (requestType === 'vacation' && endDate) {
        endDateTime = new Date(endDate);
        endDateTime.setHours(0, 0, 0, 0);
      }

      const requestData = {
        type: requestType,
        employeeId: user.id,
        employeeName: user.displayName || user.email,
        managerId: managerId,
        startDate: Timestamp.fromDate(startDateTime),
        ...(requestType === 'extra_shift' ? { projectName } : {}),
        ...(endDateTime ? { endDate: Timestamp.fromDate(endDateTime) } : {}),
      };

      console.log('Submitting request with data:', requestData);
      
      const requestId = await createRequest(requestData);
      console.log('Request created with ID:', requestId);
      
      toast.success(t('request.submitted'));
      router.push('/employee');
    } catch (error) {
      console.error('Error submitting request:', error);
      if (error instanceof Error) {
        toast.error(`${t('error.submitting.request')}: ${error.message}`);
      } else {
        toast.error(t('error.submitting.request.try.again'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('new.request')}</h1>
          <p className="text-gray-500">{t('submit.new.request')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('request.type')}
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as RequestType)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="extra_shift">{t('extra.shift')}</option>
              <option value="vacation">{t('vacation')}</option>
            </select>
          </div>

          {requestType === 'extra_shift' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('project.name')}
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('enter.project.name')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('start.date')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {requestType === 'vacation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('end.date')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/employee')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? t('submitting') : t('submit.request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewRequest() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewRequestContent />
    </Suspense>
  );
} 