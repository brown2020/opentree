'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { GedcomImportSummary } from '@/lib/utils/gedcomImport';

interface GedcomImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: GedcomImportSummary;
  fileName: string;
  existingPersonCount: number;
  loading?: boolean;
  error?: string | null;
}

export function GedcomImportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  summary,
  fileName,
  existingPersonCount,
  loading = false,
  error = null,
}: GedcomImportPreviewModalProps) {
  const isMerge = existingPersonCount > 0;
  const remainingNames = summary.personCount - summary.sampleNames.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import GEDCOM"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={loading}>
            Import
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Review the contents of{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">{fileName}</span>{' '}
          before adding them to your tree.
        </p>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Persons
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {summary.personCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Families
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {summary.familyCount}
            </dd>
          </div>
        </dl>

        {summary.sampleNames.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Sample names
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {summary.sampleNames.map((name, index) => (
                <li key={`${name}-${index}`} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                  {name}
                </li>
              ))}
              {remainingNames > 0 && (
                <li className="text-gray-500 dark:text-gray-400">
                  and {remainingNames} more…
                </li>
              )}
            </ul>
          </div>
        )}

        {isMerge && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
          >
            This tree already has {existingPersonCount}{' '}
            {existingPersonCount === 1 ? 'person' : 'people'}. Importing will{' '}
            <strong>merge</strong> new records into the existing tree — nothing will be
            replaced or deleted.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
