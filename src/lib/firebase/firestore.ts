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
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { deletePersonFiles } from './storage';
import { removePersonRelationships, deleteAllTreeRelationships } from './relationships';
import { deleteAllTreeMembers } from './members';
import type { Tree, Person } from '@/lib/types';
import type { TreeSchemaFormData, PersonSchemaFormData } from '@/lib/utils/validation';

// Tree operations
export async function createTree(
  userId: string,
  data: TreeSchemaFormData
): Promise<string> {
  const docRef = await addDoc(collection(db, 'trees'), {
    userId,
    name: data.name,
    description: data.description || '',
    rootPersonId: null,
    isPublic: false,
    memberIds: [],
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
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Tree);
}

export async function getSharedTrees(userId: string): Promise<Tree[]> {
  const q = query(
    collection(db, 'trees'),
    where('memberIds', 'array-contains', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Tree);
}

export async function updateTree(
  treeId: string,
  data: Partial<TreeSchemaFormData> & { rootPersonId?: string | null; isPublic?: boolean }
): Promise<void> {
  await updateDoc(doc(db, 'trees', treeId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTree(
  treeId: string,
  userId: string
): Promise<void> {
  // Delete all persons and their nested subcollections + storage files
  const personsSnapshot = await getDocs(
    collection(db, 'trees', treeId, 'persons')
  );

  for (const personDoc of personsSnapshot.docs) {
    await deletePersonAndSubcollections(treeId, personDoc.id, userId);
  }

  // Delete tree-level relationships and members
  await Promise.all([
    deleteAllTreeRelationships(treeId),
    deleteAllTreeMembers(treeId),
  ]);

  // Finally, delete the tree document itself
  await deleteDoc(doc(db, 'trees', treeId));
}

async function deleteSubcollectionDocs(
  parentPath: string,
  subcollectionName: string
): Promise<void> {
  const snapshot = await getDocs(
    collection(doc(db, parentPath), subcollectionName)
  );
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function deletePersonAndSubcollections(
  treeId: string,
  personId: string,
  userId: string
): Promise<void> {
  const personPath = `trees/${treeId}/persons/${personId}`;

  // Delete nested subcollections
  await Promise.all([
    deleteSubcollectionDocs(personPath, 'photos'),
    deleteSubcollectionDocs(personPath, 'documents'),
    deleteSubcollectionDocs(personPath, 'events'),
  ]);

  // Delete storage files for this person
  await deletePersonFiles(userId, treeId, personId);

  // Delete the person document
  await deleteDoc(doc(db, 'trees', treeId, 'persons', personId));
}

// Person operations
export async function createPerson(
  treeId: string,
  data: PersonSchemaFormData
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
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Person);
}

export async function updatePerson(
  treeId: string,
  personId: string,
  data: Partial<PersonSchemaFormData>
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
  personId: string,
  userId: string
): Promise<void> {
  // Remove relationships referencing this person
  await removePersonRelationships(treeId, personId);
  await deletePersonAndSubcollections(treeId, personId, userId);
}

// Helper to convert Firestore timestamp to Date
export function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null;
}
