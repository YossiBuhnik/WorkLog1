'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Request, User } from '@/lib/types';
import toast from 'react-hot-toast';

interface ScheduleItem {
  employeeId: string;
  employeeName: string;
  type: 'extra_shift' | 'vacation';
  startDate: Date;
  endDate?: Date;
  projectName?: string;
}

export default function Schedule() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user) return;

      try {
        // Get approved requests
        const requestsRef = collection(db, 'requests');
        const requestsQuery = query(
          requestsRef,
          where('managerId', '==', user.id),
          where('status', '==', 'approved')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map(doc => doc.data() as Request);

        // Get all employees
        const employeesRef = collection(db, 'users');
        const employeesSnapshot = await getDocs(employeesRef);
        const employees = new Map(
          employeesSnapshot.docs.map(doc => [doc.id, doc.data() as User])
        );

        // Combine requests with employee names
        const schedule = requests.map(request => ({
          employeeId: request.employeeId,
          employeeName: employees.get(request.employeeId)?.name || t('unknown.employee'),
          type: request.type,
          startDate: request.startDate.toDate(),
          endDate: request.endDate ? request.endDate.toDate() : undefined,
          projectName: request.projectName,
        }));

        setScheduleItems(schedule);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast.error(t('error.loading.schedule'));
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [user, t]);

  const filteredItems = scheduleItems.filter(item => {
    const itemMonth = `${item.startDate.getFullYear()}-${String(
      item.startDate.getMonth() + 1
    ).padStart(2, '0')}`;
    return itemMonth === selectedMonth;
  });

  if (loading || loadingSchedule) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('employee.schedule')}</h1>
        <p className="text-gray-500">{t('view.approved.schedule')}</p>
      </div>

      <div className="mb-6">
        <label htmlFor="month" className="block text-sm font-medium text-gray-700">
          {t('select.month')}
        </label>
        <input
          type="month"
          id="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">{t('no.scheduled.items')}</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredItems.map((item, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.employeeName}
                    </h3>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'extra_shift'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {t(item.type === 'extra_shift' ? 'extra.shift' : 'vacation')}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>{t('start.date')}: {item.startDate.toLocaleDateString()}</p>
                    {item.endDate && (
                      <p>{t('end.date')}: {item.endDate.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                {item.projectName && (
                  <div className="mt-2 text-sm text-gray-500">
                    {t('project')}: {item.projectName}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 