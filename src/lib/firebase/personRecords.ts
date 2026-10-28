import type { Person, Gender } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { isRenderableImageUrl } from '@/lib/utils/imageUrl';

/** Fields that must not sit on a publicly readable person document. */
export const SENSITIVE_PERSON_KEYS = [
  'middleName',
  'maidenName',
  'birthDate',
  'birthPlace',
  'deathDate',
  'deathPlace',
  'bio',
  'profilePhotoUrl',
] as const;

export type SensitivePersonKey = (typeof SENSITIVE_PERSON_KEYS)[number];

export const RESTRICTED_PROFILE_ID = 'profile';

const GENDERS: readonly Gender[] = ['male', 'female', 'other', 'unknown'];

export function personDataHasSensitiveFields(
  data: object | null | undefined
): boolean {
  if (!data) return false;
  const record = data as Record<string, unknown>;
  return SENSITIVE_PERSON_KEYS.some((key) => record[key] !== undefined);
}

export function pickSensitiveFields(
  data: object
): Partial<Record<SensitivePersonKey, unknown>> {
  const record = data as Record<string, unknown>;
  const picked: Partial<Record<SensitivePersonKey, unknown>> = {};
  for (const key of SENSITIVE_PERSON_KEYS) {
    if (record[key] !== undefined) picked[key] = record[key];
  }
  return picked;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asGender(value: unknown): Gender {
  return typeof value === 'string' && GENDERS.includes(value as Gender)
    ? (value as Gender)
    : 'unknown';
}

/** Merge a public person document with its restricted profile. Restricted wins. */
export function toPerson(
  id: string,
  data: Record<string, unknown>,
  restricted?: Record<string, unknown> | null
): Person {
  const merged: Record<string, unknown> = { ...data, ...(restricted ?? {}) };
  return {
    id,
    firstName: typeof merged.firstName === 'string' ? merged.firstName : '',
    lastName: typeof merged.lastName === 'string' ? merged.lastName : '',
    middleName: asNullableString(merged.middleName),
    maidenName: asNullableString(merged.maidenName),
    gender: asGender(merged.gender),
    birthDate: (merged.birthDate as Timestamp | null) ?? null,
    birthPlace: asNullableString(merged.birthPlace),
    deathDate: (merged.deathDate as Timestamp | null) ?? null,
    deathPlace: asNullableString(merged.deathPlace),
    isLiving: merged.isLiving !== false,
    profilePhotoUrl: isRenderableImageUrl(asNullableString(merged.profilePhotoUrl))
      ? asNullableString(merged.profilePhotoUrl)
      : null,
    bio: asNullableString(merged.bio),
    createdAt: merged.createdAt as Timestamp,
    updatedAt: merged.updatedAt as Timestamp,
  };
}
