import type { Person, Relationship } from '@/lib/types';
import { timestampToDate } from '@/lib/firebase/firestore';
import { buildAdjacencyMap } from '@/lib/firebase/relationships';

/**
 * Export persons and relationships to GEDCOM 5.5.1 format.
 */
export function exportToGedcom(
  treeName: string,
  persons: Person[],
  relationships: Relationship[]
): string {
  const lines: string[] = [];
  const personIds = persons.map((p) => p.id);
  const adj = buildAdjacencyMap(personIds, relationships);

  // Header
  lines.push('0 HEAD');
  lines.push('1 SOUR OpenTree');
  lines.push('2 VERS 1.0');
  lines.push(`2 NAME ${treeName}`);
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.1');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');

  // Build family units from spouse relationships
  const families: {
    id: string;
    spouse1: string;
    spouse2: string;
    children: string[];
    rel: Relationship | null;
  }[] = [];

  const spouseRels = relationships.filter((r) => r.type === 'spouse');
  let familyIdx = 1;

  for (const rel of spouseRels) {
    const familyId = `F${familyIdx++}`;

    // Find children: persons whose parents include BOTH spouses
    const children = personIds.filter((pid) => {
      const entry = adj.get(pid);
      if (!entry) return false;
      return (
        entry.parents.includes(rel.person1Id) &&
        entry.parents.includes(rel.person2Id)
      );
    });

    families.push({
      id: familyId,
      spouse1: rel.person1Id,
      spouse2: rel.person2Id,
      children,
      rel,
    });
  }

  // Find single-parent families (parent-child relationships where parent has no spouse
  // relationship matching those children)
  const coveredChildren = new Set(families.flatMap((f) => f.children));
  const parentChildRels = relationships.filter(
    (r) => r.type === 'parent-child'
  );

  const singleParentMap = new Map<string, string[]>();
  for (const rel of parentChildRels) {
    if (!coveredChildren.has(rel.person2Id)) {
      if (!singleParentMap.has(rel.person1Id)) {
        singleParentMap.set(rel.person1Id, []);
      }
      singleParentMap.get(rel.person1Id)!.push(rel.person2Id);
      coveredChildren.add(rel.person2Id);
    }
  }

  for (const [parentId, children] of singleParentMap) {
    const familyId = `F${familyIdx++}`;
    const parent = persons.find((p) => p.id === parentId);
    families.push({
      id: familyId,
      spouse1: parent?.gender === 'female' ? '' : parentId,
      spouse2: parent?.gender === 'female' ? parentId : '',
      children,
      rel: null,
    });
  }

  // Map person IDs to GEDCOM individual IDs
  const personIdMap = new Map<string, string>();
  persons.forEach((p, i) => personIdMap.set(p.id, `I${i + 1}`));

  // Map family IDs to GEDCOM family IDs
  const familyIdMap = new Map<string, string>();
  families.forEach((f) => familyIdMap.set(f.id, f.id));

  // Build family membership for FAMC/FAMS references
  const personFamiliesAsChild = new Map<string, string[]>();
  const personFamiliesAsSpouse = new Map<string, string[]>();

  for (const fam of families) {
    for (const childId of fam.children) {
      if (!personFamiliesAsChild.has(childId)) {
        personFamiliesAsChild.set(childId, []);
      }
      personFamiliesAsChild.get(childId)!.push(fam.id);
    }
    if (fam.spouse1) {
      if (!personFamiliesAsSpouse.has(fam.spouse1)) {
        personFamiliesAsSpouse.set(fam.spouse1, []);
      }
      personFamiliesAsSpouse.get(fam.spouse1)!.push(fam.id);
    }
    if (fam.spouse2) {
      if (!personFamiliesAsSpouse.has(fam.spouse2)) {
        personFamiliesAsSpouse.set(fam.spouse2, []);
      }
      personFamiliesAsSpouse.get(fam.spouse2)!.push(fam.id);
    }
  }

  // Individual records
  for (const person of persons) {
    const gedId = personIdMap.get(person.id)!;
    lines.push(`0 @${gedId}@ INDI`);
    lines.push(
      `1 NAME ${person.firstName} /${person.lastName}/`
    );
    if (person.firstName) lines.push(`2 GIVN ${person.firstName}`);
    if (person.lastName) lines.push(`2 SURN ${person.lastName}`);
    if (person.maidenName) lines.push(`2 _MARNM ${person.maidenName}`);

    // Sex
    const sexMap: Record<string, string> = {
      male: 'M',
      female: 'F',
      other: 'U',
      unknown: 'U',
    };
    lines.push(`1 SEX ${sexMap[person.gender] || 'U'}`);

    // Birth
    const birthDate = timestampToDate(person.birthDate);
    if (birthDate || person.birthPlace) {
      lines.push('1 BIRT');
      if (birthDate)
        lines.push(`2 DATE ${formatGedcomDate(birthDate)}`);
      if (person.birthPlace) lines.push(`2 PLAC ${person.birthPlace}`);
    }

    // Death
    if (!person.isLiving) {
      const deathDate = timestampToDate(person.deathDate);
      if (deathDate || person.deathPlace) {
        lines.push('1 DEAT');
        if (deathDate)
          lines.push(`2 DATE ${formatGedcomDate(deathDate)}`);
        if (person.deathPlace) lines.push(`2 PLAC ${person.deathPlace}`);
      } else {
        lines.push('1 DEAT Y');
      }
    }

    // Bio as note
    if (person.bio) {
      lines.push('1 NOTE');
      const bioLines = person.bio.split('\n');
      for (let i = 0; i < bioLines.length; i++) {
        lines.push(`2 ${i === 0 ? 'CONT' : 'CONC'} ${bioLines[i]}`);
      }
    }

    // Family as child
    const famChild = personFamiliesAsChild.get(person.id) || [];
    for (const famId of famChild) {
      lines.push(`1 FAMC @${famId}@`);
    }

    // Family as spouse
    const famSpouse = personFamiliesAsSpouse.get(person.id) || [];
    for (const famId of famSpouse) {
      lines.push(`1 FAMS @${famId}@`);
    }
  }

  // Family records
  for (const fam of families) {
    lines.push(`0 @${fam.id}@ FAM`);

    if (fam.spouse1) {
      const sp1 = persons.find((p) => p.id === fam.spouse1);
      const tag = sp1?.gender === 'female' ? 'WIFE' : 'HUSB';
      lines.push(`1 ${tag} @${personIdMap.get(fam.spouse1)}@`);
    }
    if (fam.spouse2) {
      const sp2 = persons.find((p) => p.id === fam.spouse2);
      const tag = sp2?.gender === 'female' ? 'WIFE' : 'HUSB';
      lines.push(`1 ${tag} @${personIdMap.get(fam.spouse2)}@`);
    }

    for (const childId of fam.children) {
      lines.push(`1 CHIL @${personIdMap.get(childId)}@`);
    }

    // Marriage date from the spouse relationship
    if (fam.rel) {
      const marriageDate = timestampToDate(fam.rel.marriageDate);
      if (marriageDate) {
        lines.push('1 MARR');
        lines.push(`2 DATE ${formatGedcomDate(marriageDate)}`);
      }
      const divorceDate = timestampToDate(fam.rel.divorceDate);
      if (divorceDate) {
        lines.push('1 DIV');
        lines.push(`2 DATE ${formatGedcomDate(divorceDate)}`);
      }
    }
  }

  // Trailer
  lines.push('0 TRLR');

  return lines.join('\n');
}

function formatGedcomDate(date: Date): string {
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Parse a GEDCOM file into persons and relationships.
 */
export function parseGedcom(content: string): {
  persons: ParsedPerson[];
  families: ParsedFamily[];
} {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const persons: ParsedPerson[] = [];
  const families: ParsedFamily[] = [];

  let current: { level: number; tag: string; id?: string; data: Record<string, string | string[]> } | null = null;
  let subContext = '';

  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(@\w+@)?\s*(\w+)\s*(.*)?$/);
    if (!match) continue;

    const level = parseInt(match[1]);
    const id = match[2]?.replace(/@/g, '');
    const tag = match[3];
    const value = match[4]?.trim() || '';

    if (level === 0) {
      // Save previous record
      if (current) {
        if (current.tag === 'INDI') {
          persons.push(parseIndiRecord(current.id || '', current.data));
        } else if (current.tag === 'FAM') {
          families.push(parseFamRecord(current.id || '', current.data));
        }
      }

      current = tag === 'INDI' || tag === 'FAM'
        ? { level: 0, tag, id, data: {} }
        : null;
      subContext = '';
      continue;
    }

    if (!current) continue;

    if (level === 1) {
      subContext = tag;
      if (['NAME', 'SEX', 'FAMC', 'FAMS', 'HUSB', 'WIFE', 'CHIL'].includes(tag)) {
        const key = tag;
        if (['FAMC', 'FAMS', 'CHIL'].includes(tag)) {
          const arr = (current.data[key] as string[] | undefined) || [];
          arr.push(value.replace(/@/g, ''));
          current.data[key] = arr;
        } else if (['HUSB', 'WIFE'].includes(tag)) {
          current.data[key] = value.replace(/@/g, '');
        } else {
          current.data[key] = value;
        }
      } else if (['BIRT', 'DEAT', 'MARR', 'DIV'].includes(tag)) {
        current.data[`_${tag}_FLAG`] = 'Y';
      } else if (tag === 'NOTE') {
        current.data['NOTE'] = value;
      }
    } else if (level === 2) {
      if (tag === 'DATE') {
        current.data[`${subContext}_DATE`] = value;
      } else if (tag === 'PLAC') {
        current.data[`${subContext}_PLAC`] = value;
      } else if (tag === 'GIVN') {
        current.data['GIVN'] = value;
      } else if (tag === 'SURN') {
        current.data['SURN'] = value;
      } else if (tag === 'CONT' || tag === 'CONC') {
        const existing = (current.data['NOTE'] as string) || '';
        current.data['NOTE'] = existing + (tag === 'CONT' ? '\n' : '') + value;
      }
    }
  }

  // Save last record
  if (current) {
    if (current.tag === 'INDI') {
      persons.push(parseIndiRecord(current.id || '', current.data));
    } else if (current.tag === 'FAM') {
      families.push(parseFamRecord(current.id || '', current.data));
    }
  }

  return { persons, families };
}

export interface ParsedPerson {
  gedcomId: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: Date | null;
  birthPlace: string | null;
  deathDate: Date | null;
  deathPlace: string | null;
  isLiving: boolean;
  bio: string | null;
}

export interface ParsedFamily {
  gedcomId: string;
  husbandId: string | null;
  wifeId: string | null;
  childIds: string[];
  marriageDate: Date | null;
  divorceDate: Date | null;
}

function parseIndiRecord(
  id: string,
  data: Record<string, string | string[]>
): ParsedPerson {
  const name = (data['NAME'] as string) || '';
  const nameMatch = name.match(/^(.*?)(?:\s*\/(.+?)\/)?$/);
  const givenFromField = data['GIVN'] as string;
  const surnameFromField = data['SURN'] as string;

  const firstName =
    givenFromField || (nameMatch ? nameMatch[1].trim() : '');
  const lastName =
    surnameFromField || (nameMatch ? (nameMatch[2] || '').trim() : '');

  const sex = (data['SEX'] as string) || '';
  const gender =
    sex === 'M'
      ? 'male'
      : sex === 'F'
        ? 'female'
        : 'unknown';

  const hasDeath = data['_DEAT_FLAG'] === 'Y';
  const birthDate = parseGedcomDate(data['BIRT_DATE'] as string);
  const deathDate = parseGedcomDate(data['DEAT_DATE'] as string);

  return {
    gedcomId: id,
    firstName: firstName || 'Unknown',
    lastName: lastName || 'Unknown',
    gender,
    birthDate,
    birthPlace: (data['BIRT_PLAC'] as string) || null,
    deathDate,
    deathPlace: (data['DEAT_PLAC'] as string) || null,
    isLiving: !hasDeath && !deathDate,
    bio: (data['NOTE'] as string) || null,
  };
}

function parseFamRecord(
  id: string,
  data: Record<string, string | string[]>
): ParsedFamily {
  return {
    gedcomId: id,
    husbandId: (data['HUSB'] as string) || null,
    wifeId: (data['WIFE'] as string) || null,
    childIds: (data['CHIL'] as string[]) || [],
    marriageDate: parseGedcomDate(data['MARR_DATE'] as string),
    divorceDate: parseGedcomDate(data['DIV_DATE'] as string),
  };
}

function parseGedcomDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  const months: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };

  // Handle various GEDCOM date formats
  const cleaned = dateStr.replace(/^(ABT|BEF|AFT|EST|CAL|BET)\s+/i, '');

  // Try "DD MMM YYYY"
  const full = cleaned.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/);
  if (full) {
    const month = months[full[2].toUpperCase()];
    if (month !== undefined) {
      return new Date(parseInt(full[3]), month, parseInt(full[1]));
    }
  }

  // Try "MMM YYYY"
  const monthYear = cleaned.match(/^(\w{3})\s+(\d{4})$/);
  if (monthYear) {
    const month = months[monthYear[1].toUpperCase()];
    if (month !== undefined) {
      return new Date(parseInt(monthYear[2]), month, 1);
    }
  }

  // Try "YYYY"
  const yearOnly = cleaned.match(/^(\d{4})$/);
  if (yearOnly) {
    return new Date(parseInt(yearOnly[1]), 0, 1);
  }

  return null;
}

/**
 * Download a GEDCOM file in the browser.
 */
export function downloadGedcom(
  content: string,
  filename: string
): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ged') ? filename : `${filename}.ged`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
