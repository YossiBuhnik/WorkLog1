'use client';

import { useState, useEffect, useCallback } from 'react';
import { canSubmitRequests } from '@/lib/roles';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Request, User } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { countWorkdays, countCalendarDays } from '@/lib/workdays';
import { requestTypeKey, isMissingDocument } from '@/lib/firebase/reports';
import { formatAmount } from '@/lib/firebase/attachments';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { SummaryRow, DetailRow } from '@/lib/excelReport';
import { getVacationQuotasForYear, usedVacationDays } from '@/lib/firebase/vacationQuotas';

interface EmployeeStats {
  id: string;
  name: string;
  totalRequests: number;
  extraShifts: {
    total: number;
    approved: number;
    rejected: number;
  };
  vacations: {
    total: number;
    approved: number;
    rejected: number;
  };
  sickDays: number;
  reserveDays: number;
  pettyCashTotal: number;
  pettyCashUnpaid: number;
  missingDocuments: number;
  // Vacation days left in the selected year (null when the office set no quota)
  vacationLeft: number | null;
}

type RequestStats = {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  requestsByType: Record<string, number>;
  requestsByMonth: Array<{
    month: string;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  employeeStats: EmployeeStats[];
  // For the Excel "details" sheet: every non-cancelled request in the period
  periodRequests: Request[];
  userNames: Record<string, string>;
  dateFilter: { start: Date; end: Date };
};

export default function Reports() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11 for Jan-Dec
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [selectedView, setSelectedView] = useState<'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'trends' | 'employees'>('employees');

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [requestsSnapshot, usersSnapshot, quotas] = await Promise.all([
        getDocs(collection(db, 'requests')),
        getDocs(collection(db, 'users')),
        getVacationQuotasForYear(selectedYear).catch(() => new Map<string, number>()),
      ]);

      // Workday / holiday calculation lives in src/lib/workdays.ts

      // Convert snapshots to typed arrays
      const requests = requestsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Request[];

      const users = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as User[];

      // Years that have data (for the year selector), always including the current year
      const yearsWithData = new Set<number>([new Date().getFullYear()]);
      requests.forEach(r => {
        const start = r.startDate?.toDate?.();
        if (start) yearsWithData.add(start.getFullYear());
      });
      setAvailableYears(Array.from(yearsWithData).sort((a, b) => b - a));

      // Define date range for filtering based on selected month/year
      const year = selectedYear;
      const rangeStart = selectedView === 'month'
        ? new Date(year, selectedMonth, 1, 0, 0, 0, 0)
        : new Date(year, 0, 1, 0, 0, 0, 0);
      const rangeEnd = selectedView === 'month'
        ? new Date(year, selectedMonth + 1, 0, 23, 59, 59, 999)
        : new Date(year, 11, 31, 23, 59, 59, 999);
      const dateFilter = { start: rangeStart, end: rangeEnd };

      const overlapsRange = (request: Request) => {
        const start = request.startDate?.toDate?.();
        const end = request.endDate?.toDate?.() || start;
        if (!start) return false;
        return start <= rangeEnd && end >= rangeStart;
      };

      // Filter requests for top-level stats
      const filteredRequests = requests.filter(overlapsRange);

      // Calculate basic stats
      const totalRequests = filteredRequests.filter(r => r.status !== 'cancelled').length;
      const approvedRequests = filteredRequests.filter(r => r.status === 'approved').length;
      const rejectedRequests = filteredRequests.filter(r => r.status === 'rejected').length;
      const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length;

      // Calculate requests by type
      const requestsByType = filteredRequests
        .filter(r => r.status !== 'cancelled')
        .reduce((acc: Record<string, number>, request) => {
          acc[request.type] = (acc[request.type] || 0) + 1;
          return acc;
        }, {});

      // Calculate requests by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const requestsByMonth = months.map(month => ({
        month,
        approved: filteredRequests.filter(r => 
          r.startDate?.toDate?.()?.getMonth() === months.indexOf(month) && 
          r.status === 'approved'
        ).length,
        rejected: filteredRequests.filter(r => 
          r.startDate?.toDate?.()?.getMonth() === months.indexOf(month) && 
          r.status === 'rejected'
        ).length,
        pending: filteredRequests.filter(r => 
          r.startDate?.toDate?.()?.getMonth() === months.indexOf(month) && 
          r.status === 'pending'
        ).length,
      }));

      // Calculate employee stats
      const employeeStats: EmployeeStats[] = await Promise.all(users
        .filter(u => canSubmitRequests(u.roles))
        .map(async (employee) => {
          // Get all requests for the employee, not yet filtered by date
          const employeeRequests = requests.filter(r => r.employeeId === employee.id && r.status !== 'cancelled');

          // Apply the monthly date filter for stats like extra shifts
          const monthlyFilteredRequests = employeeRequests.filter(overlapsRange);
          
          const monthlyExtraShiftRequests = monthlyFilteredRequests.filter(r => r.type === 'extra_shift');
          const vacationRequests = employeeRequests.filter(r => r.type === 'vacation' && overlapsRange(r));

          const calculateDays = (requestsToCalc: Request[]) => {
            return requestsToCalc.reduce((total, request) => {
              if (request.endDate && request.startDate) {
                const start = request.startDate.toDate();
                const end = request.endDate.toDate();
                const days = countWorkdays(start, end, dateFilter);
                return total + days;
              }
              return total;
            }, 0);
          };

          const totalVacationDays = calculateDays(vacationRequests.filter(r => r.status === 'approved'));

          // Sick leave counts workdays (like vacation); reserve duty counts calendar days (like form 3010)
          const sickDays = monthlyFilteredRequests
            .filter(r => r.type === 'sick')
            .reduce((sum, r) => sum + countWorkdays(r.startDate.toDate(), (r.endDate || r.startDate).toDate(), dateFilter), 0);
          const reserveDays = monthlyFilteredRequests
            .filter(r => r.type === 'reserve')
            .reduce((sum, r) => sum + countCalendarDays(r.startDate.toDate(), (r.endDate || r.startDate).toDate(), dateFilter), 0);
          const pettyCash = monthlyFilteredRequests.filter(r => r.type === 'petty_cash');
          const pettyCashTotal = pettyCash.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
          const pettyCashUnpaid = pettyCash.filter(r => r.status === 'submitted').reduce((sum, r) => sum + (r.totalAmount || 0), 0);
          const missingDocuments = monthlyFilteredRequests.filter(isMissingDocument).length;

          return {
            id: employee.id,
            name: employee.displayName || employee.email || 'Unknown',
            totalRequests: monthlyFilteredRequests.length,
            extraShifts: {
              total: monthlyExtraShiftRequests.length,
              approved: monthlyExtraShiftRequests.filter(r => r.status === 'approved').length,
              rejected: monthlyExtraShiftRequests.filter(r => r.status === 'rejected').length,
            },
            vacations: {
              total: totalVacationDays,
              approved: vacationRequests.filter(r => r.status === 'approved').length,
              rejected: vacationRequests.filter(r => r.status === 'rejected').length,
            },
            sickDays,
            reserveDays,
            pettyCashTotal: Math.round(pettyCashTotal * 100) / 100,
            pettyCashUnpaid: Math.round(pettyCashUnpaid * 100) / 100,
            missingDocuments,
            vacationLeft: quotas.has(employee.id)
              ? Math.round((quotas.get(employee.id)! - usedVacationDays(requests, employee.id, selectedYear)) * 10) / 10
              : null,
          };
        })
      );

      // Final stats object
      const newStats: RequestStats = {
        totalRequests,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        requestsByType,
        requestsByMonth,
        employeeStats,
        periodRequests: filteredRequests.filter(r => r.status !== 'cancelled'),
        userNames: Object.fromEntries(users.map(u => [u.id, u.displayName || u.email || 'Unknown'])),
        dateFilter,
      };

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error('Failed to load report data.');
    } finally {
      setLoadingStats(false);
    }
  }, [selectedMonth, selectedYear, selectedView, t]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats]);

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    if (!stats) return;
    setExporting(true);
    try {
      const { downloadReport } = await import('@/lib/excelReport');
      const monthNames = [
        t('month.january'), t('month.february'), t('month.march'), t('month.april'),
        t('month.may'), t('month.june'), t('month.july'), t('month.august'),
        t('month.september'), t('month.october'), t('month.november'), t('month.december'),
      ];
      const period = selectedView === 'year' ? `${selectedYear}` : `${monthNames[selectedMonth]} ${selectedYear}`;

      const summary: SummaryRow[] = stats.employeeStats.map(e => ({
        name: e.name,
        extraShiftsTotal: e.extraShifts.total,
        extraShiftsApproved: e.extraShifts.approved,
        extraShiftsRejected: e.extraShifts.rejected,
        vacationDays: e.vacations.total,
        sickDays: e.sickDays,
        reserveDays: e.reserveDays,
        pettyCashTotal: e.pettyCashTotal,
        pettyCashUnpaid: e.pettyCashUnpaid,
        missingDocuments: e.missingDocuments,
      })).sort((a, b) => a.name.localeCompare(b.name, 'he'));

      const { dateFilter } = stats;
      const details: DetailRow[] = stats.periodRequests
        .map(r => {
          const from = r.startDate.toDate() as Date;
          const to = r.endDate ? (r.endDate.toDate() as Date) : null;
          const days =
            r.type === 'vacation' || r.type === 'sick' ? countWorkdays(from, to || from, dateFilter)
            : r.type === 'reserve' ? countCalendarDays(from, to || from, dateFilter)
            : null;
          return {
            employee: stats.userNames[r.employeeId] || t('unknown.employee'),
            type: t(requestTypeKey(r.type)),
            status: t(`status.${r.status}`),
            from,
            to,
            days,
            details: [r.projectName, r.description].filter(Boolean).join(' - '),
            amount: r.type === 'petty_cash' ? r.totalAmount || 0 : null,
            files: r.attachmentCount ?? null,
            missingDocument: isMissingDocument(r),
          };
        })
        .sort((a, b) => a.employee.localeCompare(b.employee, 'he') || a.from.getTime() - b.from.getTime());

      const fileName = selectedView === 'year'
        ? `worklog-report-${selectedYear}.xlsx`
        : `worklog-report-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.xlsx`;

      await downloadReport(fileName, summary, details, {
        title: `${t('report.excel.title')} - ${period}`,
        summarySheet: t('report.excel.summary'),
        detailsSheet: t('report.excel.details'),
        summaryHeaders: [
          t('employee.name'), t('total.extra.shifts'), t('extra.shifts.approved'), t('extra.shifts.rejected'),
          t('total.vacation.days'), t('report.sick.days'), t('report.reserve.days'),
          t('report.petty.cash.total'), t('report.petty.cash.unpaid'), t('report.missing.documents'),
        ],
        detailHeaders: [
          t('employee.name'), t('request.type'), t('status'), t('start.date'), t('end.date'),
          t('days'), t('report.excel.project.description'), t('petty.cash.amount'), t('documents'), t('missing.document'),
        ],
        total: t('petty.cash.total'),
        yes: '\u2713',
        rtl: dir === 'rtl',
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error(t('report.excel.error'));
    } finally {
      setExporting(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="h-12 rounded-xl bg-slate-200/70" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-3xl bg-slate-200/70" />)}
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

  const cards = [
    { value: stats?.totalRequests, label: t('total.requests'), color: 'text-brand-navy' },
    { value: stats?.approvedRequests, label: t('approved'), color: 'text-emerald-600' },
    { value: stats?.rejectedRequests, label: t('rejected'), color: 'text-red-600' },
    { value: stats?.pendingRequests, label: t('pending'), color: 'text-amber-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-500">{t('view.statistics')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-200/60 p-1 text-sm">
            {(['month', 'year'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSelectedView(v)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  selectedView === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t(v === 'month' ? 'this.month' : 'full.year')}
              </button>
            ))}
          </div>
          {selectedView === 'month' && (
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="select-input">
              {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
            </select>
          )}
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="select-input">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleExportExcel} disabled={exporting || !stats} className="btn-brand">
            <Download className="h-4 w-4" />
            {exporting ? t('report.excel.exporting') : t('export.excel')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-5">
            <p className={`text-3xl font-bold leading-none ${c.color}`}>{c.value}</p>
            <p className="mt-1.5 text-sm text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex border-b border-slate-200 gap-1">
        {(['employees', 'trends'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 pb-3 pt-1 text-sm font-medium ${activeTab === tab ? 'text-brand-navy' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t(tab === 'employees' ? 'employee.statistics' : 'monthly.trends')}
            {activeTab === tab && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t-full bg-brand-blue" />}
          </button>
        ))}
      </div>

      {activeTab === 'employees' ? (
        <div className="panel overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th">{t('employee.name')}</th>
                <th className="th">{t('total.extra.shifts')}</th>
                <th className="th">{t('extra.shifts.approved')}</th>
                <th className="th">{t('extra.shifts.rejected')}</th>
                <th className="th">{t('total.vacation.days')}</th>
                <th className="th">{t('reports.vacation.left')} {selectedYear}</th>
                <th className="th">{t('report.sick.days')}</th>
                <th className="th">{t('report.reserve.days')}</th>
                <th className="th">{t('petty.cash')}</th>
                <th className="th">{t('report.missing.documents')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.employeeStats.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50/60">
                  <td className="td font-medium text-slate-900 whitespace-nowrap">{employee.name}</td>
                  <td className="td">{employee.extraShifts.total}</td>
                  <td className="td text-emerald-700">{employee.extraShifts.approved}</td>
                  <td className="td text-red-600">{employee.extraShifts.rejected}</td>
                  <td className="td">{employee.vacations.total}</td>
                  <td className="td">
                    {employee.vacationLeft === null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        employee.vacationLeft < 0 ? 'bg-red-50 text-red-700' : employee.vacationLeft <= 3 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {employee.vacationLeft}
                      </span>
                    )}
                  </td>
                  <td className="td">{employee.sickDays}</td>
                  <td className="td">{employee.reserveDays}</td>
                  <td className="td whitespace-nowrap">{employee.pettyCashTotal ? formatAmount(employee.pettyCashTotal) : 0}</td>
                  <td className="td">
                    {employee.missingDocuments ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{employee.missingDocuments}</span>
                    ) : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel p-5 sm:p-6">
          <div className="h-80" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.requestsByMonth.map((m, i) => ({ ...m, label: months[i] }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Legend />
                <Bar dataKey="approved" fill="#059669" name={t('approved')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" fill="#DC2626" name={t('rejected')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#D97706" name={t('pending')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
