import { Notification } from './types';
import { requestTypeKey } from './firebase/reports';

type T = (key: string) => string;

const fill = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [k, v]) => text.split(`{${k}}`).join(v), template);

/** Builds the title/message of a notification in the viewer's current language. */
export const renderNotification = (n: Notification, t: T): { title: string; message: string } => {
  const p = n.params || {};
  const type = p.type ? t(requestTypeKey(p.type)) : '';
  switch (n.kind) {
    case 'request_status':
      return {
        title: t(`status.${p.status}`),
        message: fill(t('notif.request.status'), { type, status: t(`status.${p.status}`), date: p.date || '' }),
      };
    case 'request_submitted':
      return { title: t('notif.request.submitted'), message: `${p.employeeName || ''}: ${type} · ${p.date || ''}` };
    case 'report_submitted':
      return { title: type, message: `${p.employeeName || ''}: ${p.from || ''} – ${p.to || ''}` };
    case 'request_cancelled':
      return { title: t('notif.request.cancelled'), message: `${p.employeeName ? `${p.employeeName}: ` : ''}${type} · ${p.date || ''}` };
    default:
      return { title: n.title, message: n.message };
  }
};

/** Where clicking the notification should take the user. */
export const notificationLink = (n: Notification) =>
  n.kind === 'request_status' ? '/employee' : n.kind === 'request_submitted' ? '/manager' : n.kind ? '/manager/all-requests' : null;

/** Date as shown in notifications, e.g. 12.10.2026 */
export const notificationDate = (date: Date) => date.toLocaleDateString('he-IL');
