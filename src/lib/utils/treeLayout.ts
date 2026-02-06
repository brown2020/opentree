import type { Person } from '@/lib/types';

export function getNodeColor(person: Person): string {
  switch (person.gender) {
    case 'male':
      return '#3B82F6'; // blue-500
    case 'female':
      return '#EC4899'; // pink-500
    case 'other':
      return '#8B5CF6'; // violet-500
    default:
      return '#6B7280'; // gray-500
  }
}

export function getNodeBackgroundColor(person: Person): string {
  switch (person.gender) {
    case 'male':
      return '#DBEAFE'; // blue-100
    case 'female':
      return '#FCE7F3'; // pink-100
    case 'other':
      return '#EDE9FE'; // violet-100
    default:
      return '#F3F4F6'; // gray-100
  }
}
