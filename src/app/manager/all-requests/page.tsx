'use client';

import { useState, useEffect } from 'react';
import { requestTypeKey } from '@/lib/firebase/reports';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Request } from '@/lib/types';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { TYPE_META, STATUS_META } from '@/lib/requestTypeMeta';

export default function AllRequests() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [names, setNames] = useState<Map<string, string>>(new Map());
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
        // All requests of all employees - every manager can see and approve any request
        let q = query(
          requestsRef,
          orderBy('createdAt', 'desc')
        );

        const [querySnapshot, usersSnapshot] = await Promise.all([getDocs(q), getDocs(collection(db, 'users'))]);
        setNames(new Map(usersSnapshot.docs.map((d) => [d.id, (d.data().displayName || d.data().name || d.data().email) as string])));
        console.log('Fetched requests count:', querySnapshot.docs.length);
        
        const fetchedRequests = querySnapshot.docs.filter(doc => doc.data().type !== 'petty_cash').map(doc => {
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
      <div className="max-w-3xl mx-auto space-y-3 animate-pulse">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-200/70" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
        <h3 className="font-semibold text-red-800">{t('error.loading.requests.title')}</h3>
        <p className="mt-1 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar' : 'en-GB';
  const fmt = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <p className="text-slate-500">{t('view.requests.history')}</p>

      <div className="flex flex-wrap gap-1.5">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
              filter === value ? 'bg-brand-navy text-white ring-brand-navy' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'
            }`}
          >
            {value === 'all' ? t('all.requests') : t(`status.${value}`)}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="panel p-10 text-center text-slate-500">{t('no.requests.found')}</div>
      ) : (
        <ul className="panel divide-y divide-slate-100 overflow-hidden">
          {filteredRequests.map((request) => {
            const meta = TYPE_META[request.type] || TYPE_META.extra_shift;
            const status = STATUS_META[request.status] || STATUS_META.pending;
            const Icon = meta.icon;
            const StatusIcon = status.icon;
            const start = request.startDate.toDate();
            const end = request.endDate?.toDate();
            return (
              <li key={request.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
                <span className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${meta.badge}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {names.get(request.employeeId) || t('unknown.employee')}
                    <span className="text-slate-400 font-normal"> · {t(requestTypeKey(request.type))}</span>
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {end && end.toDateString() !== start.toDateString() ? `${fmt(start)} – ${fmt(end)}` : fmt(start)}
                    {request.projectName && <span dir="auto"> · {request.projectName}</span>}
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
      )}
    </div>
  );
}
