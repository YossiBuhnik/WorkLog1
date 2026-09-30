'use client';

import { useState, useEffect, Suspense } from 'react';
import { canSubmitRequests } from '@/lib/roles';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { createRequest, getDocuments, notifyManagers } from '@/lib/firebase/firebaseUtils';
import { notificationDate } from '@/lib/notifications';
import { User } from '@/lib/types';
import toast from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';
import AttachmentPicker from '@/components/AttachmentPicker';
import ReceiptPicker, { ReceiptDraft, parseReceiptAmount } from '@/components/ReceiptPicker';
import { MAX_RECEIPTS_PER_REQUEST } from '@/lib/firebase/attachments';
import { createReport, isReportType, parseDateInput } from '@/lib/firebase/reports';

type RequestType = 'vacation' | 'extra_shift' | 'sick' | 'reserve' | 'petty_cash';
const TYPES_FROM_URL: RequestType[] = ['vacation', 'sick', 'reserve', 'petty_cash'];

function NewRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, hasRole } = useAuth();
  const { t } = useTranslation();
  const [requestType, setRequestType] = useState<RequestType>(() => {
    const type = searchParams.get('type') as RequestType | null;
    return type && TYPES_FROM_URL.includes(type) ? type : 'extra_shift';
  });
  const [files, setFiles] = useState<File[]>([]);
  const isReport = isReportType(requestType);
  const isPettyCash = requestType === 'petty_cash';
  const isSickOrReserve = isReport && !isPettyCash;
  const [receipts, setReceipts] = useState<ReceiptDraft[]>([]);
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [managerId, setManagerId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading && !canSubmitRequests(user?.roles)) {
      router.push('/');
      return;
    }

    // Fetch manager when component mounts
    const fetchManager = async () => {
      try {
        const users = await getDocuments('users') as User[];
        const manager = users.find(u => u.roles.includes('manager'));
        if (manager) {
          setManagerId(manager.id);
        } else {
          toast.error(t('error.no.manager'));
        }
      } catch (error) {
        console.error('Error fetching manager:', error);
        toast.error(t('error.fetching.manager'));
      }
    };

    fetchManager();
  }, [user, loading, hasRole, router, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!user) {
      toast.error(t('error.login.required'));
      setSubmitting(false);
      return;
    }

    // Reports don't need a manager (no approval), so they skip the manager check
    if (isReport) {
      await handleReportSubmit();
      return;
    }

    if (!managerId) {
      toast.error(t('error.no.manager.assigned'));
      setSubmitting(false);
      return;
    }

    try {
      // Create dates with time set to start of day
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);

      let endDateTime: Date | undefined;
      if (requestType === 'vacation' && endDate) {
        endDateTime = new Date(endDate);
        endDateTime.setHours(0, 0, 0, 0);
      }

      const requestData = {
        type: requestType,
        employeeId: user.id,
        managerId: managerId,
        startDate: Timestamp.fromDate(startDateTime),
        ...(requestType === 'extra_shift' ? { projectName } : {}),
        ...(endDateTime ? { endDate: Timestamp.fromDate(endDateTime) } : {}),
      };

      console.log('Submitting request with data:', requestData);
      
      const requestId = await createRequest(requestData);
      console.log('Request created with ID:', requestId);

      // Let the managers know there is a new request waiting for approval (must not fail the request)
      try {
        await notifyManagers({
          title: 'New request',
          message: `${user.displayName || user.email}: ${requestType}`,
          relatedRequestId: requestId,
          kind: 'request_submitted',
          params: { type: requestType, employeeName: user.displayName || user.email, date: notificationDate(startDateTime) },
        }, user.id);
      } catch (notifyError) {
        console.error('Error notifying manager:', notifyError);
      }
      
      toast.success(t('request.submitted'));
      router.push('/employee');
    } catch (error) {
      console.error('Error submitting request:', error);
      if (error instanceof Error) {
        toast.error(`${t('error.submitting.request')}: ${error.message}`);
      } else {
        toast.error(t('error.submitting.request.try.again'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Sick leave / reserve duty / petty cash: no manager approval, goes straight to the office
  async function handleReportSubmit() {
    if (!user || !isReportType(requestType)) return;
    if (isPettyCash) {
      await handlePettyCashSubmit();
      return;
    }
    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate || startDate);
    if (end < start) {
      toast.error(t('error.end.before.start'));
      setSubmitting(false);
      return;
    }
    try {
      const { uploadFailed } = await createReport({
        type: requestType,
        employeeId: user.id,
        managerId,
        startDate: start,
        endDate: end,
        files,
        employeeName: user.displayName || undefined,
      });
      if (uploadFailed) {
        toast.error(t('report.upload.failed'));
      } else if (files.length === 0) {
        toast.success(t('report.submitted.missing.document'));
      } else {
        toast.success(t('report.submitted'));
      }
      router.push('/employee');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(t('error.submitting.request.try.again'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePettyCashSubmit() {
    if (!user) return;
    if (receipts.length === 0) {
      toast.error(t('petty.cash.error.no.receipts'));
      setSubmitting(false);
      return;
    }
    const amounts = receipts.map((r) => parseReceiptAmount(r.amount));
    if (amounts.some((a) => a === null)) {
      toast.error(t('petty.cash.error.amount'));
      setSubmitting(false);
      return;
    }
    try {
      const { uploadFailed } = await createReport({
        type: 'petty_cash',
        employeeId: user.id,
        managerId: null,
        startDate: parseDateInput(startDate),
        files: [],
        receipts: receipts.map((r, i) => ({ file: r.file, amount: amounts[i] as number })),
        description: description.trim(),
        projectName: projectName.trim() || undefined,
      });
      if (uploadFailed) {
        toast.error(t('report.upload.failed'));
      } else {
        toast.success(t('petty.cash.submitted'));
      }
      router.push('/employee');
    } catch (error) {
      console.error('Error submitting petty cash:', error);
      toast.error(t('error.submitting.request.try.again'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('new.request')}</h1>
          <p className="text-gray-500">{t('submit.new.request')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('request.type')}
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as RequestType)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="extra_shift">{t('extra.shift')}</option>
              <option value="vacation">{t('vacation')}</option>
              <option value="sick">{t('sick.leave')}</option>
              <option value="reserve">{t('reserve.duty')}</option>
              <option value="petty_cash">{t('petty.cash')}</option>
            </select>
            {isReport && (
              <p className="mt-2 text-sm text-gray-500">{t('report.no.approval.needed')}</p>
            )}
          </div>

          {requestType === 'extra_shift' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('project.name')}
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t('enter.project.name')}
              />
            </div>
          )}

          {isPettyCash && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('petty.cash.description')}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={200}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('petty.cash.description.placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('project.name')} ({t('optional')})
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('enter.project.name')}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t(isPettyCash ? 'petty.cash.expense.date' : 'start.date')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {requestType === 'vacation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('end.date')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          )}

          {isPettyCash && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('petty.cash.receipts')}
              </label>
              <ReceiptPicker
                receipts={receipts}
                onChange={setReceipts}
                maxReceipts={MAX_RECEIPTS_PER_REQUEST}
                disabled={submitting}
              />
            </div>
          )}

          {isSickOrReserve && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('end.date')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate || undefined}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t(requestType === 'sick' ? 'report.document.sick' : 'report.document.reserve')}
                </label>
                <AttachmentPicker files={files} onChange={setFiles} disabled={submitting} />
                {files.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">{t('report.document.later')}</p>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/employee')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? t('submitting') : t('submit.request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewRequest() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewRequestContent />
    </Suspense>
  );
} 