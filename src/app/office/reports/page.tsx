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
  vacationBreakdown?: { start: string; end: string; days: number }[];
  debug?: string;
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
  
  let user, loading, t;

  try {
    ({ user, loading } = useAuth());
    ({ t } = useTranslation());
  } catch (error) {
    console.error('Error during custom hook initialization:', error);
    // Render a fallback or return null to prevent crashing
    return <div>Error loading page. Please check the console.</div>;
  }

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

      // Convert snapshots to typed arrays
      const requests = requestsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Request[];

      const users = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as User[];

      // Filter requests based on selected month/year
      const filteredRequests = requests.filter(request => {
        if (selectedView === 'year') return true;
        // For monthly view, include if any part of the request occurs in the selected month
        const start = request.startDate?.toDate?.();
        const end = request.endDate?.toDate?.() || start;
        if (!start) return false;
        // Check if any part of the request is in the selected month
        // (start or end is in the month, or the range covers the month)
        const month = selectedMonth;
        const year = new Date().getFullYear();
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        return (
          (start <= monthEnd && end >= monthStart)
        );
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
      const employeeStats: EmployeeStats[] = users
        .filter(u => u.roles.includes('employee'))
        .map(employee => {
          // For vacation day count, use all vacation requests for this employee
          const employeeRequests = requests.filter(r => r.employeeId === employee.id && r.status !== 'cancelled');
          const extraShiftRequests = employeeRequests.filter(r => r.type === 'extra_shift');
          const vacationRequests = employeeRequests.filter(r => r.type === 'vacation');
          
          // Calculate vacation days (workdays only, excluding Jewish holidays)
          const jewishHolidays: { [year: number]: string[] } = {
            2024: [
              '2024-04-23', // Pesach 1
              '2024-04-24', // Pesach 2
              '2024-04-29', // Pesach 7
              '2024-04-30', // Pesach 8
              '2024-06-12', // Shavuot
              '2024-10-03', // Rosh Hashanah 1
              '2024-10-04', // Rosh Hashanah 2
              '2024-10-12', // Yom Kippur
              '2024-10-17', // Sukkot 1
              '2024-10-18', // Sukkot 2
              '2024-10-24', // Shemini Atzeret
              '2024-10-25', // Simchat Torah
            ],
            2025: [
              '2025-04-13', // Pesach 1
              '2025-04-14', // Pesach 2
              '2025-04-19', // Pesach 7
              '2025-04-20', // Pesach 8
              '2025-06-02', // Shavuot
              '2025-09-23', // Rosh Hashanah 1
              '2025-09-24', // Rosh Hashanah 2
              '2025-10-02', // Yom Kippur
              '2025-10-07', // Sukkot 1
              '2025-10-08', // Sukkot 2
              '2025-10-14', // Shemini Atzeret
              '2025-10-15', // Simchat Torah
            ],
            // Add more years as needed
          };

          function isWorkday(date: Date, holidays: string[]): boolean {
            const day = date.getDay();
            // Sunday (0) to Thursday (4) are workdays
            if (day < 0 || day > 4) return false;
            // Format date as YYYY-MM-DD
            const dateStr = date.toISOString().slice(0, 10);
            return !holidays.includes(dateStr);
          }

          function countWorkdays(start: Date, end: Date): number {
            let count = 0;
            let current = new Date(start);
            current.setHours(0, 0, 0, 0); // Normalize start date
            
            const inclusiveEnd = new Date(end);
            inclusiveEnd.setHours(23, 59, 59, 999); // Normalize end date to end of day

            const holidays = jewishHolidays[start.getFullYear()] || [];

            while (current <= inclusiveEnd) {
              if (isWorkday(current, holidays)) {
                count++;
              }
              current.setDate(current.getDate() + 1);
            }
            return count;
          }

          const calculateDays = (requests: Request[]) => {
            return requests.reduce((total, request) => {
              if (request.endDate && request.startDate) {
                const start = request.startDate.toDate();
                const end = request.endDate.toDate();
                const days = countWorkdays(start, end);
                console.log('[Vacation Debug]', {
                  employee: employee.displayName || employee.email,
                  start: start.toString(),
                  end: end.toString(),
                  days
                });
                return total + days;
              }
              // Single day request
              if (request.startDate) {
                const start = request.startDate.toDate();
                const isWork = isWorkday(start, jewishHolidays[start.getFullYear()] || []);
                console.log('[Vacation Debug - Single Day]', {
                  employee: employee.displayName || employee.email,
                  start: start.toString(),
                  isWork
                });
                return total + (isWork ? 1 : 0);
              }
              return total;
            }, 0);
          };

          const totalVacationDays = calculateDays(vacationRequests);
          const approvedVacationDays = calculateDays(vacationRequests.filter(r => r.status === 'approved'));
          const rejectedVacationDays = calculateDays(vacationRequests.filter(r => r.status === 'rejected'));
          
          // DEBUG: Print all vacation requests for this employee
          if (vacationRequests.length > 0) {
            console.log('[Vacation Debug - All]', {
              employee: employee.displayName || employee.email,
              requests: vacationRequests.map(r => ({
                start: r.startDate?.toDate?.().toString?.(),
                end: r.endDate?.toDate?.().toString?.(),
                status: r.status
              }))
            });
          }
          
          // Build vacation breakdown for debug table and log to console
          const vacationBreakdown = vacationRequests.map(request => {
            if (request.endDate && request.startDate) {
              const start = request.startDate.toDate();
              const end = request.endDate.toDate();
              const days = countWorkdays(start, end);
              console.log('[Vacation Debug]', {
                employee: employee.displayName || employee.email,
                start: start.toLocaleDateString(),
                end: end.toLocaleDateString(),
                days
              });
              return {
                start: start.toLocaleDateString(),
                end: end.toLocaleDateString(),
                days
              };
            } else if (request.startDate) {
              const start = request.startDate.toDate();
              const days = isWorkday(start, jewishHolidays[start.getFullYear()] || []) ? 1 : 0;
              console.log('[Vacation Debug - Single Day]', {
                employee: employee.displayName || employee.email,
                start: start.toLocaleDateString(),
                days
              });
              return {
                start: start.toLocaleDateString(),
                end: start.toLocaleDateString(),
                days
              };
            }
            return { start: '', end: '', days: 0 };
          });
          
          console.log('[Vacation Debug - Total]', {
            employee: employee.displayName || employee.email,
            totalVacationDays
          });
          
          return {
            name: employee.displayName || employee.email || 'Unknown',
            totalRequests: employeeRequests.length,
            extraShifts: {
              total: extraShiftRequests.length,
              approved: extraShiftRequests.filter(r => r.status === 'approved').length,
              rejected: extraShiftRequests.filter(r => r.status === 'rejected').length,
            },
            vacations: {
              total: totalVacationDays,
              approved: approvedVacationDays,
              rejected: rejectedVacationDays,
            },
            vacationBreakdown,
            // DEBUG: Add debug info to UI
            debug: vacationRequests.length > 0 ? vacationRequests.map(r => `${r.startDate?.toDate?.().toLocaleDateString?.()} - ${r.endDate?.toDate?.().toLocaleDateString?.()} (${r.status})`).join(', ') : undefined
          };
        })
        .sort((a, b) => b.totalRequests - a.totalRequests);

      setStats({
        totalRequests,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        requestsByType,
        requestsByMonth,
        employeeStats,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error(t('errors.fetchStats'));
    } finally {
      setLoadingStats(false);
    }
  }, [selectedMonth, selectedView, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportCSV = () => {
    if (!stats) return;

    const months = [
      t('month.january'), t('month.february'), t('month.march'), t('month.april'),
      t('month.may'), t('month.june'), t('month.july'), t('month.august'),
      t('month.september'), t('month.october'), t('month.november'), t('month.december')
    ];

    const title = selectedView === 'year' ? 
      `${t('employee.statistics')} - ${t('full.year')} ${new Date().getFullYear()}` : 
      `${t('employee.statistics')} - ${months[selectedMonth]} ${new Date().getFullYear()}`;

    const csvContent = [
      // Title row
      [title],
      // Empty row for spacing
      [],
      // Headers
      [t('employee.name'), t('total.extra.shifts'), t('extra.shifts.approved'), t('extra.shifts.rejected'), t('total.vacation.days')],
      // Data rows
      ...stats.employeeStats.map(employee => [
        employee.name,
        employee.extraShifts.total,
        employee.extraShifts.approved,
        employee.extraShifts.rejected,
        employee.vacations.total
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employee-stats-${selectedView === 'year' ? 'full-year' : months[selectedMonth].toLowerCase()}-${new Date().getFullYear()}.csv`);
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
      {/* DEBUG: Show vacation debug info for each employee, always visible */}
      {/* (Remove this banner after confirming the fix) */}
      {/* <div style={{color: 'red', fontWeight: 'bold', marginBottom: 16, border: '2px solid red', padding: 8, background: '#fff0f0'}}>
        <span>DEBUG VACATION REQUESTS: </span>
        {stats?.employeeStats.map(e => e.debug ? `${e.name}: ${e.debug}` : null).filter(Boolean).join(' | ') || 'No vacation requests found.'}
      </div> */}
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

      {/* Summary Cards */}
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

      {/* Tab Buttons */}
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

      {/* Tab Content */}
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
          {/* DEBUG: Vacation breakdown table for each employee (always visible) */}
          <div className="bg-yellow-50 p-4 mt-4 rounded shadow">
            <h4 className="font-bold text-yellow-800 mb-2">Vacation Days Debug Table</h4>
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1">Employee</th>
                  <th className="px-2 py-1">Start Date</th>
                  <th className="px-2 py-1">End Date</th>
                  <th className="px-2 py-1">Counted Workdays</th>
                </tr>
              </thead>
              <tbody>
                {stats?.employeeStats.some(e => e.vacationBreakdown && e.vacationBreakdown.length > 0) ? (
                  stats?.employeeStats.map((employee, idx) => (
                    employee.vacationBreakdown?.length ? employee.vacationBreakdown.map((v, i) => (
                      <tr key={employee.name + '-' + i}>
                        <td className="px-2 py-1">{employee.name}</td>
                        <td className="px-2 py-1">{v.start}</td>
                        <td className="px-2 py-1">{v.end}</td>
                        <td className="px-2 py-1">{v.days}</td>
                      </tr>
                    )) : null
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center text-yellow-700">No vacation requests found for any employee.</td></tr>
                )}
              </tbody>
            </table>
          </div>
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