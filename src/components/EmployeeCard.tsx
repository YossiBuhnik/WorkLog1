import { User } from '@/lib/types';
import Image from 'next/image';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface EmployeeCardProps {
  employee: User;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4">
        <div className="relative w-16 h-16">
          <Image
            src={employee.photoURL || '/default-avatar.png'}
            alt={employee.displayName || 'Employee'}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{employee.displayName}</h3>
          <p className="text-gray-600">{employee.email}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-500">{t('employee.role')}:</span>
          <span className="text-sm text-gray-700">
            {employee.roles.map(role => t(`roles.${role}`)).join(', ')}
          </span>
        </div>
        {employee.department && (
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm font-medium text-gray-500">{t('employee.department')}:</span>
            <span className="text-sm text-gray-700">{employee.department}</span>
          </div>
        )}
      </div>
    </div>
  );
} 