import { parseGedcom, type ParsedFamily, type ParsedPerson } from './gedcom';

export type { ParsedPerson, ParsedFamily };

export interface GedcomImportSummary {
  personCount: number;
  familyCount: number;
  sampleNames: string[];
}

export function formatGedcomPersonName(person: Pick<ParsedPerson, 'firstName' | 'lastName'>): string {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return name || 'Unknown';
}

export function getGedcomImportSummary(
  persons: ParsedPerson[],
  families: ParsedFamily[]
): GedcomImportSummary {
  const sampleNames = persons.slice(0, 5).map(formatGedcomPersonName);
  return {
    personCount: persons.length,
    familyCount: families.length,
    sampleNames,
  };
}

export function parseGedcomForImport(content: string): {
  persons: ParsedPerson[];
  families: ParsedFamily[];
  summary: GedcomImportSummary;
} {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('The selected file is empty.');
  }

  const looksLikeGedcom =
    trimmed.includes('0 HEAD') ||
    trimmed.includes('0 INDI') ||
    /0 @\w+@ INDI/.test(trimmed) ||
    /0 @\w+@ FAM/.test(trimmed);

  if (!looksLikeGedcom) {
    throw new Error('This does not appear to be a valid GEDCOM file.');
  }

  const { persons, families } = parseGedcom(content);

  if (persons.length === 0 && families.length === 0) {
    throw new Error('No persons or families were found in this GEDCOM file.');
  }

  return {
    persons,
    families,
    summary: getGedcomImportSummary(persons, families),
  };
}
