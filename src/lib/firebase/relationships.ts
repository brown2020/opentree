import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Relationship, RelationshipType } from '@/lib/types';

/**
 * Get all relationships for a tree (one query, no N+1 problem).
 */
export async function getTreeRelationships(
  treeId: string
): Promise<Relationship[]> {
  const snapshot = await getDocs(
    collection(db, 'trees', treeId, 'relationships')
  );
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Relationship
  );
}

/**
 * Add a relationship between two persons.
 */
export async function addRelationship(
  treeId: string,
  type: RelationshipType,
  person1Id: string,
  person2Id: string,
  marriageDate?: Date | null,
  divorceDate?: Date | null
): Promise<string> {
  const docRef = await addDoc(
    collection(db, 'trees', treeId, 'relationships'),
    {
      type,
      person1Id,
      person2Id,
      marriageDate: marriageDate ? Timestamp.fromDate(marriageDate) : null,
      divorceDate: divorceDate ? Timestamp.fromDate(divorceDate) : null,
      createdAt: serverTimestamp(),
    }
  );
  return docRef.id;
}

/**
 * Remove a relationship by ID.
 */
export async function removeRelationship(
  treeId: string,
  relationshipId: string
): Promise<void> {
  await deleteDoc(doc(db, 'trees', treeId, 'relationships', relationshipId));
}

/**
 * Remove all relationships referencing a specific person.
 */
export async function removePersonRelationships(
  treeId: string,
  personId: string
): Promise<void> {
  const relCol = collection(db, 'trees', treeId, 'relationships');

  const [q1, q2] = await Promise.all([
    getDocs(query(relCol, where('person1Id', '==', personId))),
    getDocs(query(relCol, where('person2Id', '==', personId))),
  ]);

  const allDocs = [...q1.docs, ...q2.docs];
  if (allDocs.length === 0) return;

  const batch = writeBatch(db);
  allDocs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

/**
 * Delete all relationships in a tree (used during tree deletion).
 */
export async function deleteAllTreeRelationships(
  treeId: string
): Promise<void> {
  const snapshot = await getDocs(
    collection(db, 'trees', treeId, 'relationships')
  );
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

/**
 * Build an adjacency map from relationships for quick lookups.
 */
export function buildAdjacencyMap(
  personIds: string[],
  relationships: Relationship[]
): Map<
  string,
  { parents: string[]; children: string[]; spouses: string[] }
> {
  const map = new Map<
    string,
    { parents: string[]; children: string[]; spouses: string[] }
  >();

  for (const id of personIds) {
    map.set(id, { parents: [], children: [], spouses: [] });
  }

  for (const rel of relationships) {
    const p1 = map.get(rel.person1Id);
    const p2 = map.get(rel.person2Id);

    if (rel.type === 'parent-child') {
      // person1 is parent, person2 is child
      if (p2) p2.parents.push(rel.person1Id);
      if (p1) p1.children.push(rel.person2Id);
    } else if (rel.type === 'spouse') {
      if (p1) p1.spouses.push(rel.person2Id);
      if (p2) p2.spouses.push(rel.person1Id);
    }
  }

  return map;
}
