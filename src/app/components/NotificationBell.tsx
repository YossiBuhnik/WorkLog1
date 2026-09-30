'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/lib/contexts/NotificationContext';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { renderNotification, notificationLink } from '@/lib/notifications';
import { Notification } from '@/lib/types';

const MAX_SHOWN = 20;

/** Bell icon with unread counter; opens a list of the user's latest notifications. */
export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleClick = async (n: Notification) => {
    if (!n.read && n.id) await markAsRead(n.id);
    const link = notificationLink(n);
    setOpen(false);
    if (link) router.push(link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-white hover:bg-white/10 rounded-full"
        aria-label={t('notifications')}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-gray-900">{t('notifications')}</span>
            {unreadCount > 0 && (
              <button onClick={() => markAllAsRead()} className="text-sm text-blue-600 hover:text-blue-800">
                {t('notifications.mark.all.read')}
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-gray-500">{t('notifications.empty')}</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y">
              {notifications.slice(0, MAX_SHOWN).map((n) => {
                const { title, message } = renderNotification(n, t);
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={`w-full text-start px-4 py-3 hover:bg-gray-50 ${n.read ? '' : 'bg-blue-50'}`}
                    >
                      <p className="text-sm font-medium text-gray-900" dir="auto">{title}</p>
                      <p className="text-sm text-gray-600" dir="auto">{message}</p>
                      {n.createdAt?.toDate && (
                        <p className="mt-1 text-xs text-gray-400">
                          {n.createdAt.toDate().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
