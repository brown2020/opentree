import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './config';
import { batchDeleteDocs } from './firestore';
import type { TreeMember, MemberRole } from '@/lib/types';

/**
 * Get all members of a tree.
 */
export async function getTreeMembers(
  treeId: string
): Promise<TreeMember[]> {
  const snapshot = await getDocs(
    collection(db, 'trees', treeId, 'members')
  );
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as TreeMember
  );
}

/**
 * Find a user by email in the users collection.
 */
async function findUserByEmail(
  email: string
): Promise<{ uid: string; displayName: string | null } | null> {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const userData = snapshot.docs[0];
  return {
    uid: userData.id,
    displayName: (userData.data().displayName as string) || null,
  };
}

/**
 * Add a member to a tree by email.
 * Looks up the user by email, adds them to the members subcollection,
 * and updates the tree's memberIds array atomically.
 */
export async function addTreeMember(
  treeId: string,
  email: string,
  role: MemberRole,
  addedBy: string
): Promise<{ success: boolean; error?: string }> {
  const user = await findUserByEmail(email);
  if (!user) {
    return {
      success: false,
      error: 'No account found with that email. They need to sign up first.',
    };
  }

  // Check if already a member
  const existingDoc = await getDoc(
    doc(db, 'trees', treeId, 'members', user.uid)
  );
  if (existingDoc.exists()) {
    return { success: false, error: 'This person is already a member.' };
  }

  // Check they're not the owner
  const treeDoc = await getDoc(doc(db, 'trees', treeId));
  if (treeDoc.exists() && treeDoc.data()?.userId === user.uid) {
    return { success: false, error: 'This person is the tree owner.' };
  }

  const batch = writeBatch(db);

  // Add member document
  batch.set(doc(db, 'trees', treeId, 'members', user.uid), {
    userId: user.uid,
    email,
    displayName: user.displayName,
    role,
    addedBy,
    addedAt: serverTimestamp(),
  });

  // Add userId to tree's memberIds array
  batch.update(doc(db, 'trees', treeId), {
    memberIds: arrayUnion(user.uid),
  });

  await batch.commit();
  return { success: true };
}

/**
 * Remove a member from a tree.
 */
export async function removeTreeMember(
  treeId: string,
  userId: string
): Promise<void> {
  const batch = writeBatch(db);

  batch.delete(doc(db, 'trees', treeId, 'members', userId));
  batch.update(doc(db, 'trees', treeId), {
    memberIds: arrayRemove(userId),
  });

  await batch.commit();
}

/**
 * Update a member's role.
 */
export async function updateMemberRole(
  treeId: string,
  userId: string,
  role: MemberRole
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'trees', treeId, 'members', userId), { role });
  await batch.commit();
}

/**
 * Delete all members of a tree (used during tree deletion).
 */
export async function deleteAllTreeMembers(
  treeId: string
): Promise<void> {
  const snapshot = await getDocs(
    collection(db, 'trees', treeId, 'members')
  );
  if (snapshot.empty) return;
  await batchDeleteDocs(snapshot.docs.map((d) => d.ref));
}
