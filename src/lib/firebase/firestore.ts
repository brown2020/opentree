import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Tree, TreeFormData, Person, PersonFormData } from '@/lib/types';

// Tree operations
export async function createTree(
  userId: string,
  data: TreeFormData
): Promise<string> {
  const docRef = await addDoc(collection(db, 'trees'), {
    userId,
    name: data.name,
    description: data.description || '',
    rootPersonId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getTree(treeId: string): Promise<Tree | null> {
  const docSnap = await getDoc(doc(db, 'trees', treeId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Tree;
}

export async function getUserTrees(userId: string): Promise<Tree[]> {
  const q = query(
    collection(db, 'trees'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Tree);
}

export async function updateTree(
  treeId: string,
  data: Partial<TreeFormData>
): Promise<void> {
  await updateDoc(doc(db, 'trees', treeId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTree(treeId: string): Promise<void> {
  await deleteDoc(doc(db, 'trees', treeId));
}

// Person operations
export async function createPerson(
  treeId: string,
  data: PersonFormData
): Promise<string> {
  const docRef = await addDoc(collection(db, 'trees', treeId, 'persons'), {
    firstName: data.firstName,
    lastName: data.lastName,
    middleName: data.middleName || null,
    maidenName: data.maidenName || null,
    gender: data.gender,
    birthDate: data.birthDate ? Timestamp.fromDate(data.birthDate) : null,
    birthPlace: data.birthPlace || null,
    deathDate: data.deathDate ? Timestamp.fromDate(data.deathDate) : null,
    deathPlace: data.deathPlace || null,
    isLiving: data.isLiving,
    profilePhotoUrl: null,
    bio: data.bio || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPerson(
  treeId: string,
  personId: string
): Promise<Person | null> {
  const docSnap = await getDoc(doc(db, 'trees', treeId, 'persons', personId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Person;
}

export async function getTreePersons(treeId: string): Promise<Person[]> {
  const snapshot = await getDocs(collection(db, 'trees', treeId, 'persons'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Person);
}

export async function updatePerson(
  treeId: string,
  personId: string,
  data: Partial<PersonFormData>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (data.birthDate !== undefined) {
    updateData.birthDate = data.birthDate
      ? Timestamp.fromDate(data.birthDate)
      : null;
  }
  if (data.deathDate !== undefined) {
    updateData.deathDate = data.deathDate
      ? Timestamp.fromDate(data.deathDate)
      : null;
  }

  await updateDoc(doc(db, 'trees', treeId, 'persons', personId), updateData);
}

export async function deletePerson(
  treeId: string,
  personId: string
): Promise<void> {
  await deleteDoc(doc(db, 'trees', treeId, 'persons', personId));
}

// Helper to convert Firestore timestamp to Date
export function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null;
}
