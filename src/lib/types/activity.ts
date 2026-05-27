import { Timestamp } from 'firebase/firestore';

export type ActivityType =
  | 'person_added'
  | 'person_updated'
  | 'person_deleted'
  | 'relationship_added'
  | 'relationship_removed'
  | 'photo_added'
  | 'photo_deleted'
  | 'document_added'
  | 'document_deleted'
  | 'event_added'
  | 'event_deleted'
  | 'gedcom_imported'
  | 'tree_updated'
  | 'member_added'
  | 'member_removed';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  userId: string;
  userDisplayName: string | null;
  personId: string | null;
  timestamp: Timestamp;
}
