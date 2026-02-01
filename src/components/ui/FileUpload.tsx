'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function FileUpload({
  onUpload,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  },
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  children,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        cursor-pointer rounded-lg border-2 border-dashed p-8 text-center
        transition-colors
        ${
          isDragActive
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
    >
      <input {...getInputProps()} />
      {children || (
        <div>
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isDragActive ? (
              'Drop files here...'
            ) : (
              <>
                Drag & drop files here, or{' '}
                <span className="text-emerald-600">browse</span>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB
            each
          </p>
        </div>
      )}
    </div>
  );
}
