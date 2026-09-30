'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Request } from '@/lib/types';
import AttachmentList from '@/components/AttachmentList';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { TYPE_META, STATUS_META } from '@/lib/requestTypeMeta';
import { ArrowLeft, ArrowRight, Loader2, Paperclip, Pencil, Upload } from 'lucide-react';
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
  const { language, dir } = useLanguage();

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
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-32 rounded-lg bg-slate-200/70" />
        <div className="h-48 rounded-3xl bg-slate-200/70" />
        <div className="h-40 rounded-3xl bg-slate-200/70" />
      </div>
    );
  }

  if (!report || !user) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-slate-100">
        <p className="text-slate-700 mb-4">{t('report.not.found')}</p>
        <Link href="/employee" className="font-medium text-brand-blue hover:text-brand-navy">{t('back.to.my.requests')}</Link>
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

  const meta = TYPE_META[report.type] || TYPE_META.sick;
  const status = STATUS_META[report.status] || STATUS_META.submitted;
  const TypeIcon = meta.icon;
  const StatusIcon = status.icon;
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar' : 'en-GB';
  const fmt = (d: Date) => d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      <Link href="/employee" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <Back className="h-4 w-4" />
        {t('back.to.my.requests')}
      </Link>

      <div className="rounded-3xl bg-white p-5 sm:p-7 shadow-soft ring-1 ring-slate-100 space-y-5">
        <div className="flex items-start gap-4">
          <span className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center ${meta.badge}`}>
            <TypeIcon className="h-7 w-7" />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{t(requestTypeKey(report.type))}</h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${status.pill}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {t(status.longKey && language !== 'en' ? status.longKey : `status.${report.status}`)}
              </span>
              {isMissingDocument(report) && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 bg-amber-50 text-amber-800 ring-amber-200">
                  <Paperclip className="h-3.5 w-3.5" />
                  {t('missing.document')}
                </span>
              )}
            </div>
          </div>
        </div>

        {isPettyCash ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2 rounded-2xl bg-slate-50 p-3">
              <dt className="text-slate-500">{t('petty.cash.description')}</dt>
              <dd className="font-medium text-slate-900" dir="auto">{report.description}</dd>
            </div>
            {report.projectName && (
              <div className="col-span-2 rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">{t('project')}</dt>
                <dd className="font-medium text-slate-900" dir="auto">{report.projectName}</dd>
              </div>
            )}
            <div className="rounded-2xl bg-slate-50 p-3">
              <dt className="text-slate-500">{t('petty.cash.expense.date')}</dt>
              <dd className="font-medium text-slate-900">{fmt(report.startDate.toDate())}</dd>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3">
              <dt className="text-amber-800/80">{t('petty.cash.total')}</dt>
              <dd className="text-lg font-bold text-slate-900">{formatAmount(report.totalAmount || 0)}</dd>
            </div>
          </dl>
        ) : editingDates ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t('wizard.from')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="field-input px-3"
                />
              </div>
              <div>
                <label className="field-label">{t('wizard.until')}</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="field-input px-3"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDates}
                disabled={saving}
                className="flex-1 rounded-xl bg-brand-navy px-4 py-3 font-medium text-white hover:bg-brand-navy-dark disabled:opacity-50"
              >
                {t('save')}
              </button>
              <button
                onClick={() => setEditingDates(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-medium text-slate-700 hover:bg-slate-200"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">{t('wizard.from')}</dt>
                <dd className="font-medium text-slate-900">{fmt(report.startDate.toDate())}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">{t('wizard.until')}</dt>
                <dd className="font-medium text-slate-900">{fmt((report.endDate || report.startDate).toDate())}</dd>
              </div>
            </dl>
            {editable && (
              <button onClick={() => setEditingDates(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:text-brand-navy">
                <Pencil className="h-4 w-4" />
                {t('report.edit.dates')}
              </button>
            )}
          </div>
        )}

        {!editable && report.status === 'handled' && (
          <p className="text-sm text-slate-500">{t('report.locked.handled')}</p>
        )}
        {!editable && report.status === 'paid' && (
          <p className="text-sm text-slate-500">{t('petty.cash.locked.paid')}</p>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 sm:p-7 shadow-soft ring-1 ring-slate-100 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
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
          <div className="pt-4 border-t border-slate-100 space-y-3">
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
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-navy/20 hover:bg-brand-navy-dark disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                {uploading ? t('submitting') : t('report.upload.files')}
              </button>
            )}
          </div>
        )}
      </div>

      {editable && (
        <button onClick={handleCancel} className="w-full rounded-2xl py-3 text-sm font-medium text-red-600 hover:bg-red-50">
          {t('report.cancel')}
        </button>
      )}
    </div>
  );
}
