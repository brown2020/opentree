import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './config';

export interface UploadResult {
  url: string;
  storagePath: string;
}

export async function uploadPhoto(
  userId: string,
  treeId: string,
  personId: string,
  file: File,
  photoId: string
): Promise<UploadResult> {
  const extension = file.name.split('.').pop() || 'jpg';
  const storagePath = `users/${userId}/trees/${treeId}/persons/${personId}/photos/${photoId}.${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, storagePath };
}

export async function uploadDocument(
  userId: string,
  treeId: string,
  personId: string,
  file: File,
  documentId: string
): Promise<UploadResult> {
  const extension = file.name.split('.').pop() || 'pdf';
  const storagePath = `users/${userId}/trees/${treeId}/persons/${personId}/documents/${documentId}.${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, storagePath };
}

export async function deleteFile(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}

export async function deletePersonFiles(
  userId: string,
  treeId: string,
  personId: string
): Promise<void> {
  const photosRef = ref(
    storage,
    `users/${userId}/trees/${treeId}/persons/${personId}/photos`
  );
  const documentsRef = ref(
    storage,
    `users/${userId}/trees/${treeId}/persons/${personId}/documents`
  );

  try {
    const photosList = await listAll(photosRef);
    await Promise.all(photosList.items.map((item) => deleteObject(item)));
  } catch {
    // Directory may not exist
  }

  try {
    const documentsList = await listAll(documentsRef);
    await Promise.all(documentsList.items.map((item) => deleteObject(item)));
  } catch {
    // Directory may not exist
  }
}
