'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('office.settings')}</h1>
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {/* Notification Settings */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">{t('notification.settings')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('notification.settings.description')}
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t('email.notifications')}
                </label>
                <p className="text-sm text-gray-500">
                  {t('email.notifications.description')}
                </p>
              </div>
              <button
                type="button"
                className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 bg-emerald-600"
                role="switch"
                aria-checked="true"
              >
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">{t('working.hours')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('working.hours.description')}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                {t('start.time')}
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  name="startTime"
                  className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  defaultValue="09:00"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                {t('end.time')}
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  name="endTime"
                  className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  defaultValue="17:00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6">
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              onClick={() => toast.success(t('changes.saved'))}
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 