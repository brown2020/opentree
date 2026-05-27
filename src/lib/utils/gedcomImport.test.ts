import { describe, it, expect } from 'vitest';
import {
  formatGedcomPersonName,
  getGedcomImportSummary,
  parseGedcomForImport,
} from './gedcomImport';
import type { ParsedFamily, ParsedPerson } from './gedcom';

const samplePerson: ParsedPerson = {
  gedcomId: 'I1',
  firstName: 'John',
  lastName: 'Smith',
  gender: 'male',
  birthDate: null,
  birthPlace: null,
  deathDate: null,
  deathPlace: null,
  isLiving: true,
  bio: null,
};

const sampleFamily: ParsedFamily = {
  gedcomId: 'F1',
  husbandId: 'I1',
  wifeId: 'I2',
  childIds: ['I3'],
  marriageDate: null,
  divorceDate: null,
};

const minimalGedcom = `0 HEAD
1 SOUR OpenTree
0 @I1@ INDI
1 NAME John /Smith/
1 SEX M
0 @I2@ INDI
1 NAME Jane /Smith/
1 SEX F
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 @I3@ INDI
1 NAME Bob /Smith/
1 SEX M
0 TRLR
`;

describe('formatGedcomPersonName', () => {
  it('joins first and last name', () => {
    expect(formatGedcomPersonName(samplePerson)).toBe('John Smith');
  });

  it('returns Unknown when names are empty', () => {
    expect(formatGedcomPersonName({ firstName: '', lastName: '' })).toBe('Unknown');
  });
});

describe('getGedcomImportSummary', () => {
  it('returns counts and up to five sample names', () => {
    const persons = Array.from({ length: 8 }, (_, i) => ({
      ...samplePerson,
      gedcomId: `I${i}`,
      firstName: `Person${i}`,
    }));

    const summary = getGedcomImportSummary(persons, [sampleFamily]);

    expect(summary.personCount).toBe(8);
    expect(summary.familyCount).toBe(1);
    expect(summary.sampleNames).toHaveLength(5);
    expect(summary.sampleNames[0]).toBe('Person0 Smith');
  });
});

describe('parseGedcomForImport', () => {
  it('parses valid GEDCOM and returns summary', () => {
    const result = parseGedcomForImport(minimalGedcom);

    expect(result.persons).toHaveLength(3);
    expect(result.families).toHaveLength(1);
    expect(result.summary.personCount).toBe(3);
    expect(result.summary.familyCount).toBe(1);
    expect(result.summary.sampleNames).toContain('John Smith');
  });

  it('rejects empty files', () => {
    expect(() => parseGedcomForImport('   ')).toThrow('empty');
  });

  it('rejects non-GEDCOM content', () => {
    expect(() => parseGedcomForImport('hello world')).toThrow('valid GEDCOM');
  });

  it('rejects GEDCOM with no records', () => {
    expect(() => parseGedcomForImport('0 HEAD\n1 SOUR Test\n0 TRLR')).toThrow(
      'No persons or families'
    );
  });
});
