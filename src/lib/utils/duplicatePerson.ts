import type { Person } from '@/lib/types';
import type { ParsedPerson } from '@/lib/utils/gedcom';

export interface SimilarPersonMatch {
  person: Person;
  birthYear: number | null;
}

export interface GedcomDuplicateMatch {
  importName: string;
  importBirthYear: number | null;
  existingPerson: Person;
}

function normalizeNamePart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizePersonName(firstName: string, lastName: string): string {
  return `${normalizeNamePart(firstName)} ${normalizeNamePart(lastName)}`.trim();
}

export function getBirthYear(date: Date | null | undefined): number | null {
  if (!date) return null;
  const year = date.getFullYear();
  return Number.isNaN(year) ? null : year;
}

function personBirthDate(person: Person): Date | null {
  if (!person.birthDate) return null;
  return person.birthDate.toDate();
}

export function namesAreSimilar(
  firstName: string,
  lastName: string,
  person: Pick<Person, 'firstName' | 'lastName'>
): boolean {
  return (
    normalizePersonName(firstName, lastName) ===
    normalizePersonName(person.firstName, person.lastName)
  );
}

/** True when birth years match, or either side lacks a year (name-only signal). */
export function birthYearsCompatible(
  birthDateA: Date | null | undefined,
  birthDateB: Date | null | undefined
): boolean {
  const yearA = getBirthYear(birthDateA ?? null);
  const yearB = getBirthYear(birthDateB ?? null);
  if (yearA != null && yearB != null) return yearA === yearB;
  return true;
}

export function findSimilarPersons(
  firstName: string,
  lastName: string,
  birthDate: Date | null | undefined,
  persons: Person[],
  excludePersonId?: string
): SimilarPersonMatch[] {
  return persons
    .filter((person) => person.id !== excludePersonId)
    .filter(
      (person) =>
        namesAreSimilar(firstName, lastName, person) &&
        birthYearsCompatible(birthDate ?? null, personBirthDate(person))
    )
    .map((person) => ({
      person,
      birthYear: getBirthYear(personBirthDate(person)),
    }));
}

/** Match import records against existing tree persons (deduped by existing person id). */
export function findGedcomImportDuplicates(
  parsedPersons: ParsedPerson[],
  existingPersons: Person[]
): GedcomDuplicateMatch[] {
  const seen = new Set<string>();
  const matches: GedcomDuplicateMatch[] = [];

  for (const parsed of parsedPersons) {
    const similar = findSimilarPersons(
      parsed.firstName,
      parsed.lastName,
      parsed.birthDate,
      existingPersons
    );

    for (const match of similar) {
      if (seen.has(match.person.id)) continue;
      seen.add(match.person.id);
      matches.push({
        importName: `${parsed.firstName} ${parsed.lastName}`.trim(),
        importBirthYear: getBirthYear(parsed.birthDate),
        existingPerson: match.person,
      });
    }
  }

  return matches;
}
