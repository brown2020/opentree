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
  deleteField,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from './config';
import {
  RESTRICTED_PROFILE_ID,
  personDataHasSensitiveFields,
  pickSensitiveFields,
  toPerson,
} from './personRecords';
import { deletePersonFiles } from './storage';
import { removePersonRelationships, deleteAllTreeRelationships } from './relationships';
import { deleteAllTreeMembers, deleteAllTreeInvites } from './members';
import { deleteAllTreeActivity } from './activity';
import type { Tree, Person } from '@/lib/types';
import type { TreeSchemaFormData, PersonSchemaFormData } from '@/lib/utils/validation';

// Firestore batches are limited to 500 operations
const BATCH_LIMIT = 500;

/**
 * Delete an array of document references in chunked batches of 500.
 */
export async function batchDeleteDocs(
  refs: DocumentReference[]
): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const chunk = refs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

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

  // Delete tree-level relationships, members, and activity
  await Promise.all([
    deleteAllTreeRelationships(treeId),
    deleteAllTreeMembers(treeId),
    deleteAllTreeInvites(treeId),
    deleteAllTreeActivity(treeId),
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
  await batchDeleteDocs(snapshot.docs.map((d) => d.ref));
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
    deleteSubcollectionDocs(personPath, 'restricted'),
  ]);

  // Delete storage files for this person
  await deletePersonFiles(userId, treeId, personId);

  // Delete the person document
  await deleteDoc(doc(db, 'trees', treeId, 'persons', personId));
}

function restrictedProfileRef(treeId: string, personId: string) {
  return doc(
    db,
    'trees',
    treeId,
    'persons',
    personId,
    'restricted',
    RESTRICTED_PROFILE_ID
  );
}

function isPermissionDenied(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'permission-denied'
  );
}

async function readRestrictedProfile(
  treeId: string,
  personId: string
): Promise<Record<string, unknown> | null> {
  try {
    const snap = await getDoc(restrictedProfileRef(treeId, personId));
    return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  } catch (err) {
    if (isPermissionDenied(err)) return null;
    throw err;
  }
}

/**
 * Move legacy sensitive fields off the public person document.
 * Fails closed for viewers: a permission error leaves the read path intact.
 */
async function migrateLegacySensitiveFields(
  treeId: string,
  docs: { id: string; data: () => Record<string, unknown> }[]
): Promise<void> {
  const legacy = docs.filter((d) => personDataHasSensitiveFields(d.data()));
  if (legacy.length === 0) return;

  try {
    for (let i = 0; i < legacy.length; i += 200) {
      const chunk = legacy.slice(i, i + 200);
      const batch = writeBatch(db);
      for (const personDoc of chunk) {
        const parent = personDoc.data();
        const existing = await readRestrictedProfile(treeId, personDoc.id);
        const restricted = {
          ...(existing ?? {}),
          ...pickSensitiveFields(parent),
          updatedAt: serverTimestamp(),
        };
        batch.set(restrictedProfileRef(treeId, personDoc.id), restricted, { merge: true });
        const clear: Record<string, unknown> = { updatedAt: serverTimestamp() };
        for (const key of Object.keys(pickSensitiveFields(parent))) {
          clear[key] = deleteField();
        }
        batch.update(doc(db, 'trees', treeId, 'persons', personDoc.id), clear);
      }
      await batch.commit();
    }
  } catch (err) {
    if (!isPermissionDenied(err)) throw err;
  }
}

// Person operations
export async function createPerson(
  treeId: string,
  data: PersonSchemaFormData
): Promise<string> {
  const personRef = doc(collection(db, 'trees', treeId, 'persons'));
  const batch = writeBatch(db);
  batch.set(personRef, {
    firstName: data.firstName,
    lastName: data.lastName,
    gender: data.gender,
    isLiving: data.isLiving,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(restrictedProfileRef(treeId, personRef.id), {
    middleName: data.middleName || null,
    maidenName: data.maidenName || null,
    birthDate: data.birthDate ? Timestamp.fromDate(data.birthDate) : null,
    birthPlace: data.birthPlace || null,
    deathDate: data.deathDate ? Timestamp.fromDate(data.deathDate) : null,
    deathPlace: data.deathPlace || null,
    bio: data.bio || null,
    profilePhotoUrl: null,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return personRef.id;
}

export async function getPerson(
  treeId: string,
  personId: string
): Promise<Person | null> {
  const docSnap = await getDoc(doc(db, 'trees', treeId, 'persons', personId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data() as Record<string, unknown>;
  await migrateLegacySensitiveFields(treeId, [{ id: docSnap.id, data: () => data }]);
  const restricted = await readRestrictedProfile(treeId, personId);
  return toPerson(docSnap.id, data, restricted);
}

export async function getTreePersons(treeId: string): Promise<Person[]> {
  const snapshot = await getDocs(collection(db, 'trees', treeId, 'persons'));
  const docs = snapshot.docs.map((d) => ({
    id: d.id,
    data: () => d.data() as Record<string, unknown>,
  }));
  await migrateLegacySensitiveFields(treeId, docs);
  return Promise.all(
    docs.map(async (d) => {
      const restricted = await readRestrictedProfile(treeId, d.id);
      return toPerson(d.id, d.data(), restricted);
    })
  );
}

export async function getTreePersonCount(treeId: string): Promise<number> {
  const snapshot = await getDocs(collection(db, 'trees', treeId, 'persons'));
  return snapshot.size;
}

export async function updatePerson(
  treeId: string,
  personId: string,
  data: Partial<PersonSchemaFormData>
): Promise<void> {
  const publicUpdate: Record<string, unknown> = {};
  const restrictedUpdate: Record<string, unknown> = {};

  if (data.firstName !== undefined) publicUpdate.firstName = data.firstName;
  if (data.lastName !== undefined) publicUpdate.lastName = data.lastName;
  if (data.gender !== undefined) publicUpdate.gender = data.gender;
  if (data.isLiving !== undefined) publicUpdate.isLiving = data.isLiving;

  if (data.middleName !== undefined) restrictedUpdate.middleName = data.middleName || null;
  if (data.maidenName !== undefined) restrictedUpdate.maidenName = data.maidenName || null;
  if (data.birthPlace !== undefined) restrictedUpdate.birthPlace = data.birthPlace || null;
  if (data.deathPlace !== undefined) restrictedUpdate.deathPlace = data.deathPlace || null;
  if (data.bio !== undefined) restrictedUpdate.bio = data.bio || null;
  if (data.birthDate !== undefined) {
    restrictedUpdate.birthDate = data.birthDate ? Timestamp.fromDate(data.birthDate) : null;
  }
  if (data.deathDate !== undefined) {
    restrictedUpdate.deathDate = data.deathDate ? Timestamp.fromDate(data.deathDate) : null;
  }

  const batch = writeBatch(db);
  let writes = 0;
  if (Object.keys(publicUpdate).length > 0) {
    publicUpdate.updatedAt = serverTimestamp();
    batch.update(doc(db, 'trees', treeId, 'persons', personId), publicUpdate);
    writes += 1;
  }
  if (Object.keys(restrictedUpdate).length > 0) {
    restrictedUpdate.updatedAt = serverTimestamp();
    batch.set(restrictedProfileRef(treeId, personId), restrictedUpdate, { merge: true });
    writes += 1;
  }
  if (writes === 0) return;
  await batch.commit();
}

export async function deletePerson(
  treeId: string,
  personId: string
): Promise<void> {
  const tree = await getTree(treeId);
  if (!tree) {
    throw new Error('Tree not found');
  }

  await removePersonRelationships(treeId, personId);
  await deletePersonAndSubcollections(treeId, personId, tree.userId);
}

// Helper to convert Firestore timestamp to Date
export function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null;
}
