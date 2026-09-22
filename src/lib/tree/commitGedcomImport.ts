import { createPerson } from '@/lib/firebase/firestore';
import { addRelationship } from '@/lib/firebase/relationships';
import { logTreeActivity } from '@/lib/firebase/activity';
import type { ParsedPerson, ParsedFamily } from '@/lib/utils/gedcom';

export async function commitGedcomImport(opts: {
  treeId: string;
  persons: ParsedPerson[];
  families: ParsedFamily[];
  user: { uid: string; displayName: string | null } | null | undefined;
  refetchPersons: () => void;
  refetchRels: () => void;
}): Promise<void> {
  const { treeId, persons: parsedPersons, families, user, refetchPersons, refetchRels } = opts;

  const personEntries = await Promise.all(
    parsedPersons.map(async (pp) => {
      const id = await createPerson(treeId, {
        firstName: pp.firstName,
        lastName: pp.lastName,
        gender: pp.gender,
        birthDate: pp.birthDate,
        birthPlace: pp.birthPlace || undefined,
        deathDate: pp.deathDate,
        deathPlace: pp.deathPlace || undefined,
        isLiving: pp.isLiving,
        bio: pp.bio || undefined,
      });
      return [pp.gedcomId, id] as const;
    })
  );
  const gedcomToFirestoreId = new Map<string, string>(personEntries);

  const relationshipJobs: Promise<unknown>[] = [];
  for (const fam of families) {
    const husbId = fam.husbandId ? gedcomToFirestoreId.get(fam.husbandId) : null;
    const wifeId = fam.wifeId ? gedcomToFirestoreId.get(fam.wifeId) : null;

    if (husbId && wifeId) {
      relationshipJobs.push(
        addRelationship(treeId, 'spouse', husbId, wifeId, fam.marriageDate, fam.divorceDate)
      );
    }

    for (const childGedcomId of fam.childIds) {
      const childId = gedcomToFirestoreId.get(childGedcomId);
      if (!childId) continue;
      if (husbId) {
        relationshipJobs.push(addRelationship(treeId, 'parent-child', husbId, childId));
      }
      if (wifeId) {
        relationshipJobs.push(addRelationship(treeId, 'parent-child', wifeId, childId));
      }
    }
  }
  await Promise.all(relationshipJobs);

  refetchPersons();
  refetchRels();

  if (user) {
    await logTreeActivity(
      treeId,
      { userId: user.uid, userDisplayName: user.displayName },
      'gedcom_imported',
      `Imported GEDCOM (${parsedPersons.length} people, ${families.length} families)`
    );
  }
}
