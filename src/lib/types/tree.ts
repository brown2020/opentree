import { Timestamp } from 'firebase/firestore';

export type MemberRole = 'editor' | 'viewer';

export interface TreeMember {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: MemberRole;
  addedBy: string;
  addedAt: Timestamp;
}

export interface Tree {
  id: string;
  userId: string;
  name: string;
  description: string;
  rootPersonId: string | null;
  isPublic: boolean;
  memberIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
