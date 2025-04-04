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
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
          {employee.photoURL ? (
            <Image
              src={employee.photoURL}
              alt={employee.displayName || 'Employee'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
              {employee.displayName?.[0] || '?'}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{employee.displayName}</h3>
          <p className="text-gray-600">{employee.email}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-sm text-gray-600">
          <p>
            <span className="font-medium">{t('employee.status')}:</span>{' '}
            <span className={`${employee.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
              {t(`employee.status.${employee.status || 'active'}`)}
            </span>
          </p>
          <p className="mt-1">
            <span className="font-medium">{t('employee.department')}:</span>{' '}
            {employee.department || t('employee.department.none')}
          </p>
        </div>
      </div>
    </div>
  );
} 