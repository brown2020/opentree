import { Timestamp } from 'firebase/firestore';

export type Gender = 'male' | 'female' | 'other' | 'unknown';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  maidenName: string | null;
  gender: Gender;
  birthDate: Timestamp | null;
  birthPlace: string | null;
  deathDate: Timestamp | null;
  deathPlace: string | null;
  isLiving: boolean;
  profilePhotoUrl: string | null;
  bio: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
