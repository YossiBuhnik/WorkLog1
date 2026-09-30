'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Request } from '@/lib/types';
import AttachmentList from '@/components/AttachmentList';
import AttachmentPicker from '@/components/AttachmentPicker';
import ReceiptPicker, { ReceiptDraft, parseReceiptAmount } from '@/components/ReceiptPicker';
import { maxFilesFor, formatAmount } from '@/lib/firebase/attachments';
import {
  getRequest,
  addReportFiles,
  addReceipts,
  removeReportFile,
  updateReportDates,
  cancelReport,
  isReportType,
  isReportEditable,
  isMissingDocument,
  requestTypeKey,
  parseDateInput,
  toDateInput,
} from '@/lib/firebase/reports';

export default function ReportDetails() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [report, setReport] = useState<Request | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newReceipts, setNewReceipts] = useState<ReceiptDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingDates, setEditingDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const loadReport = useCallback(async () => {
    if (!user) return;
    try {
      const request = await getRequest(params.id);
      // Only the report's own employee may open this page
      if (!request || request.employeeId !== user.id || !isReportType(request.type)) {
        setReport(null);
        return;
      }
      setReport(request);
      setStartDate(toDateInput(request.startDate.toDate()));
      setEndDate(toDateInput((request.endDate || request.startDate).toDate()));
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error(t('error.loading.requests'));
    } finally {
      setLoadingReport(false);
    }
  }, [user, params.id, t]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    loadReport();
  }, [loading, user, router, loadReport]);

  if (loading || loadingReport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!report || !user) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <p className="text-gray-700 mb-4">{t('report.not.found')}</p>
        <Link href="/employee" className="text-blue-600 hover:text-blue-800">{t('back.to.my.requests')}</Link>
      </div>
    );
  }

  const editable = isReportEditable(report);
  const isPettyCash = report.type === 'petty_cash';
  const fileCount = report.attachmentCount || 0;
  const maxFiles = maxFilesFor(report.type);

  const handleUpload = async () => {
    const count = isPettyCash ? newReceipts.length : newFiles.length;
    if (count === 0) return;
    if (fileCount + count > maxFiles) {
      toast.error(t('attachments.error.count').replace('{max}', String(maxFiles)));
      return;
    }
    const amounts = newReceipts.map((r) => parseReceiptAmount(r.amount));
    if (isPettyCash && amounts.some((a) => a === null)) {
      toast.error(t('petty.cash.error.amount'));
      return;
    }
    setUploading(true);
    try {
      if (isPettyCash) {
        await addReceipts(report.id, user.id, newReceipts.map((r, i) => ({ file: r.file, amount: amounts[i] as number })));
      } else {
        await addReportFiles(report.id, user.id, newFiles);
      }
      setNewFiles([]);
      setNewReceipts([]);
      setRefreshKey((k) => k + 1);
      await loadReport();
      toast.success(t('report.files.added'));
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(t('report.upload.failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDates = async () => {
    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate || startDate);
    if (end < start) {
      toast.error(t('error.end.before.start'));
      return;
    }
    setSaving(true);
    try {
      await updateReportDates(report.id, start, end);
      await loadReport();
      setEditingDates(false);
      toast.success(t('report.updated'));
    } catch (error) {
      console.error('Error updating dates:', error);
      toast.error(t('report.update.failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(t('report.confirm.cancel'))) return;
    try {
      await cancelReport(report.id);
      toast.success(t('request.cancelled'));
      router.push('/employee');
    } catch (error) {
      console.error('Error cancelling report:', error);
      toast.error(t('error.cancelling.request'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <Link href="/employee" className="text-sm text-blue-600 hover:text-blue-800">
          {t('back.to.my.requests')}
        </Link>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900">{t(requestTypeKey(report.type))}</h1>
            <span className="flex flex-col items-end gap-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                report.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {t(`status.${report.status}`)}
              </span>
              {isMissingDocument(report) && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {t('missing.document')}
                </span>
              )}
            </span>
          </div>

          {isPettyCash ? (
            <div className="text-sm text-gray-600 space-y-1">
              <p dir="auto">{t('petty.cash.description')}: {report.description}</p>
              {report.projectName && <p dir="auto">{t('project')}: {report.projectName}</p>}
              <p>{t('petty.cash.expense.date')}: {report.startDate.toDate().toLocaleDateString()}</p>
              <p className="text-base font-semibold text-gray-900">
                {t('petty.cash.total')}: {formatAmount(report.totalAmount || 0)}
              </p>
            </div>
          ) : editingDates ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('start.date')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('end.date')}</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDates}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('save')}
                </button>
                <button
                  onClick={() => setEditingDates(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 space-y-1">
              <p>{t('start.date')}: {report.startDate.toDate().toLocaleDateString()}</p>
              <p>{t('end.date')}: {(report.endDate || report.startDate).toDate().toLocaleDateString()}</p>
              {editable && (
                <button onClick={() => setEditingDates(true)} className="text-blue-600 hover:text-blue-800">
                  {t('report.edit.dates')}
                </button>
              )}
            </div>
          )}

          {!editable && report.status === 'handled' && (
            <p className="text-sm text-gray-500">{t('report.locked.handled')}</p>
          )}
          {!editable && report.status === 'paid' && (
            <p className="text-sm text-gray-500">{t('petty.cash.locked.paid')}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t(isPettyCash ? 'petty.cash.receipts' : report.type === 'sick' ? 'report.document.sick' : 'report.document.reserve')}
          </h2>
          <AttachmentList
            requestId={report.id}
            ownerId={user.id}
            refreshKey={refreshKey}
            onDelete={editable ? async (attachment) => {
              await removeReportFile(report.id, attachment);
              await loadReport();
            } : undefined}
          />

          {editable && fileCount < maxFiles && (
            <div className="pt-2 border-t border-gray-100 space-y-3">
              {isPettyCash ? (
                <ReceiptPicker
                  receipts={newReceipts}
                  onChange={setNewReceipts}
                  maxReceipts={maxFiles - fileCount}
                  disabled={uploading}
                />
              ) : (
                <AttachmentPicker files={newFiles} onChange={setNewFiles} disabled={uploading} />
              )}
              {(isPettyCash ? newReceipts.length : newFiles.length) > 0 && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? t('submitting') : t('report.upload.files')}
                </button>
              )}
            </div>
          )}
        </div>

        {editable && (
          <button onClick={handleCancel} className="text-sm text-red-600 hover:text-red-800">
            {t('report.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
