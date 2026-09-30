'use client';

import { useState, useEffect } from 'react';
import { requestTypeKey } from '@/lib/firebase/reports';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, getDocs, where, orderBy, limit, and, onSnapshot, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Request, User } from '@/lib/types';
import toast from 'react-hot-toast';
import { CalendarDays, Users, Clock, CheckCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { TYPE_META, STATUS_META } from '@/lib/requestTypeMeta';

interface DashboardStats {
  totalEmployees: number;
  activeRequests: number;
  approvedExtraShiftsThisMonth: number;
}

export default function OfficeDashboard() {
  const router = useRouter();
  const { user, loading, hasRole } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeRequests: 0,
    approvedExtraShiftsThisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Array<Request & { employeeName?: string | null; approvedByName?: string | null }>>([]);
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
    const unsubscribeActivity = onSnapshot(requestsQuery, async (snapshot) => {
      const activity = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as Request));

      const userIds = new Set<string>();
      activity.forEach(req => {
        userIds.add(req.employeeId);
        if (req.approvedBy) userIds.add(req.approvedBy);
      });

      const usersMap = new Map<string, User>();
      if (userIds.size > 0) {
        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', Array.from(userIds)));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => {
          usersMap.set(doc.id, { ...doc.data(), id: doc.id } as User);
        });
      }
      
      const enhancedActivity = activity.map(req => ({
        ...req,
        employeeName: usersMap.get(req.employeeId)?.displayName || null,
        approvedByName: usersMap.get(req.approvedBy || '')?.displayName || null,
      }));

      setRecentActivity(enhancedActivity);
      
      const approvedExtraShifts = enhancedActivity.filter(req => 
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
        const employeesSnapshot = await getDocs(query(
          collection(db, 'users'),
          where('roles', 'array-contains', 'employee')
        ));
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
      <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-3xl bg-slate-200/70" />)}
        </div>
        <div className="h-80 rounded-3xl bg-slate-200/70" />
      </div>
    );
  }

  const months = [
    t('month.january'), t('month.february'), t('month.march'), t('month.april'),
    t('month.may'), t('month.june'), t('month.july'), t('month.august'),
    t('month.september'), t('month.october'), t('month.november'), t('month.december')
  ];
  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar' : 'en-GB';
  const fmt = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  const cards = [
    { icon: Users, value: stats.totalEmployees, label: t('total.employees'), badge: 'bg-brand-blue-light text-brand-navy' },
    { icon: Clock, value: stats.activeRequests, label: t('active.requests'), badge: 'bg-amber-50 text-amber-700' },
    { icon: CheckCircle, value: stats.approvedExtraShiftsThisMonth, label: t('approved.extra.shifts'), badge: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-500">{t('dashboard.overview')}</p>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="select-input"
          aria-label={t('select.month')}
        >
          {months.map((month, index) => (
            <option key={index} value={index}>{month}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="panel p-5 flex items-center gap-4">
              <span className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center ${c.badge}`}>
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-3xl font-bold text-slate-900 leading-none">{c.value}</p>
                <p className="mt-1 text-sm text-slate-500">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel overflow-hidden">
        <h2 className="px-5 sm:px-6 pt-5 pb-3 text-lg font-semibold text-slate-900">
          {t('recent.activity')} · {months[selectedMonth]}
        </h2>
        {recentActivity.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {recentActivity.map((request) => {
              const meta = TYPE_META[request.type] || TYPE_META.extra_shift;
              const status = STATUS_META[request.status] || STATUS_META.pending;
              const Icon = meta.icon;
              const StatusIcon = status.icon;
              const start = request.startDate.toDate();
              const end = request.endDate?.toDate();
              return (
                <li key={request.id} className="px-5 sm:px-6 py-3.5 flex items-center gap-3">
                  <span className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${meta.badge}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {request.employeeName || t('unknown.employee')}
                      <span className="text-slate-400 font-normal"> · {t(requestTypeKey(request.type))}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {end && end.toDateString() !== start.toDateString() ? `${fmt(start)} – ${fmt(end)}` : fmt(start)}
                      {request.status === 'approved' && request.approvedByName && (
                        <span> · {t('office.approved.by').replace('{name}', request.approvedByName)}</span>
                      )}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${status.pill}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {t(`status.${request.status}`)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-6 py-10 text-center text-slate-500">{t('no.activity.month')}</p>
        )}
      </div>
    </div>
  );
}
