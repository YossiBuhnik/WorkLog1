'use client';

import { useState, useEffect, useMemo } from 'react';
import { canSubmitRequests } from '@/lib/roles';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getRequestsByEmployee, cancelRequest } from '@/lib/firebase/firebaseUtils';
import { Request } from '@/lib/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AlertTriangle, ChevronLeft, ChevronRight, Paperclip, Upload } from 'lucide-react';
import { requestTypeKey, isReportType, isMissingDocument } from '@/lib/firebase/reports';
import { formatAmount } from '@/lib/firebase/attachments';
import { getVacationQuota, usedVacationDays } from '@/lib/firebase/vacationQuotas';
import { TYPE_META, TYPE_ORDER, STATUS_META } from '@/lib/requestTypeMeta';

type Filter = 'all' | 'open' | 'done';

const localeOf = (language: string) => (language === 'he' ? 'he-IL' : language === 'ar' ? 'ar' : 'en-GB');

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'greeting.morning';
  if (h < 17) return 'greeting.afternoon';
  return 'greeting.evening';
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { language, dir } = useLanguage();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [vacationQuota, setVacationQuota] = useState<number | null>(null);
  const locale = localeOf(language);
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!canSubmitRequests(user.roles)) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (user) {
        try {
          const userRequests = await getRequestsByEmployee(user.id);
          setRequests(userRequests);
          // The quota is optional (set by the office); without it the page shows used days
          getVacationQuota(user.id, new Date().getFullYear()).then(setVacationQuota).catch(() => setVacationQuota(null));
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

  const stats = useMemo(() => {
    const now = new Date();
    const waiting = requests.filter((r) => r.status === 'pending').length;
    const shiftsThisMonth = requests.filter((r) => {
      if (r.type !== 'extra_shift' || r.status !== 'approved') return false;
      const d = r.startDate.toDate();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    const vacationDays = user ? usedVacationDays(requests, user.id, now.getFullYear()) : 0;
    return { waiting, shiftsThisMonth, vacationDays };
  }, [requests, user]);

  const missingDocs = requests.filter((r) => isMissingDocument(r));
  const shown = requests.filter((r) => {
    if (filter === 'all') return true;
    const open = STATUS_META[r.status]?.open;
    return filter === 'open' ? open : !open;
  });

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm(t('home.confirm.cancel'))) return;
    try {
      await cancelRequest(requestId);
      setRequests(requests.map((request) =>
        request.id === requestId ? { ...request, status: 'cancelled' } : request
      ));
      toast.success(t('request.cancelled'));
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error instanceof Error ? error.message : t('error.cancelling.request'));
    }
  };

  const fmt = (d: Date) => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString(locale, opts);
  };
  const dateRange = (r: Request) => {
    const start = r.startDate.toDate();
    const end = r.endDate?.toDate();
    if (!end || end.toDateString() === start.toDateString()) return fmt(start);
    return `${fmt(start)} – ${fmt(end)}`;
  };

  const firstName = (user?.displayName || (user as any)?.name || '').split(' ')[0];
  const today = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading || loadingRequests) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-44 rounded-3xl bg-slate-200/70" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-200/70" />)}
        </div>
        <div className="h-20 rounded-2xl bg-slate-200/70" />
        <div className="h-20 rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Greeting + personal numbers */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#2C5C8F] to-brand-blue text-white p-6 sm:p-7 shadow-lg shadow-brand-navy/20">
        <svg className="pointer-events-none absolute -top-10 -start-16 w-[130%] opacity-[0.12]" viewBox="0 0 600 220" fill="none" aria-hidden>
          <ellipse cx="300" cy="110" rx="290" ry="70" transform="rotate(-8 300 110)" stroke="white" strokeWidth="14" />
          <path d="M360 10 L250 210" stroke="white" strokeWidth="40" />
          <path d="M420 10 L330 210" stroke="white" strokeWidth="26" />
        </svg>
        <div className="relative">
          <p className="text-sm text-white/70">{today}</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">
            {t(greetingKey())}{firstName ? `, ${firstName}` : ''}
          </h1>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { value: stats.waiting, label: t('home.stat.waiting') },
              { value: stats.shiftsThisMonth, label: t('home.stat.shifts.month') },
              vacationQuota !== null
                ? {
                    value: Math.max(0, Math.round((vacationQuota - stats.vacationDays) * 10) / 10),
                    label: t('home.stat.vacation.left'),
                    sub: t('home.stat.of.quota').replace('{n}', String(vacationQuota)),
                  }
                : { value: stats.vacationDays, label: t('home.stat.vacation.year') },
            ].map((s: { value: number; label: string; sub?: string }) => (
              <div key={s.label} className="rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-3 py-3">
                <p className="text-2xl sm:text-3xl font-bold leading-none">
                  {s.value}
                  {s.sub && <span className="ms-1 text-xs font-normal text-white/70">{s.sub}</span>}
                </p>
                <p className="mt-1.5 text-[11px] sm:text-xs leading-tight text-white/80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Things the employee must fix */}
      {missingDocs.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            {t('home.needs.attention')}
          </h2>
          {missingDocs.map((r) => (
            <Link
              key={r.id}
              href={`/employee/reports/${r.id}`}
              className="flex items-center gap-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 hover:bg-amber-100/70 transition-colors"
            >
              <span className="h-11 w-11 shrink-0 rounded-xl bg-white text-amber-600 flex items-center justify-center ring-1 ring-amber-200">
                <Paperclip className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">
                  {t(requestTypeKey(r.type))} · {dateRange(r)}
                </p>
                <p className="text-sm text-amber-900/80">{t('home.missing.doc.text')}</p>
              </div>
              <span className="hidden sm:flex items-center gap-1.5 rounded-xl bg-amber-500 text-white text-sm font-medium px-3.5 py-2">
                <Upload className="h-4 w-4" />
                {t('home.upload.now')}
              </span>
              <Chevron className="sm:hidden h-5 w-5 text-amber-600" />
            </Link>
          ))}
        </section>
      )}

      {/* One tap to start any request */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">{t('home.what.today')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {TYPE_ORDER.map((type) => {
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            return (
              <Link
                key={type}
                href={`/employee/new-request?type=${type}`}
                className={`group rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-100 hover:ring-brand-blue/40 hover:-translate-y-0.5 transition-all
                  ${type === 'petty_cash' ? 'col-span-2 sm:col-span-1 flex sm:block items-center gap-3' : ''}`}
              >
                <span className={`h-12 w-12 rounded-2xl flex items-center justify-center ${meta.badge} group-hover:scale-105 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="block sm:mt-3">
                  <span className={`block font-semibold text-slate-900 ${type === 'petty_cash' ? '' : 'mt-3 sm:mt-0'}`}>{t(requestTypeKey(type))}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{t(`tile.${type}.hint`)}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* History */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-slate-900">{t('home.history')}</h2>
          {requests.length > 0 && (
            <div className="flex rounded-xl bg-slate-200/60 p-1 text-sm">
              {(['all', 'open', 'done'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t(`home.filter.${f}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl bg-white ring-1 ring-slate-100 p-10 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-blue-light text-brand-navy flex items-center justify-center mb-3">
              <Paperclip className="h-6 w-6" />
            </div>
            <p className="font-semibold text-slate-900">{t('home.empty.title')}</p>
            <p className="text-sm text-slate-500 mt-1">{t('home.empty.text')}</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {shown.map((request) => {
              const meta = TYPE_META[request.type] || TYPE_META.extra_shift;
              const status = STATUS_META[request.status] || STATUS_META.pending;
              const Icon = meta.icon;
              const StatusIcon = status.icon;
              const isReport = isReportType(request.type);
              const canCancel = !isReport && request.status !== 'cancelled' && request.startDate.toDate() > new Date();
              const detail = request.type === 'petty_cash'
                ? `${request.description || ''} · ${formatAmount(request.totalAmount || 0)}`
                : request.projectName;

              const body = (
                <div className="flex items-start gap-3">
                  <span className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${meta.badge}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{t(requestTypeKey(request.type))}</p>
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${status.pill}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {t(status.longKey && language !== 'en' ? status.longKey : `status.${request.status}`)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{dateRange(request)}</p>
                    {detail && <p className="text-sm text-slate-500 truncate" dir="auto">{detail}</p>}
                    {(isReport || canCancel) && (
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        {isReport && (
                          <span className="inline-flex items-center gap-1 font-medium text-brand-blue">
                            {t('home.open.details')}
                            <Chevron className="h-4 w-4" />
                          </span>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="font-medium text-slate-500 hover:text-red-600"
                          >
                            {t('cancel.request')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );

              return (
                <li key={request.id}>
                  {isReport ? (
                    <Link
                      href={`/employee/reports/${request.id}`}
                      className="block rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-100 hover:ring-brand-blue/40 transition"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className={`rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-100 ${request.status === 'cancelled' ? 'opacity-60' : ''}`}>
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
