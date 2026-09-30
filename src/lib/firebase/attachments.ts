import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  Bytes,
  Timestamp,
} from 'firebase/firestore';

// Files are stored inside Firestore (collection "attachments"), one document per file.
// Firestore limits a document to ~1MB, so each file must stay under MAX_FILE_BYTES.
// Images are shrunk automatically; PDFs that are too big are rejected with a clear error.
// Access (see firestore.rules): only the file's owner (the employee) and office users.

export const MAX_FILE_BYTES = 950 * 1024;
export const MAX_FILES_PER_REQUEST = 5;
export const MAX_RECEIPTS_PER_REQUEST = 10; // petty cash

/** Maximum number of files for a request type. */
export const maxFilesFor = (type: string) => (type === 'petty_cash' ? MAX_RECEIPTS_PER_REQUEST : MAX_FILES_PER_REQUEST);
export const ACCEPTED_FILE_TYPES = 'application/pdf,image/*';

export interface AttachmentMeta {
  id: string;
  ownerId: string;
  requestId: string;
  fileName: string;
  contentType: string;
  size: number;
  amount?: number; // petty cash receipts: amount in ILS
  createdAt: Timestamp;
}

export interface Attachment extends AttachmentMeta {
  data: Bytes;
}

export class AttachmentError extends Error {
  constructor(public code: 'unsupported-type' | 'too-large' | 'too-many-files' | 'image-unreadable', message: string) {
    super(message);
  }
}

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AttachmentError('image-unreadable', `Cannot read image ${file.name}`));
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

// Shrinks an image (resize + JPEG quality) until it fits under MAX_FILE_BYTES.
const compressImage = async (file: File): Promise<File> => {
  const img = await loadImage(file);
  const baseName = file.name.replace(/\.[^.]+$/, '');

  for (const maxSide of [2400, 1800, 1400, 1000]) {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) break;
    ctx.fillStyle = '#ffffff'; // transparent PNGs become white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.85, 0.7, 0.55]) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob && blob.size <= MAX_FILE_BYTES) {
        return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
      }
    }
  }
  throw new AttachmentError('too-large', `Image ${file.name} is too large even after compression`);
};

/**
 * Validates a file chosen by the user and returns a version that fits in Firestore.
 * Small images and PDFs are returned unchanged; large images are compressed.
 */
export const prepareFile = async (file: File): Promise<File> => {
  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  if (!isPdf && !isImage) {
    throw new AttachmentError('unsupported-type', `Unsupported file type: ${file.name}`);
  }
  if (file.size <= MAX_FILE_BYTES) return file;
  if (isPdf) {
    throw new AttachmentError('too-large', `PDF ${file.name} is larger than ${Math.round(MAX_FILE_BYTES / 1024)}KB`);
  }
  return compressImage(file);
};

/**
 * Saves already-prepared files for a request. Returns the new attachment ids.
 * `amounts` (petty cash receipts) must be in the same order as `files`.
 */
export const uploadAttachments = async (
  files: File[],
  ownerId: string,
  requestId: string,
  amounts?: number[]
): Promise<string[]> => {
  if (files.length > MAX_RECEIPTS_PER_REQUEST) {
    throw new AttachmentError('too-many-files', `At most ${MAX_RECEIPTS_PER_REQUEST} files are allowed`);
  }
  const ids: string[] = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const ref = doc(collection(db, 'attachments'));
    const buffer = new Uint8Array(await file.arrayBuffer());
    await setDoc(ref, {
      id: ref.id,
      ownerId,
      requestId,
      fileName: file.name,
      contentType: file.type,
      size: buffer.byteLength,
      data: Bytes.fromUint8Array(buffer),
      ...(amounts ? { amount: amounts[index] } : {}),
      createdAt: Timestamp.now(),
    });
    ids.push(ref.id);
  }
  return ids;
};

/**
 * Loads the attachments of a request.
 * Employees must pass their own uid as ownerId (the security rules only allow reading your own files);
 * office users can omit it to load everyone's files.
 */
export const getAttachmentsForRequest = async (requestId: string, ownerId?: string): Promise<Attachment[]> => {
  const constraints = [where('requestId', '==', requestId)];
  if (ownerId) constraints.push(where('ownerId', '==', ownerId));
  const snapshot = await getDocs(query(collection(db, 'attachments'), ...constraints));
  return snapshot.docs
    .map((d) => d.data() as Attachment)
    .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
};

export const deleteAttachment = (attachmentId: string) => deleteDoc(doc(db, 'attachments', attachmentId));

const toBlob = (attachment: Attachment) =>
  new Blob([attachment.data.toUint8Array()], { type: attachment.contentType });

/** Creates a temporary URL for showing the file inside the page. Call URL.revokeObjectURL when done. */
export const createAttachmentUrl = (attachment: Attachment) => URL.createObjectURL(toBlob(attachment));

/** Downloads the file to the user's computer with its original name. */
export const downloadAttachment = (attachment: Attachment) => {
  const url = URL.createObjectURL(toBlob(attachment));
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

/** Formats an amount in shekels, e.g. ₪1,234.50 */
export const formatAmount = (amount: number) =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    // Whole shekels without decimals (₪250); otherwise always two decimals (₪35.50)
    minimumFractionDigits: Number.isInteger(Math.round(amount * 100) / 100) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
