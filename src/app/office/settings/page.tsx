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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="panel divide-y divide-slate-100">
        {/* Notification Settings */}
        <div className="p-6 sm:p-7">
          <h3 className="text-lg font-semibold text-slate-900">{t('notification.settings')}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {t('notification.settings.description')}
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  {t('email.notifications')}
                </label>
                <p className="text-sm text-slate-500">
                  {t('email.notifications.description')}
                </p>
              </div>
              <button
                type="button"
                className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue bg-brand-navy"
                role="switch"
                aria-checked="true"
              >
                <span className="ltr:translate-x-5 rtl:-translate-x-5 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="p-6 sm:p-7">
          <h3 className="text-lg font-semibold text-slate-900">{t('working.hours')}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {t('working.hours.description')}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">
                {t('start.time')}
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  name="startTime"
                  className="field-input"
                  defaultValue="09:00"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-slate-700">
                {t('end.time')}
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  name="endTime"
                  className="field-input"
                  defaultValue="17:00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6 sm:p-7">
          <div className="flex justify-end">
            <button
              type="button"
              className="btn-brand"
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