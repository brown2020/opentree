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

export interface RelationshipFormData {
  type: RelationshipType;
  relatedPersonId: string;
  startDate?: Date;
  endDate?: Date;
}

export const INVERSE_RELATIONSHIPS: Record<RelationshipType, RelationshipType> = {
  parent: 'child',
  child: 'parent',
  spouse: 'spouse',
  sibling: 'sibling',
};
