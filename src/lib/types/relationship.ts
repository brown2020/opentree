import { Timestamp } from 'firebase/firestore';

export type RelationshipType = 'parent-child' | 'spouse';

export interface Relationship {
  id: string;
  type: RelationshipType;
  person1Id: string; // parent for parent-child, either spouse for spouse
  person2Id: string; // child for parent-child, either spouse for spouse
  marriageDate: Timestamp | null;
  divorceDate: Timestamp | null;
  createdAt: Timestamp;
}
