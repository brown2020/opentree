import { Timestamp } from 'firebase/firestore';

export interface Tree {
  id: string;
  userId: string;
  name: string;
  description: string;
  rootPersonId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TreeFormData {
  name: string;
  description?: string;
}

export interface TreeWithStats extends Tree {
  personCount: number;
  photoCount: number;
  documentCount: number;
}
