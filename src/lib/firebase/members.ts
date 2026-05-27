import {
  collection,
  collectionGroup,
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
import { inviteDocIdFromEmail, normalizeInviteEmail } from './inviteEmail';
import type { TreeMember, TreeInvite, MemberRole } from '@/lib/types';

export type AddTreeMemberResult = {
  success: boolean;
  pending?: boolean;
  error?: string;
};

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
 * Get pending invites for a tree (owner only per security rules).
 */
export async function getTreeInvites(treeId: string): Promise<TreeInvite[]> {
  const snapshot = await getDocs(
    collection(db, 'trees', treeId, 'invites')
  );
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as TreeInvite
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

async function addMemberToTree(
  treeId: string,
  userId: string,
  email: string,
  displayName: string | null,
  role: MemberRole,
  addedBy: string
): Promise<void> {
  const batch = writeBatch(db);

  batch.set(doc(db, 'trees', treeId, 'members', userId), {
    userId,
    email,
    displayName,
    role,
    addedBy,
    addedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'trees', treeId), {
    memberIds: arrayUnion(userId),
  });

  await batch.commit();
}

/**
 * Add a member to a tree by email, or create a pending invite if no account exists.
 */
export async function addTreeMember(
  treeId: string,
  email: string,
  role: MemberRole,
  addedBy: string
): Promise<AddTreeMemberResult> {
  const normalizedEmail = normalizeInviteEmail(email);
  if (!normalizedEmail) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    const inviteId = inviteDocIdFromEmail(normalizedEmail);
    const inviteRef = doc(db, 'trees', treeId, 'invites', inviteId);

    const existingInvite = await getDoc(inviteRef);
    if (existingInvite.exists()) {
      return {
        success: false,
        error: 'An invite is already pending for this email.',
      };
    }

    const batch = writeBatch(db);
    batch.set(inviteRef, {
      email: normalizedEmail,
      role,
      addedBy,
      addedAt: serverTimestamp(),
    });
    await batch.commit();

    return { success: true, pending: true };
  }

  const existingDoc = await getDoc(
    doc(db, 'trees', treeId, 'members', user.uid)
  );
  if (existingDoc.exists()) {
    return { success: false, error: 'This person is already a member.' };
  }

  const treeDoc = await getDoc(doc(db, 'trees', treeId));
  if (treeDoc.exists() && treeDoc.data()?.userId === user.uid) {
    return { success: false, error: 'This person is the tree owner.' };
  }

  await addMemberToTree(
    treeId,
    user.uid,
    normalizedEmail,
    user.displayName,
    role,
    addedBy
  );

  const inviteRef = doc(
    db,
    'trees',
    treeId,
    'invites',
    inviteDocIdFromEmail(normalizedEmail)
  );
  const pendingInvite = await getDoc(inviteRef);
  if (pendingInvite.exists()) {
    const batch = writeBatch(db);
    batch.delete(inviteRef);
    await batch.commit();
  }

  return { success: true, pending: false };
}

/**
 * Revoke a pending invite.
 */
export async function revokeTreeInvite(
  treeId: string,
  inviteId: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'trees', treeId, 'invites', inviteId));
  await batch.commit();
}

/**
 * Resolve pending invites for a user after signup and email verification.
 */
export async function resolvePendingInvitesForUser(
  userId: string,
  email: string,
  displayName: string | null
): Promise<number> {
  const normalizedEmail = normalizeInviteEmail(email);
  if (!normalizedEmail) return 0;

  const userDoc = await getDoc(doc(db, 'users', userId));
  const storedEmail = userDoc.data()?.email as string | undefined;
  const queryEmail = normalizeInviteEmail(storedEmail || normalizedEmail);

  const snapshot = await getDocs(
    query(
      collectionGroup(db, 'invites'),
      where('email', '==', queryEmail)
    )
  );

  if (snapshot.empty) return 0;

  let resolved = 0;

  for (const inviteDoc of snapshot.docs) {
    const treeId = inviteDoc.ref.parent.parent?.id;
    if (!treeId) continue;

    const invite = inviteDoc.data() as Omit<TreeInvite, 'id'>;

    const treeDoc = await getDoc(doc(db, 'trees', treeId));
    if (!treeDoc.exists()) {
      const batch = writeBatch(db);
      batch.delete(inviteDoc.ref);
      await batch.commit();
      continue;
    }

    if (treeDoc.data()?.userId === userId) {
      const batch = writeBatch(db);
      batch.delete(inviteDoc.ref);
      await batch.commit();
      continue;
    }

    const memberDoc = await getDoc(
      doc(db, 'trees', treeId, 'members', userId)
    );
    if (memberDoc.exists()) {
      const batch = writeBatch(db);
      batch.delete(inviteDoc.ref);
      await batch.commit();
      continue;
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'trees', treeId, 'members', userId), {
      userId,
      email: normalizedEmail,
      displayName,
      role: invite.role,
      addedBy: invite.addedBy,
      addedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'trees', treeId), {
      memberIds: arrayUnion(userId),
    });
    batch.delete(inviteDoc.ref);
    await batch.commit();
    resolved++;
  }

  return resolved;
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

/**
 * Delete all pending invites for a tree (used during tree deletion).
 */
export async function deleteAllTreeInvites(treeId: string): Promise<void> {
  const snapshot = await getDocs(
    collection(db, 'trees', treeId, 'invites')
  );
  if (snapshot.empty) return;
  await batchDeleteDocs(snapshot.docs.map((d) => d.ref));
}
