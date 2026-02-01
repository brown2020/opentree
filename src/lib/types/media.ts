import { Timestamp } from 'firebase/firestore';

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption: string | null;
  date: Timestamp | null;
  isProfilePhoto: boolean;
  storagePath: string;
  createdAt: Timestamp;
}

export interface PhotoFormData {
  caption?: string;
  date?: Date;
  isProfilePhoto?: boolean;
}

export type DocumentType =
  | 'birth_certificate'
  | 'death_certificate'
  | 'marriage_certificate'
  | 'census'
  | 'military'
  | 'immigration'
  | 'other';

export interface Document {
  id: string;
  url: string;
  name: string;
  type: DocumentType;
  description: string | null;
  date: Timestamp | null;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: Timestamp;
}

export interface DocumentFormData {
  name: string;
  type: DocumentType;
  description?: string;
  date?: Date;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  birth_certificate: 'Birth Certificate',
  death_certificate: 'Death Certificate',
  marriage_certificate: 'Marriage Certificate',
  census: 'Census Record',
  military: 'Military Record',
  immigration: 'Immigration Record',
  other: 'Other',
};
