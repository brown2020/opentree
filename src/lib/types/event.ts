import { Timestamp } from 'firebase/firestore';

export type EventType =
  | 'birth'
  | 'death'
  | 'marriage'
  | 'divorce'
  | 'graduation'
  | 'immigration'
  | 'military'
  | 'occupation'
  | 'residence'
  | 'custom';

export interface PersonEvent {
  id: string;
  type: EventType;
  title: string;
  description: string | null;
  date: Timestamp;
  endDate: Timestamp | null;
  place: string | null;
  createdAt: Timestamp;
}

export interface EventFormData {
  type: EventType;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  place?: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  birth: 'Birth',
  death: 'Death',
  marriage: 'Marriage',
  divorce: 'Divorce',
  graduation: 'Graduation',
  immigration: 'Immigration',
  military: 'Military Service',
  occupation: 'Occupation',
  residence: 'Residence',
  custom: 'Custom Event',
};
