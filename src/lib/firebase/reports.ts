import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { notifyManagers } from './firebaseUtils';
import { uploadAttachments, deleteAttachment, AttachmentMeta } from './attachments';
import { Request, RequestType } from '../types';

// "Reports" = sick leave, reserve duty and petty cash. Unlike vacation / extra shifts they need
// no manager approval: they are saved as 'submitted' and go straight to the office.
// The office marks them 'handled' (petty cash: 'paid'); until then the employee may
// add/remove files, edit dates (sick/reserve) or cancel.

export type ReportType = Extract<RequestType, 'sick' | 'reserve' | 'petty_cash'>;
export const REPORT_TYPES: ReportType[] = ['sick', 'reserve', 'petty_cash'];

export const isReportType = (type: string): type is ReportType =>
  (REPORT_TYPES as string[]).includes(type);

/** Translation key for a request type label. */
export const requestTypeKey = (type: string) => {
  switch (type) {
    case 'extra_shift': return 'extra.shift';
    case 'vacation': return 'vacation';
    case 'sick': return 'sick.leave';
    case 'reserve': return 'reserve.duty';
    case 'petty_cash': return 'petty.cash';
    default: return type;
  }
};

/** The final office status for a report type ('paid' for petty cash, otherwise 'handled'). */
export const doneStatusFor = (type: string) => (type === 'petty_cash' ? 'paid' : 'handled');

/** Report is still open for changes by the employee. */
export const isReportEditable = (request: Pick<Request, 'status'>) => request.status === 'submitted';

/** True when a report has no document / receipt attached yet. */
export const isMissingDocument = (request: Pick<Request, 'type' | 'status' | 'attachmentCount'>) =>
  isReportType(request.type) && request.status !== 'cancelled' && !request.attachmentCount;

export interface Receipt {
  file: File;
  amount: number;
}

interface CreateReportInput {
  type: ReportType;
  employeeId: string;
  managerId: string | null;
  startDate: Date;
  endDate?: Date; // sick / reserve only
  files: File[]; // sick / reserve
  receipts?: Receipt[]; // petty cash
  description?: string; // petty cash
  projectName?: string; // petty cash (optional)
  employeeName?: string;
}

/**
 * Creates the report first (so it exists even if a file upload fails - it then shows as
 * "missing document" and the employee can add the file later), then uploads the files.
 */
export const createReport = async (input: CreateReportInput) => {
  const isPettyCash = input.type === 'petty_cash';
  const ref = doc(collection(db, 'requests'));
  const now = Timestamp.now();
  await setDoc(ref, {
    id: ref.id,
    type: input.type,
    employeeId: input.employeeId,
    // Petty cash goes only to the office, so it is not linked to a manager
    managerId: isPettyCash ? '' : input.managerId || '',
    startDate: Timestamp.fromDate(input.startDate),
    ...(input.endDate ? { endDate: Timestamp.fromDate(input.endDate) } : {}),
    ...(isPettyCash
      ? { totalAmount: 0, description: input.description || '', ...(input.projectName ? { projectName: input.projectName } : {}) }
      : {}),
    status: 'submitted',
    attachmentCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  let uploadFailed = false;
  try {
    if (isPettyCash && input.receipts?.length) {
      await addReceipts(ref.id, input.employeeId, input.receipts);
    } else if (!isPettyCash && input.files.length > 0) {
      await addReportFiles(ref.id, input.employeeId, input.files);
    }
  } catch (error) {
    console.error('Error uploading report files:', error);
    uploadFailed = true;
  }

  // Let the managers know about sick / reserve (no approval needed). Failure must not fail the report.
  if (!isPettyCash) {
    try {
      const from = input.startDate.toLocaleDateString('he-IL');
      const to = (input.endDate || input.startDate).toLocaleDateString('he-IL');
      await notifyManagers({
        title: input.type === 'sick' ? 'Sick leave report' : 'Reserve duty report',
        message: `${input.employeeName || 'An employee'}: ${from} - ${to}`,
        relatedRequestId: ref.id,
        kind: 'report_submitted',
        params: { type: input.type, employeeName: input.employeeName || '', from, to },
      }, input.employeeId);
    } catch (error) {
      console.error('Error notifying manager:', error);
    }
  }

  return { id: ref.id, uploadFailed };
};

export const addReportFiles = async (requestId: string, ownerId: string, files: File[]) => {
  const ids = await uploadAttachments(files, ownerId, requestId);
  await updateDoc(doc(db, 'requests', requestId), {
    attachmentCount: increment(ids.length),
    updatedAt: Timestamp.now(),
  });
};

/** Petty cash: uploads receipts with their amounts and adds them to the request total. */
export const addReceipts = async (requestId: string, ownerId: string, receipts: Receipt[]) => {
  const amounts = receipts.map((r) => r.amount);
  const ids = await uploadAttachments(receipts.map((r) => r.file), ownerId, requestId, amounts);
  await updateDoc(doc(db, 'requests', requestId), {
    attachmentCount: increment(ids.length),
    totalAmount: increment(roundAmount(amounts.reduce((sum, a) => sum + a, 0))),
    updatedAt: Timestamp.now(),
  });
};

/** Removes a file (or petty cash receipt, subtracting its amount from the total). */
export const removeReportFile = async (requestId: string, attachment: Pick<AttachmentMeta, 'id' | 'amount'>) => {
  await deleteAttachment(attachment.id);
  await updateDoc(doc(db, 'requests', requestId), {
    attachmentCount: increment(-1),
    ...(attachment.amount ? { totalAmount: increment(-attachment.amount) } : {}),
    updatedAt: Timestamp.now(),
  });
};

export const updateReportDates = (requestId: string, startDate: Date, endDate: Date) =>
  updateDoc(doc(db, 'requests', requestId), {
    startDate: Timestamp.fromDate(startDate),
    endDate: Timestamp.fromDate(endDate),
    updatedAt: Timestamp.now(),
  });

export const cancelReport = (requestId: string) =>
  updateDoc(doc(db, 'requests', requestId), { status: 'cancelled', updatedAt: Timestamp.now() });

/** Office: mark as handled / paid (locks it for the employee), or reopen. */
export const setReportDone = (request: Pick<Request, 'id' | 'type'>, done: boolean, officeUserId: string) =>
  updateDoc(doc(db, 'requests', request.id), {
    status: done ? doneStatusFor(request.type) : 'submitted',
    handledBy: done ? officeUserId : null,
    updatedAt: Timestamp.now(),
  });

/** Rounds to agorot (2 decimals) to avoid floating point leftovers like 10.000000001. */
export const roundAmount = (amount: number) => Math.round(amount * 100) / 100;

export const getRequest = async (requestId: string) => {
  const snapshot = await getDoc(doc(db, 'requests', requestId));
  return snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as Request) : null;
};

/** Parses a yyyy-mm-dd value from a date input as a local date (midnight). */
export const parseDateInput = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Formats a Date as yyyy-mm-dd for a date input. */
export const toDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
