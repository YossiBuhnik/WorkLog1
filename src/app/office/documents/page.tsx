'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Check, ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Request, User } from '@/lib/types';
import AttachmentList from '@/components/AttachmentList';
import { countWorkdays, countCalendarDays } from '@/lib/workdays';
import {
  REPORT_TYPES,
  requestTypeKey,
  isMissingDocument,
  setReportDone,
  doneStatusFor,
} from '@/lib/firebase/reports';
import { formatAmount } from '@/lib/firebase/attachments';
import { TYPE_META, STATUS_META } from '@/lib/requestTypeMeta';

type StatusFilter = 'all' | 'missing' | 'open' | 'handled' | 'paid';

// Sick leave counts workdays (like vacation); reserve duty counts calendar days (like form 3010)
const reportDays = (report: Request) => {
  const start = report.startDate.toDate();
  const end = (report.endDate || report.startDate).toDate();
  return report.type === 'reserve' ? countCalendarDays(start, end) : countWorkdays(start, end);
};

export default function OfficeDocuments() {
  const router = useRouter();
  const { user, loading, hasRole } = useAuth();
  const { t } = useTranslation();

  const [reports, setReports] = useState<Request[]>([]);
  const [users, setUsers] = useState<Map<string, User & { name?: string }>>(new Map());
  const [loadingData, setLoadingData] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | 'all'>(now.getMonth());
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!hasRole('office')) {
      router.push('/');
    }
  }, [loading, user, hasRole, router]);

  useEffect(() => {
    if (!user || !hasRole('office')) return;
    const load = async () => {
      try {
        const [reportsSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'requests'), where('type', 'in', REPORT_TYPES))),
          getDocs(collection(db, 'users')),
        ]);
        setReports(reportsSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as Request));
        setUsers(new Map(usersSnap.docs.map((d) => [d.id, { ...d.data(), id: d.id } as User & { name?: string }])));
      } catch (error) {
        console.error('Error loading reports:', error);
        toast.error(t('error.loading.requests'));
      } finally {
        setLoadingData(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const employeeName = (id: string) => {
    const u = users.get(id);
    return u?.displayName || u?.name || u?.email || t('unknown.employee');
  };

  const years = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    reports.forEach((r) => set.add(r.startDate.toDate().getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  const employeesWithReports = useMemo(
    () => Array.from(new Set(reports.map((r) => r.employeeId))),
    [reports]
  );

  const filtered = useMemo(() => {
    const rangeStart = month === 'all' ? new Date(year, 0, 1) : new Date(year, month, 1);
    const rangeEnd = month === 'all'
      ? new Date(year, 11, 31, 23, 59, 59, 999)
      : new Date(year, month + 1, 0, 23, 59, 59, 999);

    return reports
      .filter((r) => r.status !== 'cancelled')
      .filter((r) => {
        const start = r.startDate.toDate();
        const end = (r.endDate || r.startDate).toDate();
        return start <= rangeEnd && end >= rangeStart;
      })
      .filter((r) => typeFilter === 'all' || r.type === typeFilter)
      .filter((r) => employeeFilter === 'all' || r.employeeId === employeeFilter)
      .filter((r) => {
        if (statusFilter === 'missing') return isMissingDocument(r);
        if (statusFilter === 'open') return r.status === 'submitted';
        if (statusFilter === 'handled') return r.status === 'handled';
        if (statusFilter === 'paid') return r.status === 'paid';
        return true;
      })
      .sort((a, b) => b.startDate.seconds - a.startDate.seconds);
  }, [reports, year, month, typeFilter, employeeFilter, statusFilter]);

  const toggleDone = async (report: Request) => {
    if (!user) return;
    const done = report.status === 'submitted';
    setUpdatingId(report.id);
    try {
      await setReportDone(report, done, user.id);
      setReports((list) => list.map((r) => (r.id === report.id ? { ...r, status: done ? doneStatusFor(r.type) : 'submitted' } : r)));
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error(t('report.update.failed'));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="h-12 rounded-xl bg-slate-200/70" />
        <div className="h-96 rounded-3xl bg-slate-200/70" />
      </div>
    );
  }

  const months = [
    t('month.january'), t('month.february'), t('month.march'), t('month.april'),
    t('month.may'), t('month.june'), t('month.july'), t('month.august'),
    t('month.september'), t('month.october'), t('month.november'), t('month.december'),
  ];
  const fmt = (d: Date) => d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <p className="text-slate-500">{t('office.documents.subtitle')}</p>

      <div className="flex flex-wrap gap-2">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="select-input">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="select-input"
        >
          <option value="all">{t('full.year')}</option>
          {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select-input">
          <option value="all">{t('filter.all.types')}</option>
          {REPORT_TYPES.map((type) => <option key={type} value={type}>{t(requestTypeKey(type))}</option>)}
        </select>
        <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="select-input">
          <option value="all">{t('filter.all.employees')}</option>
          {employeesWithReports.map((id) => <option key={id} value={id}>{employeeName(id)}</option>)}
        </select>
      </div>

      {/* Quick status filter */}
      <div className="flex flex-wrap gap-1.5">
        {([
          ['all', t('filter.all.statuses')],
          ['missing', t('missing.document')],
          ['open', t('status.submitted')],
          ['handled', t('status.handled')],
          ['paid', t('status.paid')],
        ] as [StatusFilter, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
              statusFilter === value
                ? value === 'missing' ? 'bg-amber-500 text-white ring-amber-500' : 'bg-brand-navy text-white ring-brand-navy'
                : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="p-10 text-center text-slate-500">{t('office.documents.empty')}</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th">{t('employee.name')}</th>
                <th className="th">{t('request.type')}</th>
                <th className="th">{t('dates')}</th>
                <th className="th">{t('days')}</th>
                <th className="th">{t('petty.cash.amount')}</th>
                <th className="th">{t('status')}</th>
                <th className="th">{t('documents')}</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((report) => {
                const expanded = expandedId === report.id;
                const meta = TYPE_META[report.type] || TYPE_META.sick;
                const status = STATUS_META[report.status] || STATUS_META.submitted;
                const Icon = meta.icon;
                const StatusIcon = status.icon;
                return (
                  <Fragment key={report.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${expanded ? 'bg-brand-blue-light/40' : 'hover:bg-slate-50/60'}`}
                      onClick={() => setExpandedId(expanded ? null : report.id)}
                    >
                      <td className="td font-medium text-slate-900" dir="auto">{employeeName(report.employeeId)}</td>
                      <td className="td">
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${meta.badge}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          {t(requestTypeKey(report.type))}
                        </span>
                      </td>
                      <td className="td whitespace-nowrap">
                        {fmt(report.startDate.toDate())}
                        {report.endDate && report.endDate.toDate().toDateString() !== report.startDate.toDate().toDateString() && (
                          <> – {fmt(report.endDate.toDate())}</>
                        )}
                      </td>
                      <td className="td">{report.type === 'petty_cash' ? <span className="text-slate-300">—</span> : reportDays(report)}</td>
                      <td className="td whitespace-nowrap font-medium">
                        {report.type === 'petty_cash' ? formatAmount(report.totalAmount || 0) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="td">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${status.pill}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {t(`status.${report.status}`)}
                        </span>
                      </td>
                      <td className="td">
                        {isMissingDocument(report) ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 bg-amber-50 text-amber-800 ring-amber-200">
                            <Paperclip className="h-3.5 w-3.5" />
                            {t('missing.document')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                            {report.attachmentCount}
                          </span>
                        )}
                      </td>
                      <td className="td text-end">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue">
                          {t('details')}
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-brand-blue-light/20">
                        <td colSpan={8} className="px-4 py-5">
                          <div className="max-w-2xl space-y-4">
                            {report.type === 'petty_cash' && (
                              <div className="text-sm text-slate-700 space-y-1">
                                <p dir="auto"><span className="text-slate-500">{t('petty.cash.description')}:</span> {report.description}</p>
                                {report.projectName && <p dir="auto"><span className="text-slate-500">{t('project')}:</span> {report.projectName}</p>}
                              </div>
                            )}
                            <AttachmentList requestId={report.id} />
                            <button
                              onClick={() => toggleDone(report)}
                              disabled={updatingId === report.id}
                              className={report.status !== 'submitted' ? 'btn-soft' : 'inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50'}
                            >
                              {report.status === 'submitted' && <Check className="h-4 w-4" />}
                              {report.status !== 'submitted'
                                ? t('report.reopen')
                                : t(report.type === 'petty_cash' ? 'petty.cash.mark.paid' : 'report.mark.handled')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
