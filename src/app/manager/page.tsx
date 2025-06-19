'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { getRequestsByManager, updateRequestStatus, createNotification, getDocuments } from '@/lib/firebase/firebaseUtils';
import { Request, User } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [employees, setEmployees] = useState<Map<string, User>>(new Map());
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Fetch requests and employees in parallel
          const [managerRequests, employeesData] = await Promise.all([
            getRequestsByManager(),
            getDocuments('users') as Promise<User[]>
          ]);

          // Create a map of employee IDs to employee data
          const employeeMap = new Map(
            employeesData.map(emp => [emp.id, emp])
          );
          
          setEmployees(employeeMap);
          console.log('ManagerDashboard: managerRequests', managerRequests);
          setRequests(managerRequests);
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error(t('error.loading.requests'));
        } finally {
          setLoadingRequests(false);
        }
      }
    };

    fetchData();
  }, [user, t]);

  const handleUpdateStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    if (processingId || !user) return;
    setProcessingId(requestId);

    try {
      await updateRequestStatus(requestId, status, user.displayName || user.email || 'Manager');
      
      const request = requests.find(r => r.id === requestId);
      if (request) {
        const statusText = t(`status.${status}`).toLowerCase();
        await createNotification({
          userId: request.employeeId,
          title: t(`status.${status}`),
          message: t(`request.status.updated.${request.type}`).replace('{status}', statusText),
          relatedRequestId: requestId
        });
      }

      setRequests(requests.filter(r => r.id !== requestId));
      toast.success(t(`request.status.success.${status}`));
    } catch (error) {
      console.error(`Error ${status} request:`, error);
      toast.error(t(`request.status.error.${status}`));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || loadingRequests) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('pending.requests')}</h1>
        <p className="text-gray-500">{t('review.manage.requests')}</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">{t('no.pending.requests')}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => {
            const employee = employees.get(request.employeeId);
            return (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow overflow-hidden p-4"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {t(request.type === 'extra_shift' ? 'extra.shift' : 'vacation')}
                    </span>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {employee?.displayName || employee?.email || t('unknown.employee')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {request.createdAt.toDate().toLocaleDateString()}
                  </span>
                </div>

                {request.projectName && (
                  <p className="text-sm text-gray-600 mb-2">
                    {t('project')}: {request.projectName}
                  </p>
                )}

                <div className="text-sm text-gray-600">
                  <p>{t('start.date')}: {request.startDate.toDate().toLocaleDateString()}</p>
                  {request.endDate && (
                    <p>{t('end.date')}: {request.endDate.toDate().toLocaleDateString()}</p>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleUpdateStatus(request.id, 'approved')}
                    disabled={!!processingId}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {processingId === request.id ? t('processing') : t('approve')}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(request.id, 'rejected')}
                    disabled={!!processingId}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {processingId === request.id ? t('processing') : t('reject')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 