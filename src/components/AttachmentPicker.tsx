'use client';

import { useRef, useState } from 'react';
import { Paperclip, X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import {
  prepareFile,
  AttachmentError,
  ACCEPTED_FILE_TYPES,
  MAX_FILES_PER_REQUEST,
  formatFileSize,
} from '@/lib/firebase/attachments';

interface AttachmentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

/** Lets the user pick PDFs/images; large images are compressed before they are added. */
export default function AttachmentPicker({ files, onChange, disabled }: AttachmentPickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const errorMessage = (err: unknown, fileName: string) => {
    if (err instanceof AttachmentError) {
      if (err.code === 'unsupported-type') return `${fileName}: ${t('attachments.error.type')}`;
      if (err.code === 'too-large') return `${fileName}: ${t('attachments.error.size')}`;
      if (err.code === 'image-unreadable') return `${fileName}: ${t('attachments.error.unreadable')}`;
    }
    return `${fileName}: ${t('attachments.error.generic')}`;
  };

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (selected.length === 0) return;

    const newErrors: string[] = [];
    const room = MAX_FILES_PER_REQUEST - files.length;
    if (selected.length > room) {
      newErrors.push(t('attachments.error.count').replace('{max}', String(MAX_FILES_PER_REQUEST)));
    }

    setProcessing(true);
    const prepared: File[] = [];
    for (const file of selected.slice(0, Math.max(0, room))) {
      try {
        prepared.push(await prepareFile(file));
      } catch (err) {
        newErrors.push(errorMessage(err, file.name));
      }
    }
    setProcessing(false);
    setErrors(newErrors);
    if (prepared.length) onChange([...files, ...prepared]);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing || files.length >= MAX_FILES_PER_REQUEST}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {processing ? t('attachments.processing') : t('attachments.add')}
      </button>
      <p className="mt-1 text-xs text-gray-500">
        {t('attachments.hint').replace('{max}', String(MAX_FILES_PER_REQUEST))}
      </p>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-md text-sm"
            >
              <span className="truncate" dir="auto">{file.name}</span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-gray-500">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  className="text-gray-400 hover:text-red-600"
                  aria-label={t('attachments.remove')}
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
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
