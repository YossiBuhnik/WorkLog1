'use client';

import { useState, useEffect } from 'react';
import { requestTypeKey } from '@/lib/firebase/reports';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Request, User, RequestType } from '@/lib/types';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { TYPE_META } from '@/lib/requestTypeMeta';

interface ScheduleItem {
  employeeId: string;
  employeeName: string;
  type: RequestType;
  startDate: Date;
  endDate?: Date;
  projectName?: string;
}

export default function Schedule() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
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
        // Approved requests of all employees (every manager sees everyone), plus sick / reserve
        // reports so the manager knows who is absent. Petty cash is office-only.
        const requestsRef = collection(db, 'requests');
        const requestsQuery = query(
          requestsRef,
          where('status', 'in', ['approved', 'submitted', 'handled'])
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs
          .map(doc => doc.data() as Request)
          .filter(request => request.type !== 'petty_cash');

        // Get all employees
        const employeesRef = collection(db, 'users');
        const employeesSnapshot = await getDocs(employeesRef);
        const employees = new Map(
          employeesSnapshot.docs.map(doc => [doc.id, doc.data() as User])
        );

        // Combine requests with employee names
        const schedule = requests.map(request => ({
          employeeId: request.employeeId,
          employeeName: employees.get(request.employeeId)?.displayName || (employees.get(request.employeeId) as any)?.name || t('unknown.employee'),
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
      <div className="max-w-3xl mx-auto space-y-3 animate-pulse">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-200/70" />)}
      </div>
    );
  }

  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar' : 'en-GB';
  const fmt = (d: Date) => d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  const sorted = [...filteredItems].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-500">{t('view.approved.schedule')}</p>
        <input
          type="month"
          id="month"
          aria-label={t('select.month')}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="select-input"
        />
      </div>

      {sorted.length === 0 ? (
        <div className="panel p-10 text-center text-slate-500">{t('no.scheduled.items')}</div>
      ) : (
        <ul className="panel divide-y divide-slate-100 overflow-hidden">
          {sorted.map((item, index) => {
            const meta = TYPE_META[item.type] || TYPE_META.extra_shift;
            const Icon = meta.icon;
            return (
              <li key={index} className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
                <span className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${meta.badge}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {item.employeeName}
                    <span className="text-slate-400 font-normal"> · {t(requestTypeKey(item.type))}</span>
                  </p>
                  {item.projectName && <p className="text-sm text-slate-500 truncate" dir="auto">{item.projectName}</p>}
                </div>
                <p className="shrink-0 text-sm font-medium text-slate-700 text-end">
                  {fmt(item.startDate)}
                  {item.endDate && item.endDate.toDateString() !== item.startDate.toDateString() && (
                    <span className="block text-xs font-normal text-slate-500">– {fmt(item.endDate)}</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
