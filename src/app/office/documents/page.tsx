'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const months = [
    t('month.january'), t('month.february'), t('month.march'), t('month.april'),
    t('month.may'), t('month.june'), t('month.july'), t('month.august'),
    t('month.september'), t('month.october'), t('month.november'), t('month.december'),
  ];
  const selectClass = 'rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('office.documents.title')}</h1>
        <p className="text-gray-500">{t('office.documents.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className={selectClass}
        >
          <option value="all">{t('full.year')}</option>
          {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
          <option value="all">{t('filter.all.types')}</option>
          {REPORT_TYPES.map((type) => <option key={type} value={type}>{t(requestTypeKey(type))}</option>)}
        </select>
        <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className={selectClass}>
          <option value="all">{t('filter.all.employees')}</option>
          {employeesWithReports.map((id) => <option key={id} value={id}>{employeeName(id)}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClass}>
          <option value="all">{t('filter.all.statuses')}</option>
          <option value="missing">{t('missing.document')}</option>
          <option value="open">{t('status.submitted')}</option>
          <option value="handled">{t('status.handled')}</option>
          <option value="paid">{t('status.paid')}</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-500">{t('office.documents.empty')}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-gray-500">{t('employee.name')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">{t('request.type')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">{t('dates')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">{t('days')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">{t('petty.cash.amount')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">{t('status')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-500">{t('documents')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((report) => {
                const expanded = expandedId === report.id;
                return (
                  <Fragment key={report.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900" dir="auto">{employeeName(report.employeeId)}</td>
                      <td className="px-4 py-3">{t(requestTypeKey(report.type))}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {report.startDate.toDate().toLocaleDateString('he-IL')}
                        {report.endDate && (
                          <>
                            {' - '}
                            {report.endDate.toDate().toLocaleDateString('he-IL')}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">{report.type === 'petty_cash' ? '—' : reportDays(report)}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {report.type === 'petty_cash' ? formatAmount(report.totalAmount || 0) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {t(`status.${report.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isMissingDocument(report) ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {t('missing.document')}
                          </span>
                        ) : (
                          report.attachmentCount
                        )}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => setExpandedId(expanded ? null : report.id)}
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
                        >
                          {t('details')}
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="max-w-2xl space-y-4">
                            {report.type === 'petty_cash' && (
                              <div className="text-sm text-gray-700 space-y-1">
                                <p dir="auto">{t('petty.cash.description')}: {report.description}</p>
                                {report.projectName && <p dir="auto">{t('project')}: {report.projectName}</p>}
                              </div>
                            )}
                            <AttachmentList requestId={report.id} />
                            <button
                              onClick={() => toggleDone(report)}
                              disabled={updatingId === report.id}
                              className={`px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 ${
                                report.status !== 'submitted'
                                  ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                  : 'text-white bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
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
