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

export default function Reports() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11 for Jan-Dec
  const [selectedView, setSelectedView] = useState<'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'trends' | 'employees'>('employees');

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
        const requestDate = request.createdAt.toDate();
        if (selectedView === 'month') {
          return requestDate.getMonth() === selectedMonth;
        }
        return true; // For yearly view, include all requests
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
          const employeeRequests = filteredRequests.filter(r => r.employeeId === employee.id && r.status !== 'cancelled');
          const extraShiftRequests = employeeRequests.filter(r => r.type === 'extra_shift');
          const vacationRequests = employeeRequests.filter(r => r.type === 'vacation');
          
          // Calculate vacation days
          const calculateDays = (requests: Request[]) => {
            return requests.reduce((total, request) => {
              if (request.endDate && request.startDate) {
                const start = request.startDate.toDate();
                const end = request.endDate.toDate();
                return total + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              }
              return total + 1;
            }, 0);
          };

          const totalVacationDays = calculateDays(vacationRequests);
          const approvedVacationDays = calculateDays(vacationRequests.filter(r => r.status === 'approved'));
          const rejectedVacationDays = calculateDays(vacationRequests.filter(r => r.status === 'rejected'));
          
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