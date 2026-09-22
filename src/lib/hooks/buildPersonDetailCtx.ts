import type { PersonSchemaFormData } from '@/lib/utils/validation';
import { differenceInYears } from 'date-fns';
import { timestampToDate } from '@/lib/firebase/firestore';
import type { Person, Relationship, Tree } from '@/lib/types';

type PersonTab = 'overview' | 'photos' | 'documents' | 'timeline';

const GENDER_COLOR = {
  male: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  female: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  other: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
} as const;

const OVERVIEW_TAB = {
  key: 'overview' as const,
  label: 'Overview',
  icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
};

const DETAIL_TABS = [
  { key: 'photos' as const, label: 'Photos', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'documents' as const, label: 'Documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'timeline' as const, label: 'Timeline', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

function computeAge(
  birthDate: Date | null,
  deathDate: Date | null,
  isLiving: boolean,
): number | null {
  if (!birthDate) return null;
  if (isLiving) return differenceInYears(new Date(), birthDate);
  if (deathDate) return differenceInYears(deathDate, birthDate);
  return null;
}

export function buildPersonDetailCtx(input: {
  treeId: string;
  tree: Tree | null | undefined;
  person: Person;
  personId: string;
  showFullDetails: boolean;
  displayPerson: Person;
  related: {
    parents: Person[];
    children: Person[];
    spouses: Person[];
    siblings: Person[];
    stepParents: Person[];
    stepChildren: Person[];
    stepSiblings: Person[];
  };
  marriageDates: Map<string, string>;
  canViewFullPerson: (p: Person) => boolean;
  getDisplayPerson: (p: Person) => Person;
  activeTab: PersonTab;
  setActiveTab: (tab: PersonTab) => void;
  persons: Person[];
  relationships: Relationship[];
  relModalOpen: boolean;
  setRelModalOpen: (v: boolean) => void;
  quickAddType: 'parent' | 'child' | 'spouse' | null;
  setQuickAddType: (v: 'parent' | 'child' | 'spouse' | null) => void;
  isQuickAdding: boolean;
  isAddingRel: boolean;
  handleQuickAdd: (data: PersonSchemaFormData) => Promise<void>;
  handleAddRelationship: (type: import('@/lib/types').RelationshipType, a: string, b: string) => Promise<void>;
}) {
  const { person, displayPerson, related, showFullDetails } = input;
  const birthDate = timestampToDate(displayPerson.birthDate);
  const deathDate = timestampToDate(displayPerson.deathDate);
  const computedAge = computeAge(birthDate, deathDate, displayPerson.isLiving);
  const initials =
    `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase() || '?';
  const hasRelationships =
    related.parents.length > 0 ||
    related.children.length > 0 ||
    related.spouses.length > 0 ||
    related.siblings.length > 0 ||
    related.stepParents.length > 0 ||
    related.stepChildren.length > 0 ||
    related.stepSiblings.length > 0;
  const tabs = showFullDetails ? [OVERVIEW_TAB, ...DETAIL_TABS] : [OVERVIEW_TAB];

  return {
    ...input,
    birthDate,
    deathDate,
    computedAge,
    genderColor: GENDER_COLOR,
    initials,
    hasRelationships,
    tabs,
  };
}
