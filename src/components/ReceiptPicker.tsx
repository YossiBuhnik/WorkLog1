'use client';

import { useRef, useState } from 'react';
import { Paperclip, X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import {
  prepareFile,
  AttachmentError,
  ACCEPTED_FILE_TYPES,
  formatFileSize,
  formatAmount,
} from '@/lib/firebase/attachments';

export interface ReceiptDraft {
  file: File;
  amount: string; // as typed by the user; validated with parseReceiptAmount
}

/** Returns the amount as a number, or null when it is not a valid positive amount. */
export const parseReceiptAmount = (value: string): number | null => {
  const normalized = value.replace(/,/g, '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return amount > 0 && amount <= 100000 ? amount : null;
};

interface ReceiptPickerProps {
  receipts: ReceiptDraft[];
  onChange: (receipts: ReceiptDraft[]) => void;
  maxReceipts: number;
  disabled?: boolean;
}

/** Petty cash: pick receipt photos/PDFs and enter the amount of each one. */
export default function ReceiptPicker({ receipts, onChange, maxReceipts, disabled }: ReceiptPickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (selected.length === 0) return;

    const newErrors: string[] = [];
    const room = maxReceipts - receipts.length;
    if (selected.length > room) {
      newErrors.push(t('attachments.error.count').replace('{max}', String(maxReceipts)));
    }
    setProcessing(true);
    const added: ReceiptDraft[] = [];
    for (const file of selected.slice(0, Math.max(0, room))) {
      try {
        added.push({ file: await prepareFile(file), amount: '' });
      } catch (err) {
        const code = err instanceof AttachmentError ? err.code : null;
        const reason = code === 'unsupported-type' ? t('attachments.error.type')
          : code === 'too-large' ? t('attachments.error.size')
          : code === 'image-unreadable' ? t('attachments.error.unreadable')
          : t('attachments.error.generic');
        newErrors.push(`${file.name}: ${reason}`);
      }
    }
    setProcessing(false);
    setErrors(newErrors);
    if (added.length) onChange([...receipts, ...added]);
  };

  const setAmount = (index: number, amount: string) =>
    onChange(receipts.map((r, i) => (i === index ? { ...r, amount } : r)));

  const remove = (index: number) => onChange(receipts.filter((_, i) => i !== index));

  const total = receipts.reduce((sum, r) => sum + (parseReceiptAmount(r.amount) || 0), 0);

  return (
    <div>
      <input ref={inputRef} type="file" multiple accept={ACCEPTED_FILE_TYPES} onChange={handleSelect} className="hidden" />

      {receipts.length > 0 && (
        <ul className="mb-3 space-y-2">
          {receipts.map((receipt, index) => {
            const invalid = receipt.amount !== '' && parseReceiptAmount(receipt.amount) === null;
            return (
              <li key={`${receipt.file.name}-${index}`} className="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-slate-50 ring-1 ring-slate-200 rounded-xl text-sm">
                <span className="flex-1 min-w-0 truncate" dir="auto">{receipt.file.name}</span>
                <span className="text-gray-500 shrink-0">{formatFileSize(receipt.file.size)}</span>
                <label className="flex items-center gap-1 shrink-0">
                  <span className="text-gray-600">₪</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={receipt.amount}
                    onChange={(e) => setAmount(index, e.target.value)}
                    disabled={disabled}
                    placeholder={t('petty.cash.amount')}
                    aria-label={t('petty.cash.amount')}
                    className={`w-28 rounded-lg border bg-white px-2 text-sm py-1.5 ${invalid ? 'border-red-500' : 'border-slate-300'}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  className="text-gray-400 hover:text-red-600 shrink-0"
                  aria-label={t('attachments.remove')}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing || receipts.length >= maxReceipts}
        className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-brand-blue/40 rounded-2xl text-base font-medium text-brand-navy bg-brand-blue-light/50 hover:bg-brand-blue-light hover:border-brand-blue transition-colors disabled:opacity-50"
      >
        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-5 w-5" />}
        {processing ? t('attachments.processing') : t('petty.cash.add.receipt')}
      </button>
      <p className="mt-2 text-xs text-slate-500 text-center">
        {t('petty.cash.receipts.hint').replace('{max}', String(maxReceipts))}
      </p>

      {receipts.length > 0 && (
        <p className="mt-3 text-base font-semibold text-slate-900">
          {t('petty.cash.total')}: {formatAmount(total)}
        </p>
      )}

      {errors.length > 0 && (
        <ul className="mt-2 space-y-1">
          {errors.map((error) => (
            <li key={error} className="text-sm text-red-600" dir="auto">{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
