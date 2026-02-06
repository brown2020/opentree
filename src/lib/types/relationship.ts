import { Timestamp } from 'firebase/firestore';

export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling';

export interface Relationship {
  id: string;
  type: RelationshipType;
  relatedPersonId: string;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  createdAt: Timestamp;
}
