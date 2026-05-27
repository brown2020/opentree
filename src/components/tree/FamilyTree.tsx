'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import 'd3-transition';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { Person, Relationship } from '@/lib/types';
import { timestampToDate } from '@/lib/firebase/firestore';
import { getNodeColor, getNodeBackgroundColor } from '@/lib/utils/treeLayout';
import {
  layoutFamilyTree,
  NODE_WIDTH,
  NODE_HEIGHT,
  type PositionedNode,
  type TreeLink,
} from '@/lib/utils/familyTreeLayout';

interface FamilyTreeProps {
  persons: Person[];
  relationships: Relationship[];
  selectedPersonId: string | null;
  onSelectPerson: (id: string | null) => void;
  treeId: string;
  rootPersonId: string | null;
  onChangeRoot: (id: string) => void;
  getLifespanLabel?: (person: Person) => string;
}

const DARK_NODE_BG = '#1F2937';
const DARK_NODE_BORDER = '#374151';
const DARK_TEXT_PRIMARY = '#F9FAFB';
const DARK_TEXT_SECONDARY = '#9CA3AF';
const LIGHT_NODE_BG = '#FFFFFF';
const LIGHT_NODE_BORDER = '#E5E7EB';
const LIGHT_TEXT_PRIMARY = '#1F2937';
const LIGHT_TEXT_SECONDARY = '#6B7280';
const LINK_COLOR_LIGHT = '#9CA3AF';
const LINK_COLOR_DARK = '#4B5563';
const SPOUSE_LINK_LIGHT = '#F472B6';
const SPOUSE_LINK_DARK = '#F9A8D4';

export function FamilyTree({
  persons,
  relationships,
  selectedPersonId,
  onSelectPerson,
  treeId,
  rootPersonId,
  onChangeRoot,
  getLifespanLabel,
}: FamilyTreeProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState(zoomIdentity);
  const [isDark, setIsDark] = useState(false);
  const dimensionsReady = dimensions.width > 0 && dimensions.height > 0;

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', check);
    return () => { observer.disconnect(); mq.removeEventListener('change', check); };
  }, []);

  const nodeBg = isDark ? DARK_NODE_BG : LIGHT_NODE_BG;
  const nodeBorder = isDark ? DARK_NODE_BORDER : LIGHT_NODE_BORDER;
  const textPrimary = isDark ? DARK_TEXT_PRIMARY : LIGHT_TEXT_PRIMARY;
  const textSecondary = isDark ? DARK_TEXT_SECONDARY : LIGHT_TEXT_SECONDARY;
  const linkColor = isDark ? LINK_COLOR_DARK : LINK_COLOR_LIGHT;
  const spouseLinkColor = isDark ? SPOUSE_LINK_DARK : SPOUSE_LINK_LIGHT;
  const actionBg = isDark ? '#374151' : '#F3F4F6';
  const actionStroke = isDark ? '#9CA3AF' : '#6B7280';
  const shadowId = isDark ? 'shadow-dark' : 'shadow-light';

  const effectiveRoot =
    rootPersonId || (persons.length > 0 ? persons[0].id : null);

  const { nodes, links } = useMemo(() => {
    if (!effectiveRoot || persons.length === 0) {
      return { nodes: [] as PositionedNode[], links: [] as TreeLink[] };
    }
    return layoutFamilyTree(persons, relationships, effectiveRoot);
  }, [persons, relationships, effectiveRoot]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const { width, height } = container.getBoundingClientRect();
      setDimensions({ width, height });
    };

    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !dimensionsReady) return;

    const svg = select(svgRef.current);
    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    const initialTransform = zoomIdentity.translate(
      dimensions.width / 2,
      dimensions.height / 3
    );
    svg.call(zoomBehavior.transform, initialTransform);

    return () => {
      svg.on('.zoom', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensionsReady]);

  useEffect(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const resetTransform = zoomIdentity.translate(
      dimensions.width / 2,
      dimensions.height / 3
    );
    select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, resetTransform);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRoot]);

  // Fly-to selected person
  useEffect(() => {
    if (!selectedPersonId || !svgRef.current || !zoomRef.current || nodes.length === 0) return;
    const targetNode = nodes.find((n) => n.person.id === selectedPersonId);
    if (!targetNode) return;

    const centerX = targetNode.x + NODE_WIDTH / 2;
    const centerY = targetNode.y + NODE_HEIGHT / 2;
    const scale = Math.max(transform.k, 0.8);
    const flyTransform = zoomIdentity
      .translate(dimensions.width / 2 - centerX * scale, dimensions.height / 2 - centerY * scale)
      .scale(scale);

    select(svgRef.current)
      .transition()
      .duration(600)
      .call(zoomRef.current.transform, flyTransform);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersonId]);

  const handleNodeClick = useCallback(
    (personId: string) => {
      onSelectPerson(selectedPersonId === personId ? null : personId);
    },
    [selectedPersonId, onSelectPerson]
  );

  const handleNavigateToPerson = useCallback(
    (e: React.MouseEvent, personId: string) => {
      e.stopPropagation();
      router.push(`/person/${personId}?tree=${treeId}`);
    },
    [router, treeId]
  );

  const handleSetAsRoot = useCallback(
    (e: React.MouseEvent, personId: string) => {
      e.stopPropagation();
      onChangeRoot(personId);
    },
    [onChangeRoot]
  );

  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.67);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const resetTransform = zoomIdentity.translate(
        dimensions.width / 2,
        dimensions.height / 3
      );
      select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.transform, resetTransform);
    }
  }, [dimensions]);

  const handleFitAll = useCallback(() => {
    if (!svgRef.current || !zoomRef.current || nodes.length === 0) return;

    const padding = 60;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + NODE_WIDTH);
      maxY = Math.max(maxY, node.y + NODE_HEIGHT);
    }

    const treeWidth = maxX - minX + padding * 2;
    const treeHeight = maxY - minY + padding * 2;
    const scale = Math.min(
      dimensions.width / treeWidth,
      dimensions.height / treeHeight,
      1.5
    );
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const fitTransform = zoomIdentity
      .translate(dimensions.width / 2 - centerX * scale, dimensions.height / 2 - centerY * scale)
      .scale(scale);

    select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, fitTransform);
  }, [dimensions, nodes]);

  const getLifespan = (person: Person) => {
    if (getLifespanLabel) {
      return getLifespanLabel(person);
    }
    const birthDate = timestampToDate(person.birthDate);
    const deathDate = timestampToDate(person.deathDate);

    if (!birthDate) return person.isLiving ? 'Living' : '';
    const birth = format(birthDate, 'yyyy');
    if (person.isLiving) return `b. ${birth}`;
    if (deathDate) return `${birth} – ${format(deathDate, 'yyyy')}`;
    return `b. ${birth}`;
  };

  const renderRoundedElbow = (link: TreeLink, i: number) => {
    const { from, to } = link;
    const midY = (from.y + to.y) / 2;
    const r = Math.min(12, Math.abs(to.x - from.x) / 2, Math.abs(midY - from.y));

    if (Math.abs(from.x - to.x) < 1) {
      return (
        <path
          key={`link-${i}`}
          d={`M${from.x},${from.y} L${to.x},${to.y}`}
          stroke={linkColor}
          strokeWidth={1.5}
          fill="none"
          opacity={0.6}
        />
      );
    }

    const dir = to.x > from.x ? 1 : -1;
    const d = [
      `M${from.x},${from.y}`,
      `L${from.x},${midY - r}`,
      `Q${from.x},${midY} ${from.x + r * dir},${midY}`,
      `L${to.x - r * dir},${midY}`,
      `Q${to.x},${midY} ${to.x},${midY + r}`,
      `L${to.x},${to.y}`,
    ].join(' ');

    return (
      <path
        key={`link-${i}`}
        d={d}
        stroke={linkColor}
        strokeWidth={1.5}
        fill="none"
        opacity={0.6}
      />
    );
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-grab active:cursor-grabbing"
      >
        <defs>
          <filter id="shadow-light" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.08" />
          </filter>
          <filter id="shadow-dark" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
          </filter>
          {nodes.map(({ person }) =>
            person.profilePhotoUrl ? (
              <clipPath key={`clip-${person.id}`} id={`avatar-clip-${person.id}`}>
                <circle cx={32} cy={NODE_HEIGHT / 2} r={22} />
              </clipPath>
            ) : null
          )}
        </defs>

        <g
          transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
        >
          {links.map((link, i) => {
            if (link.type === 'spouse') {
              return (
                <line
                  key={`link-${i}`}
                  x1={link.from.x}
                  y1={link.from.y}
                  x2={link.to.x}
                  y2={link.to.y}
                  stroke={spouseLinkColor}
                  strokeWidth={2}
                  strokeDasharray="6,3"
                  opacity={0.6}
                />
              );
            }
            return renderRoundedElbow(link, i);
          })}

          {nodes.map(({ person, x, y }) => {
            const isSelected = selectedPersonId === person.id;
            const isRoot = person.id === effectiveRoot;
            const borderColor = getNodeColor(person);
            const bgColor = getNodeBackgroundColor(person);
            const lifespan = getLifespan(person);
            const hasPhoto = !!person.profilePhotoUrl;

            return (
              <g
                key={person.id}
                transform={`translate(${x},${y})`}
                onClick={() => handleNodeClick(person.id)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${person.firstName} ${person.lastName}`}
              >
                {isRoot && (
                  <rect
                    x={-3}
                    y={-3}
                    width={NODE_WIDTH + 6}
                    height={NODE_HEIGHT + 6}
                    rx={14}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="4,2"
                    opacity={0.7}
                  />
                )}

                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={12}
                  fill={isSelected ? (isDark ? bgColor.replace(/F/g, '3') : bgColor) : nodeBg}
                  stroke={isSelected ? borderColor : nodeBorder}
                  strokeWidth={isSelected ? 2 : 1}
                  filter={`url(#${shadowId})`}
                  className="transition-all duration-200"
                />

                {hasPhoto ? (
                  <g clipPath={`url(#avatar-clip-${person.id})`}>
                    <image
                      href={person.profilePhotoUrl!}
                      x={10}
                      y={NODE_HEIGHT / 2 - 22}
                      width={44}
                      height={44}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                ) : (
                  <>
                    <circle
                      cx={32}
                      cy={NODE_HEIGHT / 2}
                      r={22}
                      fill={bgColor}
                      stroke={borderColor}
                      strokeWidth={2}
                    />
                    <text
                      x={32}
                      y={NODE_HEIGHT / 2 + 5}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill={borderColor}
                    >
                      {`${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`}
                    </text>
                  </>
                )}

                {hasPhoto && (
                  <circle
                    cx={32}
                    cy={NODE_HEIGHT / 2}
                    r={22}
                    fill="none"
                    stroke={borderColor}
                    strokeWidth={2}
                  />
                )}

                <text
                  x={64}
                  y={NODE_HEIGHT / 2 - 8}
                  fontSize={13}
                  fontWeight={600}
                  fill={textPrimary}
                >
                  <tspan>
                    {person.firstName}{' '}
                    {person.lastName && person.lastName.length > 10
                      ? person.lastName.slice(0, 10) + '...'
                      : person.lastName}
                  </tspan>
                </text>

                {lifespan && (
                  <text
                    x={64}
                    y={NODE_HEIGHT / 2 + 10}
                    fontSize={11}
                    fill={textSecondary}
                  >
                    {lifespan}
                  </text>
                )}

                {/* Action icons — hidden by default, visible on hover */}
                <g className="node-actions" opacity={0}>
                  <g
                    transform={`translate(${NODE_WIDTH - 50}, 6)`}
                    onClick={(e) => handleNavigateToPerson(e, person.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <title>View details</title>
                    <rect width={18} height={18} rx={4} fill={actionBg} />
                    <path
                      d="M5 7l3 3-3 3"
                      stroke={actionStroke}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      transform="translate(2,0)"
                    />
                  </g>

                  {!isRoot && (
                    <g
                      transform={`translate(${NODE_WIDTH - 26}, 6)`}
                      onClick={(e) => handleSetAsRoot(e, person.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <title>Set as tree center</title>
                      <rect width={18} height={18} rx={4} fill={actionBg} />
                      <circle cx={9} cy={9} r={4} stroke={actionStroke} strokeWidth={1.5} fill="none" />
                      <circle cx={9} cy={9} r={1.5} fill={actionStroke} />
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5 hover:bg-gray-50 dark:bg-gray-700 dark:ring-white/10 dark:hover:bg-gray-600"
          title="Zoom in"
        >
          <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5 hover:bg-gray-50 dark:bg-gray-700 dark:ring-white/10 dark:hover:bg-gray-600"
          title="Zoom out"
        >
          <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleFitAll}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5 hover:bg-gray-50 dark:bg-gray-700 dark:ring-white/10 dark:hover:bg-gray-600"
          title="Fit all"
        >
          <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={handleResetView}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5 hover:bg-gray-50 dark:bg-gray-700 dark:ring-white/10 dark:hover:bg-gray-600"
          title="Reset view"
        >
          <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0zm9-4v4m0 0H8m4 0h4" />
          </svg>
        </button>
      </div>

      {/* Root person indicator */}
      {effectiveRoot && (() => {
        const rootPerson = persons.find((p) => p.id === effectiveRoot);
        return rootPerson ? (
          <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-gray-800/90 dark:text-gray-300 dark:ring-white/10">
            Centered on:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {rootPerson.firstName} {rootPerson.lastName}
            </span>
          </div>
        ) : null;
      })()}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs text-gray-500 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-gray-800/90 dark:text-gray-400 dark:ring-white/10">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-gray-400 dark:bg-gray-500" />
          Parent-Child
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-pink-400 dark:border-pink-300" />
          Spouse
        </span>
      </div>
    </div>
  );
}
