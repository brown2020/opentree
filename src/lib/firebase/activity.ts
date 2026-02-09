import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { batchDeleteDocs } from './firestore';
import type { Activity, ActivityType } from '@/lib/types/activity';

/**
 * Log an activity event for a tree.
 */
export async function logActivity(
  treeId: string,
  type: ActivityType,
  description: string,
  userId: string,
  userDisplayName: string | null,
  personId: string | null = null
): Promise<void> {
  await addDoc(collection(db, 'trees', treeId, 'activity'), {
    type,
    description,
    userId,
    userDisplayName,
    personId,
    timestamp: serverTimestamp(),
  });
}

/**
 * Get recent activity for a tree.
 */
export async function getTreeActivity(
  treeId: string,
  maxItems = 20
): Promise<Activity[]> {
  const q = query(
    collection(db, 'trees', treeId, 'activity'),
    orderBy('timestamp', 'desc'),
    limit(maxItems)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Activity);
}

/**
 * Delete all activity for a tree (used during tree deletion).
 */
export async function deleteAllTreeActivity(
  treeId: string
): Promise<void> {
  const snapshot = await getDocs(
    collection(db, 'trees', treeId, 'activity')
  );
  if (snapshot.empty) return;
  await batchDeleteDocs(snapshot.docs.map((d) => d.ref));
}
