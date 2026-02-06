'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { ConfirmModal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { usePhotos } from '@/lib/hooks/usePhotos';
import { timestampToDate } from '@/lib/firebase/firestore';
import type { Photo } from '@/lib/types';

interface PhotoGalleryProps {
  treeId: string;
  personId: string;
}

export function PhotoGallery({ treeId, personId }: PhotoGalleryProps) {
  const { photos, loading, upload, remove, setAsProfile } = usePhotos(
    treeId,
    personId
  );
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    for (const file of files) {
      await upload(file);
    }
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!deletePhoto) return;
    setIsDeleting(true);
    await remove(deletePhoto);
    setIsDeleting(false);
    setDeletePhoto(null);
    if (selectedPhoto?.id === deletePhoto.id) {
      setSelectedPhoto(null);
    }
  };

  const handleSetAsProfile = async (photo: Photo) => {
    await setAsProfile(photo.id);
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
        onUpload={handleUpload}
        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
        maxFiles={10}
        disabled={uploading}
      >
        {uploading && (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Uploading...
            </span>
          </div>
        )}
      </FileUpload>

      {photos.length === 0 ? (
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No photos yet. Upload some to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
              onClick={() => setSelectedPhoto(photo)}
            >
              <Image
                src={photo.url}
                alt={photo.caption || 'Photo'}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              {photo.isProfilePhoto && (
                <div className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                  Profile
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      )}

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute right-4 top-4 text-white hover:text-gray-300"
            onClick={() => setSelectedPhoto(null)}
          >
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div
            className="max-h-[80vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Photo'}
              className="max-h-[70vh] rounded-lg object-contain"
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="text-white">
                {selectedPhoto.caption && (
                  <p className="font-medium">{selectedPhoto.caption}</p>
                )}
                {selectedPhoto.date && (() => {
                  const dateValue = timestampToDate(selectedPhoto.date);
                  return dateValue ? (
                    <p className="text-sm text-gray-300">
                      {format(dateValue, 'MMMM d, yyyy')}
                    </p>
                  ) : null;
                })()}
              </div>
              <div className="flex gap-2">
                {!selectedPhoto.isProfilePhoto && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetAsProfile(selectedPhoto)}
                  >
                    Set as Profile
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setDeletePhoto(selectedPhoto);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletePhoto}
        onClose={() => setDeletePhoto(null)}
        onConfirm={handleDelete}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
