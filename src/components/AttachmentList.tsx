'use client';

import { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon, Eye, Download, Loader2, Trash2, X } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import {
  Attachment,
  getAttachmentsForRequest,
  createAttachmentUrl,
  downloadAttachment,
  formatFileSize,
  formatAmount,
} from '@/lib/firebase/attachments';

interface AttachmentListProps {
  requestId: string;
  /** Employees pass their own uid; office users omit it. */
  ownerId?: string;
  /** When given, a delete button is shown for each file. */
  onDelete?: (attachment: Attachment) => Promise<void>;
  /** Change this value to reload the list (e.g. after uploading more files). */
  refreshKey?: number;
}

/** Shows the files attached to a request, with view and download buttons. */
export default function AttachmentList({ requestId, ownerId, onDelete, refreshKey }: AttachmentListProps) {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ attachment: Attachment; url: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAttachmentsForRequest(requestId, ownerId)
      .then((list) => !cancelled && setAttachments(list))
      .catch((err) => {
        console.error('Error loading attachments:', err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId, ownerId, refreshKey]);

  const openPreview = (attachment: Attachment) => {
    setPreview({ attachment, url: createAttachmentUrl(attachment) });
  };

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!onDelete || !confirm(t('attachments.confirm.delete'))) return;
    setDeletingId(attachment.id);
    try {
      await onDelete(attachment);
      setAttachments((list) => list?.filter((a) => a.id !== attachment.id) ?? null);
    } finally {
      setDeletingId(null);
    }
  };

  if (failed) return <p className="text-sm text-red-600">{t('attachments.error.load')}</p>;
  if (!attachments) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
  if (attachments.length === 0) return <p className="text-sm text-gray-500">{t('attachments.none')}</p>;

  return (
    <>
    <ul className="space-y-2">
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-md text-sm"
        >
          <span className="flex items-center gap-2 min-w-0">
            {attachment.contentType === 'application/pdf'
              ? <FileText className="h-4 w-4 text-red-500 shrink-0" />
              : <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />}
            <span className="truncate" dir="auto">{attachment.fileName}</span>
            <span className="text-gray-500 shrink-0">{formatFileSize(attachment.size)}</span>
            {attachment.amount !== undefined && (
              <span className="font-semibold text-gray-900 shrink-0">{formatAmount(attachment.amount)}</span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => openPreview(attachment)}
              className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 hover:bg-emerald-50 rounded"
            >
              <Eye className="h-4 w-4" />
              {t('attachments.view')}
            </button>
            <button
              type="button"
              onClick={() => downloadAttachment(attachment)}
              className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 hover:bg-emerald-50 rounded"
            >
              <Download className="h-4 w-4" />
              {t('attachments.download')}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => handleDelete(attachment)}
                disabled={deletingId === attachment.id}
                className="inline-flex items-center px-2 py-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                aria-label={t('attachments.remove')}
              >
                {deletingId === attachment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
              <span className="font-medium truncate" dir="auto">{preview.attachment.fileName}</span>
              <span className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadAttachment(preview.attachment)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 hover:bg-emerald-50 rounded text-sm"
                >
                  <Download className="h-4 w-4" />
                  {t('attachments.download')}
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="p-1 text-gray-500 hover:text-gray-900 rounded"
                  aria-label={t('close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </span>
            </div>
            <div className="flex-1 min-h-0 bg-gray-100 flex items-center justify-center">
              {preview.attachment.contentType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.attachment.fileName} className="max-w-full max-h-full object-contain" />
              ) : (
                <iframe src={preview.url} title={preview.attachment.fileName} className="w-full h-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
