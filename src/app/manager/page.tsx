'use client';

import { useState, useEffect } from 'react';
import { notificationDate } from '@/lib/notifications';
import { requestTypeKey } from '@/lib/firebase/reports';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { getRequestsByManager, updateRequestStatus, createNotification, getDocuments } from '@/lib/firebase/firebaseUtils';
import { Request, User } from '@/lib/types';
import toast from 'react-hot-toast';
import { Check, CheckCircle2, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { TYPE_META } from '@/lib/requestTypeMeta';
import { countWorkdays } from '@/lib/workdays';
import { initialsOf } from '@/lib/initials';

export default function ManagerDashboard() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
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
      await updateRequestStatus(requestId, status, user.id);
      
      const request = requests.find(r => r.id === requestId);
      if (request) {
        const statusText = t(`status.${status}`).toLowerCase();
        await createNotification({
          userId: request.employeeId,
          title: t(`status.${status}`),
          message: t(`request.status.updated.${request.type}`).replace('{status}', statusText),
          relatedRequestId: requestId,
          kind: 'request_status',
          params: { type: request.type, status, date: notificationDate(request.startDate.toDate()) },
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
      <div className="max-w-3xl mx-auto space-y-3 animate-pulse">
        {[0, 1, 2].map((i) => <div key={i} className="h-44 rounded-3xl bg-slate-200/70" />)}
      </div>
    );
  }

  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar' : 'en-GB';
  const fmt = (d: Date) => d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-slate-500 mb-4">{t('review.manage.requests')}</p>

      {requests.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft ring-1 ring-slate-100">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="font-semibold text-slate-900">{t('no.pending.requests')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const employee = employees.get(request.employeeId);
            const name = employee?.displayName || (employee as any)?.name || employee?.email || t('unknown.employee');
            const meta = TYPE_META[request.type] || TYPE_META.extra_shift;
            const Icon = meta.icon;
            const start = request.startDate.toDate();
            const end = request.endDate?.toDate();
            const days = end ? countWorkdays(start, end) : null;
            const busy = processingId === request.id;
            return (
              <div key={request.id} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-100">
                <div className="flex items-start gap-3">
                  <span className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-brand-blue to-brand-navy text-white text-sm font-semibold flex items-center justify-center">
                    {initialsOf(name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-400">
                      {t('requested.on')} {request.createdAt.toDate().toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${meta.badge}`}>
                    <Icon className="h-4 w-4" />
                    {t(requestTypeKey(request.type))}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 text-sm space-y-1">
                  <p className="font-medium text-slate-900">
                    {end && end.toDateString() !== start.toDateString() ? `${fmt(start)} – ${fmt(end)}` : fmt(start)}
                    {days !== null && days > 0 && (
                      <span className="text-slate-500 font-normal">
                        {' · '}{days === 1 ? t('wizard.one.day') : t('wizard.n.days').replace('{n}', String(days))}
                      </span>
                    )}
                  </p>
                  {request.projectName && (
                    <p className="text-slate-600" dir="auto">{t('project')}: {request.projectName}</p>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(request.id, 'rejected')}
                    disabled={!!processingId}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3 font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    <X className="h-5 w-5" />
                    {t('reject')}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(request.id, 'approved')}
                    disabled={!!processingId}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                    {t('approve')}
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
