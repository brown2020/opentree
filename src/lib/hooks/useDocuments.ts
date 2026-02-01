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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadDocument, deleteFile } from '@/lib/firebase/storage';
import { useAuth } from './useAuth';
import type { Document, DocumentFormData } from '@/lib/types';

export function useDocuments(treeId: string | null, personId: string | null) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!treeId || !personId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'trees', treeId, 'persons', personId, 'documents'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Document[];
      setDocuments(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch documents'
      );
    } finally {
      setLoading(false);
    }
  }, [treeId, personId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const upload = async (
    file: File,
    data: DocumentFormData
  ): Promise<string | null> => {
    if (!user || !treeId || !personId) return null;

    try {
      // Create document first to get ID
      const docRef = await addDoc(
        collection(db, 'trees', treeId, 'persons', personId, 'documents'),
        {
          url: '',
          name: data.name || file.name,
          type: data.type,
          description: data.description || null,
          date: data.date ? Timestamp.fromDate(data.date) : null,
          storagePath: '',
          fileSize: file.size,
          mimeType: file.type,
          createdAt: serverTimestamp(),
        }
      );

      // Upload file
      const { url, storagePath } = await uploadDocument(
        user.uid,
        treeId,
        personId,
        file,
        docRef.id
      );

      // Update document with URL
      await updateDoc(docRef, { url, storagePath });

      await fetchDocuments();
      return docRef.id;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to upload document'
      );
      return null;
    }
  };

  const update = async (
    documentId: string,
    data: Partial<DocumentFormData>
  ): Promise<boolean> => {
    if (!treeId || !personId) return false;

    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.date !== undefined) {
        updateData.date = data.date ? Timestamp.fromDate(data.date) : null;
      }

      await updateDoc(
        doc(db, 'trees', treeId, 'persons', personId, 'documents', documentId),
        updateData
      );
      await fetchDocuments();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update document'
      );
      return false;
    }
  };

  const remove = async (document: Document): Promise<boolean> => {
    if (!treeId || !personId) return false;

    try {
      // Delete from storage
      if (document.storagePath) {
        await deleteFile(document.storagePath);
      }

      // Delete document
      await deleteDoc(
        doc(
          db,
          'trees',
          treeId,
          'persons',
          personId,
          'documents',
          document.id
        )
      );

      await fetchDocuments();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete document'
      );
      return false;
    }
  };

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    upload,
    update,
    remove,
  };
}
