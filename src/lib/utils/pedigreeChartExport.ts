import { format } from 'date-fns';
import type { Person, Relationship } from '@/lib/types';
import {
  layoutFamilyTree,
  NODE_WIDTH,
  NODE_HEIGHT,
  type PositionedNode,
  type TreeLink,
} from '@/lib/utils/familyTreeLayout';
import { getNodeBackgroundColor, getNodeColor } from '@/lib/utils/treeLayout';

export interface PedigreeChartOptions {
  persons: Person[];
  relationships: Relationship[];
  rootPersonId: string;
  treeName: string;
  getLifespanLabel: (person: Person) => string;
}

const LINK_COLOR = '#9CA3AF';
const SPOUSE_LINK_COLOR = '#EC4899';
const NODE_BG = '#FFFFFF';
const NODE_BORDER = '#E5E7EB';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';
const TITLE_HEIGHT = 56;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_') || 'family_tree';
}

function buildParentChildLinkPath(link: TreeLink): string {
  const { from, to } = link;
  const midY = (from.y + to.y) / 2;
  const r = Math.min(12, Math.abs(to.x - from.x) / 2, Math.abs(midY - from.y));

  if (Math.abs(from.x - to.x) < 1) {
    return `M${from.x},${from.y} L${to.x},${to.y}`;
  }

  const dir = to.x > from.x ? 1 : -1;
  return [
    `M${from.x},${from.y}`,
    `L${from.x},${midY - r}`,
    `Q${from.x},${midY} ${from.x + r * dir},${midY}`,
    `L${to.x - r * dir},${midY}`,
    `Q${to.x},${midY} ${to.x},${midY + r}`,
    `L${to.x},${to.y}`,
  ].join(' ');
}

function buildNodeSvg(
  { person, x, y }: PositionedNode,
  rootPersonId: string,
  getLifespanLabel: (person: Person) => string
): string {
  const borderColor = getNodeColor(person);
  const avatarBg = getNodeBackgroundColor(person);
  const lifespan = getLifespanLabel(person);
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const initials = `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`;
  const isRoot = person.id === rootPersonId;

  const rootRing = isRoot
    ? `<rect x="${x - 3}" y="${y - 3}" width="${NODE_WIDTH + 6}" height="${NODE_HEIGHT + 6}" rx="14" fill="none" stroke="#10B981" stroke-width="2" stroke-dasharray="4,2" opacity="0.8"/>`
    : '';

  const lifespanText = lifespan
    ? `<text x="${x + 64}" y="${y + NODE_HEIGHT / 2 + 10}" font-size="11" fill="${TEXT_SECONDARY}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(lifespan)}</text>`
    : '';

  return `<g>
    ${rootRing}
    <rect x="${x}" y="${y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="12" fill="${NODE_BG}" stroke="${NODE_BORDER}" stroke-width="1"/>
    <circle cx="${x + 32}" cy="${y + NODE_HEIGHT / 2}" r="22" fill="${avatarBg}" stroke="${borderColor}" stroke-width="2"/>
    <text x="${x + 32}" y="${y + NODE_HEIGHT / 2 + 5}" text-anchor="middle" font-size="12" font-weight="600" fill="${borderColor}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(initials)}</text>
    <text x="${x + 64}" y="${y + NODE_HEIGHT / 2 - 8}" font-size="13" font-weight="600" fill="${TEXT_PRIMARY}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(fullName)}</text>
    ${lifespanText}
  </g>`;
}

function buildLinksSvg(links: TreeLink[]): string {
  return links
    .map((link) => {
      if (link.type === 'spouse') {
        return `<line x1="${link.from.x}" y1="${link.from.y}" x2="${link.to.x}" y2="${link.to.y}" stroke="${SPOUSE_LINK_COLOR}" stroke-width="2" stroke-dasharray="6,3" opacity="0.7"/>`;
      }
      return `<path d="${buildParentChildLinkPath(link)}" stroke="${LINK_COLOR}" stroke-width="1.5" fill="none" opacity="0.7"/>`;
    })
    .join('\n');
}

/** Build a standalone SVG document for the current rooted pedigree chart. */
export function buildPedigreeChartSvg(options: PedigreeChartOptions): string {
  const { persons, relationships, rootPersonId, treeName, getLifespanLabel } =
    options;

  if (persons.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><text x="200" y="60" text-anchor="middle" font-family="system-ui, sans-serif" fill="${TEXT_SECONDARY}">No people in tree</text></svg>`;
  }

  const { nodes, links } = layoutFamilyTree(persons, relationships, rootPersonId);

  if (nodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><text x="200" y="60" text-anchor="middle" font-family="system-ui, sans-serif" fill="${TEXT_SECONDARY}">Unable to layout chart</text></svg>`;
  }

  const padding = 48;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + NODE_WIDTH);
    maxY = Math.max(maxY, node.y + NODE_HEIGHT);
  }

  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2 + TITLE_HEIGHT;
  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding - TITLE_HEIGHT;
  const titleX = minX + (maxX - minX) / 2;
  const titleY = minY - padding - TITLE_HEIGHT + 28;
  const subtitleY = titleY + 20;
  const generatedOn = format(new Date(), 'MMM d, yyyy');

  const rootPerson = persons.find((p) => p.id === rootPersonId);
  const rootLabel = rootPerson
    ? `Centered on ${rootPerson.firstName} ${rootPerson.lastName}`
    : '';

  const nodesSvg = nodes
    .map((node) => buildNodeSvg(node, rootPersonId, getLifespanLabel))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${contentWidth} ${contentHeight}" width="816" height="1056" preserveAspectRatio="xMidYMid meet">
  <rect x="${viewBoxX}" y="${viewBoxY}" width="${contentWidth}" height="${contentHeight}" fill="#FFFFFF"/>
  <text x="${titleX}" y="${titleY}" text-anchor="middle" font-size="20" font-weight="700" fill="${TEXT_PRIMARY}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(treeName)}</text>
  <text x="${titleX}" y="${subtitleY}" text-anchor="middle" font-size="12" fill="${TEXT_SECONDARY}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(rootLabel)} · Generated ${generatedOn}</text>
  ${buildLinksSvg(links)}
  ${nodesSvg}
</svg>`;
}

/** Download the pedigree chart as an SVG file sized for Letter/A4 printing. */
export function downloadPedigreeChart(options: PedigreeChartOptions): void {
  const svg = buildPedigreeChartSvg(options);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(options.treeName)}_pedigree.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Open the browser print dialog so users can save the chart as PDF. */
export function printPedigreeChart(options: PedigreeChartOptions): void {
  const svg = buildPedigreeChartSvg(options);
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    downloadPedigreeChart(options);
    return;
  }

  const title = escapeXml(options.treeName);
  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title} — Pedigree Chart</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { display: flex; justify-content: center; align-items: flex-start; }
    svg { width: 100%; max-width: 7.5in; height: auto; }
  </style>
</head>
<body>${svg}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
}
