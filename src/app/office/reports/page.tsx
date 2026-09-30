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

interface EmployeeStats {
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

console.log('REPORTS PAGE LOADED - OUTSIDE COMPONENT');

export default function Reports() {
  console.log('REPORTS COMPONENT RENDERING - TOP');
  
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

  useEffect(() => {
    console.log('REPORTS COMPONENT useEffect triggered');
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [requestsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'requests')),
        getDocs(collection(db, 'users'))
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.and.analytics')}</h1>
          <p className="text-gray-500">{t('view.statistics')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value as 'month' | 'year')}
            className="rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="month">{t('this.month')}</option>
            <option value="year">{t('full.year')}</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {selectedView === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleExportExcel}
            disabled={exporting || !stats}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            {exporting ? t('report.excel.exporting') : t('export.excel')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">{t('total.requests')}</h3>
          <p className="text-3xl font-bold text-emerald-600">{stats?.totalRequests}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">{t('approved')}</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.approvedRequests}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">{t('rejected')}</h3>
          <p className="text-3xl font-bold text-red-600">{stats?.rejectedRequests}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">{t('pending')}</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats?.pendingRequests}</p>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-md ${
            activeTab === 'employees'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('employee.statistics')}
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 rounded-md ${
            activeTab === 'trends'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('monthly.trends')}
        </button>
      </div>

      {activeTab === 'employees' ? (
        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('employee.statistics')}</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employee.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('total.extra.shifts')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('extra.shifts.approved')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('extra.shifts.rejected')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('total.vacation.days')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('report.sick.days')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('report.reserve.days')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('petty.cash')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('report.missing.documents')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.employeeStats.map((employee) => (
                <tr key={employee.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.extraShifts.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {employee.extraShifts.approved}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {employee.extraShifts.rejected}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.vacations.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.sickDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.reserveDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.pettyCashTotal ? formatAmount(employee.pettyCashTotal) : 0}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${employee.missingDocuments ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>
                    {employee.missingDocuments}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('monthly.trends')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.requestsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#059669" name={t('approved')} />
                <Bar dataKey="rejected" fill="#DC2626" name={t('rejected')} />
                <Bar dataKey="pending" fill="#D97706" name={t('pending')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
} 