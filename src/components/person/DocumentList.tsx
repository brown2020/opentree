'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useDocuments } from '@/lib/hooks/useDocuments';
import { timestampToDate } from '@/lib/firebase/firestore';
import { DOCUMENT_TYPE_LABELS } from '@/lib/types';
import type { Document, DocumentFormData } from '@/lib/types';

interface DocumentListProps {
  treeId: string;
  personId: string;
}

export function DocumentList({ treeId, personId }: DocumentListProps) {
  const { documents, loading, upload, remove } = useDocuments(
    treeId,
    personId
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset } = useForm<DocumentFormData>({
    defaultValues: {
      type: 'other',
    },
  });

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setUploadModalOpen(true);
    }
  };

  const handleUpload = async (data: DocumentFormData) => {
    if (!selectedFile) return;

    setUploading(true);
    await upload(selectedFile, {
      ...data,
      name: data.name || selectedFile.name,
    });
    setUploading(false);
    setUploadModalOpen(false);
    setSelectedFile(null);
    reset();
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    await remove(deleteDoc);
    setIsDeleting(false);
    setDeleteDoc(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 16.5v-2h1.5c.55 0 1-.45 1-1s-.45-1-1-1H9.5c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1s1-.45 1-1h1.5c1.1 0 2-.9 2-2s-.9-2-2-2H9.5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2s2-.9 2-2h-1z" />
        </svg>
      );
    }
    if (mimeType.includes('image')) {
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FileUpload
        onUpload={handleFileSelect}
        accept={{
          'application/pdf': ['.pdf'],
          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.tiff'],
        }}
        maxFiles={1}
      />

      {documents.length === 0 ? (
        <div className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No documents yet. Upload some to get started.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          {documents.map((doc) => {
            const dateValue = doc.date ? timestampToDate(doc.date) : null;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-700">
                  {getDocumentIcon(doc.mimeType)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{DOCUMENT_TYPE_LABELS[doc.type]}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    {dateValue && (
                      <>
                        <span>•</span>
                        <span>{format(dateValue, 'MMM d, yyyy')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </a>
                  <button
                    onClick={() => setDeleteDoc(doc)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload details modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setSelectedFile(null);
          reset();
        }}
        title="Document Details"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setUploadModalOpen(false);
                setSelectedFile(null);
                reset();
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleUpload)} loading={uploading}>
              Upload
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Document Name"
            placeholder={selectedFile?.name}
            {...register('name')}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Document Type
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              {...register('type')}
            >
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Description
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              {...register('description')}
            />
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDoc?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
