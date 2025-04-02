'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, getDocs, where, orderBy, limit, and, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Request, User } from '@/lib/types';
import toast from 'react-hot-toast';
import { CalendarDays, Users, Clock, CheckCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface DashboardStats {
  totalEmployees: number;
  activeRequests: number;
  approvedExtraShiftsThisMonth: number;
}

export default function OfficeDashboard() {
  const router = useRouter();
  const { user, loading, hasRole } = useAuth();
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeRequests: 0,
    approvedExtraShiftsThisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Request[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [managers, setManagers] = useState<Map<string, User>>(new Map());
  const [employees, setEmployees] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading && !hasRole('office')) {
      router.push('/');
      return;
    }
  }, [user, loading, hasRole, router]);

  useEffect(() => {
    if (!user || !hasRole('office')) {
      return;
    }

    // Set up real-time listeners
    const requestsQuery = query(
      collection(db, 'requests'),
      and(
        where('createdAt', '>=', Timestamp.fromDate(new Date(new Date().getFullYear(), selectedMonth, 1))),
        where('createdAt', '<', Timestamp.fromDate(new Date(new Date().getFullYear(), selectedMonth + 1, 1)))
      ),
      orderBy('createdAt', 'desc')
    );

    const activeRequestsQuery = query(
      collection(db, 'requests'),
      and(
        where('status', '==', 'pending'),
        where('status', '!=', 'cancelled')
      )
    );

    // Subscribe to real-time updates
    const unsubscribeActivity = onSnapshot(requestsQuery, (snapshot) => {
      const activity = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as Request));
      setRecentActivity(activity);
      
      // Count approved extra shifts from the activity data
      const approvedExtraShifts = activity.filter(req => 
        req.type === 'extra_shift' && req.status === 'approved'
      ).length;
      
      setStats(prev => ({
        ...prev,
        approvedExtraShiftsThisMonth: approvedExtraShifts
      }));
    }, (error) => {
      console.error('Error in real-time activity updates:', error);
    });

    const unsubscribeActiveRequests = onSnapshot(activeRequestsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        activeRequests: snapshot.docs.length
      }));
    }, (error) => {
      console.error('Error in real-time active requests updates:', error);
    });

    // Fetch initial employees and managers data
    const fetchInitialData = async () => {
      try {
        const [employeesSnapshot, managersSnapshot] = await Promise.all([
          getDocs(query(
            collection(db, 'users'),
            where('roles', 'array-contains', 'employee')
          )),
          getDocs(query(
            collection(db, 'users'),
            where('roles', 'array-contains', 'manager')
          ))
        ]);

        const employeesMap = new Map(
          employeesSnapshot.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as User])
        );
        setEmployees(employeesMap);

        const managersMap = new Map(
          managersSnapshot.docs.map(doc => [doc.id, { ...doc.data(), id: doc.id } as User])
        );
        setManagers(managersMap);

        setStats(prev => ({
          ...prev,
          totalEmployees: employeesSnapshot.docs.length
        }));
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load some dashboard data');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchInitialData();

    // Cleanup subscriptions
    return () => {
      unsubscribeActivity();
      unsubscribeActiveRequests();
    };
  }, [user, hasRole, selectedMonth]);

  if (loading || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const months = [
    t('month.january'), t('month.february'), t('month.march'), t('month.april'),
    t('month.may'), t('month.june'), t('month.july'), t('month.august'),
    t('month.september'), t('month.october'), t('month.november'), t('month.december')
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('office.dashboard')}</h1>
        <p className="text-gray-500">{t('dashboard.overview')}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('total.employees')}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.totalEmployees}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('active.requests')}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.activeRequests}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center justify-between">
                    <span>{t('approved.extra.shifts')}</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="ml-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    >
                      {months.map((month, index) => (
                        <option key={month} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stats.approvedExtraShiftsThisMonth}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {t('recent.activity')} - {months[selectedMonth]}
        </h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {recentActivity.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">
                        {t(activity.type === 'extra_shift' ? 'extra.shift' : 'vacation')} {t('request')}
                        {activity.employeeId && employees.get(activity.employeeId) && 
                          ` ${t('by')} ${employees.get(activity.employeeId)?.name}`
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('status')}: {
                          activity.managerId && managers.get(activity.managerId)
                            ? `${t(activity.status)} ${t('by')} ${managers.get(activity.managerId)?.name}`
                            : t(activity.status)
                        }
                      </p>
                      {activity.type === 'extra_shift' && activity.startDate && (
                        <p className="text-sm text-gray-500">
                          {t('shift.date')}: {activity.startDate.toDate().toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>{t('request.date')}: {activity.createdAt.toDate().toLocaleDateString()}</p>
                      {activity.status !== 'pending' && activity.updatedAt && (
                        <p>{t(activity.status)}: {activity.updatedAt.toDate().toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              {t('no.results')} {months[selectedMonth]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 