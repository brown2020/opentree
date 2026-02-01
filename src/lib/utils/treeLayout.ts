import * as d3 from 'd3';
import type { Person } from '@/lib/types';

export interface TreeNode {
  id: string;
  person: Person;
  children?: TreeNode[];
  x?: number;
  y?: number;
}

export interface TreeLink {
  source: TreeNode;
  target: TreeNode;
}

export function buildTreeHierarchy(persons: Person[]): TreeNode | null {
  if (persons.length === 0) return null;

  // For now, create a flat list since we don't have relationship data
  // This will be enhanced when relationships are implemented
  const root: TreeNode = {
    id: 'root',
    person: persons[0],
    children: persons.slice(1).map((p) => ({
      id: p.id,
      person: p,
    })),
  };

  return root;
}

export function calculateTreeLayout(
  root: TreeNode,
  width: number,
  height: number
): { nodes: d3.HierarchyPointNode<TreeNode>[]; links: d3.HierarchyPointLink<TreeNode>[] } {
  const hierarchy = d3.hierarchy(root);

  const treeLayout = d3.tree<TreeNode>()
    .size([height - 100, width - 200])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

  const treeData = treeLayout(hierarchy);

  return {
    nodes: treeData.descendants(),
    links: treeData.links(),
  };
}

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
