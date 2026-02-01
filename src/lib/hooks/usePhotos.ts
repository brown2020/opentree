'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadPhoto, deleteFile } from '@/lib/firebase/storage';
import { useAuth } from './useAuth';
import type { Photo, PhotoFormData } from '@/lib/types';

export function usePhotos(treeId: string | null, personId: string | null) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!treeId || !personId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'trees', treeId, 'persons', personId, 'photos'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Photo[];
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  }, [treeId, personId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const upload = async (
    file: File,
    data?: PhotoFormData
  ): Promise<string | null> => {
    if (!user || !treeId || !personId) return null;

    try {
      // Create photo document first to get ID
      const docRef = await addDoc(
        collection(db, 'trees', treeId, 'persons', personId, 'photos'),
        {
          url: '',
          thumbnailUrl: '',
          caption: data?.caption || null,
          date: null,
          isProfilePhoto: data?.isProfilePhoto || false,
          storagePath: '',
          createdAt: serverTimestamp(),
        }
      );

      // Upload file
      const { url, storagePath } = await uploadPhoto(
        user.uid,
        treeId,
        personId,
        file,
        docRef.id
      );

      // Update document with URL
      await updateDoc(docRef, {
        url,
        thumbnailUrl: url, // TODO: Generate actual thumbnails
        storagePath,
      });

      await fetchPhotos();
      return docRef.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      return null;
    }
  };

  const update = async (
    photoId: string,
    data: Partial<PhotoFormData>
  ): Promise<boolean> => {
    if (!treeId || !personId) return false;

    try {
      await updateDoc(
        doc(db, 'trees', treeId, 'persons', personId, 'photos', photoId),
        data
      );
      await fetchPhotos();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update photo');
      return false;
    }
  };

  const remove = async (photo: Photo): Promise<boolean> => {
    if (!treeId || !personId) return false;

    try {
      // Delete from storage
      if (photo.storagePath) {
        await deleteFile(photo.storagePath);
      }

      // Delete document
      await deleteDoc(
        doc(db, 'trees', treeId, 'persons', personId, 'photos', photo.id)
      );

      await fetchPhotos();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
      return false;
    }
  };

  const setAsProfile = async (photoId: string): Promise<boolean> => {
    if (!treeId || !personId) return false;

    try {
      // Remove profile flag from all other photos
      const updates = photos
        .filter((p) => p.isProfilePhoto)
        .map((p) =>
          updateDoc(
            doc(db, 'trees', treeId, 'persons', personId, 'photos', p.id),
            { isProfilePhoto: false }
          )
        );

      await Promise.all(updates);

      // Set new profile photo
      await updateDoc(
        doc(db, 'trees', treeId, 'persons', personId, 'photos', photoId),
        { isProfilePhoto: true }
      );

      // Update person's profilePhotoUrl
      const photo = photos.find((p) => p.id === photoId);
      if (photo) {
        await updateDoc(doc(db, 'trees', treeId, 'persons', personId), {
          profilePhotoUrl: photo.url,
        });
      }

      await fetchPhotos();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to set profile photo'
      );
      return false;
    }
  };

  return {
    photos,
    loading,
    error,
    refetch: fetchPhotos,
    upload,
    update,
    remove,
    setAsProfile,
  };
}
