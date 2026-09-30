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
import { createReport, isReportType, parseDateInput, requestTypeKey } from '@/lib/firebase/reports';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { countWorkdays } from '@/lib/workdays';
import { TYPE_META, TYPE_ORDER } from '@/lib/requestTypeMeta';
import { ArrowLeft, ArrowRight, CalendarDays, Loader2, Send } from 'lucide-react';

type RequestType = 'vacation' | 'extra_shift' | 'sick' | 'reserve' | 'petty_cash';
const TYPES_FROM_URL: RequestType[] = ['extra_shift', 'vacation', 'sick', 'reserve', 'petty_cash'];

function NewRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, hasRole } = useAuth();
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const typeFromUrl = searchParams.get('type') as RequestType | null;
  const validTypeFromUrl = !!typeFromUrl && TYPES_FROM_URL.includes(typeFromUrl);
  const [requestType, setRequestType] = useState<RequestType>(validTypeFromUrl ? typeFromUrl! : 'extra_shift');
  // Without a type in the link, the employee first picks one from big cards
  const [step, setStep] = useState<'type' | 'details'>(validTypeFromUrl ? 'details' : 'type');
  const [cameFromTypeStep, setCameFromTypeStep] = useState(!validTypeFromUrl);
  // The "+" button links here without a type: go back to the first step
  useEffect(() => {
    if (validTypeFromUrl) {
      setRequestType(typeFromUrl!);
      setStep('details');
    } else {
      setStep('type');
    }
    setCameFromTypeStep(!validTypeFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFromUrl]);
  const chooseType = (type: RequestType) => {
    setRequestType(type);
    setCameFromTypeStep(true);
    setStep('details');
  };
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
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-slate-200/70" />
        <div className="h-72 rounded-3xl bg-slate-200/70" />
      </div>
    );
  }

  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const Forward = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const meta = TYPE_META[requestType];
  const TypeIcon = meta.icon;
  const hasRange = requestType === 'vacation' || isSickOrReserve;
  const workdays = hasRange && startDate && endDate && endDate >= startDate
    ? countWorkdays(parseDateInput(startDate), parseDateInput(endDate))
    : null;

  // Step 1: choose what to submit
  if (step === 'type') {
    return (
      <div>
        <button
          type="button"
          onClick={() => router.push('/employee')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <Back className="h-4 w-4" />
          {t('wizard.back')}
        </button>
        <h1 className="text-2xl font-bold text-slate-900 mb-5">{t('wizard.choose.type')}</h1>
        <div className="space-y-3">
          {TYPE_ORDER.map((type) => {
            const m = TYPE_META[type];
            const Icon = m.icon;
            return (
              <button
                key={type}
                type="button"
                onClick={() => chooseType(type)}
                className="w-full flex items-center gap-4 rounded-2xl bg-white p-4 text-start shadow-soft ring-1 ring-slate-100 hover:ring-brand-blue/50 active:scale-[0.99] transition"
              >
                <span className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center ${m.badge}`}>
                  <Icon className="h-7 w-7" />
                </span>
                <span className="flex-1">
                  <span className="block text-lg font-semibold text-slate-900">{t(requestTypeKey(type))}</span>
                  <span className="block text-sm text-slate-500">{t(`tile.${type}.hint`)}</span>
                </span>
                <Forward className="h-5 w-5 text-slate-300" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2: the details of the chosen type
  return (
    <div>
      <button
        type="button"
        onClick={() => (cameFromTypeStep ? setStep('type') : router.push('/employee'))}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <Back className="h-4 w-4" />
        {t('wizard.back')}
      </button>

      <div className="flex items-center gap-4 mb-5">
        <span className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center ${meta.badge}`}>
          <TypeIcon className="h-7 w-7" />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">{t(meta.newKey)}</h1>
          <p className="text-sm text-slate-500">{t(isReport ? 'report.no.approval.needed' : `tile.${requestType}.hint`)}</p>
        </div>
        <button
          type="button"
          onClick={() => setStep('type')}
          className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-brand-blue-light"
        >
          {t('wizard.change.type')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl bg-white p-5 sm:p-7 shadow-soft ring-1 ring-slate-100">
        {requestType === 'extra_shift' && (
          <div>
            <label className="field-label">{t('project.name')}</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              className="field-input"
              placeholder={t('enter.project.name')}
            />
          </div>
        )}

        {isPettyCash && (
          <>
            <div>
              <label className="field-label">{t('petty.cash.description')}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={200}
                className="field-input"
                placeholder={t('petty.cash.description.placeholder')}
              />
            </div>
            <div>
              <label className="field-label">
                {t('project.name')} <span className="font-normal text-slate-400">({t('optional')})</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="field-input"
                placeholder={t('enter.project.name')}
              />
            </div>
          </>
        )}

        <div className={hasRange ? 'grid grid-cols-2 gap-3' : ''}>
          <div>
            <label className="field-label">
              {t(isPettyCash ? 'petty.cash.expense.date' : hasRange ? 'wizard.from' : 'wizard.shift.date')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="field-input px-3"
            />
          </div>
          {hasRange && (
            <div>
              <label className="field-label">{t('wizard.until')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || (requestType === 'vacation' ? new Date().toISOString().split('T')[0] : undefined)}
                className="field-input px-3"
              />
            </div>
          )}
        </div>

        {workdays !== null && (
          <p className="-mt-2 inline-flex items-center gap-2 rounded-full bg-brand-blue-light px-3 py-1 text-sm font-medium text-brand-navy">
            <CalendarDays className="h-4 w-4" />
            {workdays === 0 ? t('wizard.no.workdays') : workdays === 1 ? t('wizard.one.day') : t('wizard.n.days').replace('{n}', String(workdays))}
          </p>
        )}

        {isPettyCash && (
          <div>
            <label className="field-label">{t('petty.cash.receipts')}</label>
            <ReceiptPicker
              receipts={receipts}
              onChange={setReceipts}
              maxReceipts={MAX_RECEIPTS_PER_REQUEST}
              disabled={submitting}
            />
          </div>
        )}

        {isSickOrReserve && (
          <div>
            <label className="field-label">
              {t(requestType === 'sick' ? 'report.document.sick' : 'report.document.reserve')}
            </label>
            <AttachmentPicker files={files} onChange={setFiles} disabled={submitting} />
            {files.length === 0 && (
              <p className="mt-2 text-sm text-amber-700 text-center">{t('report.document.later')}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-navy/20 hover:bg-brand-navy-dark active:scale-[0.99] transition disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 rtl:-scale-x-100" />}
          {submitting ? t('submitting') : t(isReport ? 'wizard.send.to.office' : 'wizard.send.to.manager')}
        </button>
      </form>
    </div>
  );
}

export default function NewRequest() {
  return (
    <Suspense fallback={null}>
      <NewRequestContent />
    </Suspense>
  );
} 