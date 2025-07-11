'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Request, User } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
};

console.log('REPORTS PAGE LOADED - OUTSIDE COMPONENT');

export default function Reports() {
  console.log('REPORTS COMPONENT RENDERING - TOP');
  
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11 for Jan-Dec
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

      // --- START HOLIDAY CALCULATION LOGIC ---

      const jewishHolidays: { [year: number]: string[] } = {
        2024: [
          '2024-04-23', '2024-04-24', '2024-04-29', '2024-04-30', '2024-06-12', 
          '2024-10-03', '2024-10-04', '2024-10-12', '2024-10-17', '2024-10-18', 
          '2024-10-24', '2024-10-25',
        ],
        2025: [
          '2025-04-13', '2025-04-14', '2025-04-19', '2025-04-20', '2025-06-02', 
          '2025-09-23', '2025-09-24', '2025-10-02', '2025-10-07', '2025-10-08', 
          '2025-10-14', '2025-10-15',
        ],
      };

      const toLocalDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      const holidaysWithEves = (() => {
        const holidaysByYear = JSON.parse(JSON.stringify(jewishHolidays));
        for (const year in holidaysByYear) {
          const eves = new Set<string>();
          holidaysByYear[year].forEach((holidayStr: string) => {
            const [y, m, d] = holidayStr.split('-').map(Number);
            const holidayUTC = new Date(Date.UTC(y, m - 1, d));
            holidayUTC.setUTCDate(holidayUTC.getUTCDate() - 1);
            const eveStr = holidayUTC.toISOString().slice(0, 10);
            eves.add(eveStr);
          });
          const originalHolidays = new Set(holidaysByYear[year]);
          const combinedHolidays = new Set([...Array.from(originalHolidays), ...Array.from(eves)]);
          holidaysByYear[year] = Array.from(combinedHolidays);
        }
        return holidaysByYear;
      })();

      const isWorkday = (date: Date, holidays: string[]): boolean => {
        const day = date.getDay();
        if (day > 4) return false; 
        const dateStr = toLocalDateString(date);
        return !holidays.includes(dateStr);
      }

      const countWorkdays = (
        start: Date,
        end: Date,
        filter?: { start: Date; end: Date }
      ): number => {
        let count = 0;
        let current = new Date(start);
        current.setHours(0, 0, 0, 0);

        const inclusiveEnd = new Date(end);
        inclusiveEnd.setHours(23, 59, 59, 999);

        while (current <= inclusiveEnd) {
          const year = current.getFullYear();
          const holidaysForYear = holidaysWithEves[year] || [];
          const isInFilter = filter
            ? current >= filter.start && current <= filter.end
            : true;

          if (isInFilter && isWorkday(current, holidaysForYear)) {
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
        return count;
      }

      // --- END HOLIDAY CALCULATION LOGIC ---

      // Convert snapshots to typed arrays
      const requests = requestsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Request[];

      const users = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as User[];

      // Define date range for filtering based on selected month/year
      const year = new Date().getFullYear();
      const monthStart = new Date(year, selectedMonth, 1, 0, 0, 0, 0);
      const monthEnd = new Date(year, selectedMonth + 1, 0, 23, 59, 59, 999);
      const dateFilter = selectedView === 'month' ? { start: monthStart, end: monthEnd } : undefined;

      // Filter requests for top-level stats
      const filteredRequests = requests.filter(request => {
        if (selectedView === 'year') return true;
        const start = request.startDate?.toDate?.();
        const end = request.endDate?.toDate?.() || start;
        if (!start) return false;
        return start <= monthEnd && end >= monthStart;
      });

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
          r.createdAt.toDate().getMonth() === months.indexOf(month) && 
          r.status === 'approved'
        ).length,
        rejected: filteredRequests.filter(r => 
          r.createdAt.toDate().getMonth() === months.indexOf(month) && 
          r.status === 'rejected'
        ).length,
        pending: filteredRequests.filter(r => 
          r.createdAt.toDate().getMonth() === months.indexOf(month) && 
          r.status === 'pending'
        ).length,
      }));

      // Calculate employee stats
      const employeeStats: EmployeeStats[] = await Promise.all(users
        .filter(u => u.roles.includes('employee'))
        .map(async (employee) => {
          // Get all requests for the employee, not yet filtered by date
          const employeeRequests = requests.filter(r => r.employeeId === employee.id && r.status !== 'cancelled');

          // Apply the monthly date filter for stats like extra shifts
          const monthlyFilteredRequests = employeeRequests.filter(request => {
            if (selectedView === 'year' || !dateFilter) return true;
            const start = request.startDate?.toDate?.();
            const end = request.endDate?.toDate?.() || start;
            if (!start) return false;
            return start <= dateFilter.end && end >= dateFilter.start;
          });
          
          const monthlyExtraShiftRequests = monthlyFilteredRequests.filter(r => r.type === 'extra_shift');
          const vacationRequests = employeeRequests.filter(r => r.type === 'vacation');

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
      };

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error('Failed to load report data.');
    } finally {
      setLoadingStats(false);
    }
  }, [selectedMonth, selectedView, t]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats]);

  const handleExportCSV = () => {
    if (!stats) return;

    const title =
      selectedView === 'year'
        ? `${t('employee.statistics')} - ${new Date().getFullYear()}`
        : `${t('employee.statistics')} - ${t(`months.${stats.requestsByMonth[selectedMonth].month.toLowerCase()}`)} ${new Date().getFullYear()}`;

    const dataRows = stats.employeeStats.map(employee => [
      employee.name,
      employee.extraShifts.total,
      employee.extraShifts.approved,
      employee.extraShifts.rejected,
      employee.vacations.total
    ]);

    const csvContent = [
      [title],
      [],
      [t('employee.name'), t('total.extra.shifts'), t('extra.shifts.approved'), t('extra.shifts.rejected'), t('total.vacation.days')],
      ...dataRows
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employee-stats-${selectedView === 'year' ? 'full-year' : stats.requestsByMonth[selectedMonth].month.toLowerCase()}-${new Date().getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            <Download className="h-5 w-5 mr-2" />
            {t('export.csv')}
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