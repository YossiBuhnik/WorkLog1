'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getDocuments, updateUser } from '@/lib/firebase/firebaseUtils';
import { User, UserRole } from '@/lib/types';
import { toast } from 'react-hot-toast';

export default function EmployeesPage() {
  const { user, loading: userLoading } = useAuth();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const employeesData = await getDocuments('users') as User[];
      const employeesList = employeesData.filter(user => user.roles.includes('employee'));
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error(t('error.loading.employees'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleRoleChange = async (employeeId: string, newRoles: UserRole[]) => {
    setUpdatingRoleId(employeeId);
    try {
      await updateUser(employeeId, { roles: newRoles });
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId ? { ...emp, roles: newRoles } : emp
        )
      );
      toast.success('Roles updated successfully');
    } catch (error) {
      toast.error('Failed to update roles');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  useEffect(() => {
    console.log('DEBUG: user object in EmployeesPage:', user);
    if (user) {
      console.log('DEBUG: user.roles:', user.roles);
      console.log('DEBUG: user?.roles.includes("office"):', user.roles?.includes('office'));
    }
    fetchEmployees();
  }, [fetchEmployees]);

  if (loading || userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('employees.title')}</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-md">
          <thead>
            <tr>
              <th className="px-4 py-2">No.</th>
              <th className="px-4 py-2">Full Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role(s)</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, idx) => (
              <tr key={employee.id} className="border-t">
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">{employee.displayName || employee.email}</td>
                <td className="px-4 py-2">{employee.email}</td>
                <td className="px-4 py-2">
                  {user?.roles.includes('office') ? (
                    <div className="flex flex-col space-y-1">
                      {(['employee', 'manager', 'office'] as UserRole[]).map(role => (
                        <label key={role} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={employee.roles.includes(role)}
                            onChange={e => {
                              const newRoles = e.target.checked
                                ? [...employee.roles, role]
                                : employee.roles.filter(r => r !== role);
                              handleRoleChange(employee.id, newRoles as UserRole[]);
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    employee.roles.join(', ')
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 