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
}

export function FamilyTree({
  persons,
  relationships,
  selectedPersonId,
  onSelectPerson,
  treeId,
  rootPersonId,
  onChangeRoot,
}: FamilyTreeProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState(zoomIdentity);

  // Compute the tree layout
  const effectiveRoot =
    rootPersonId || (persons.length > 0 ? persons[0].id : null);

  const { nodes, links } = useMemo(() => {
    if (!effectiveRoot || persons.length === 0) {
      return { nodes: [] as PositionedNode[], links: [] as TreeLink[] };
    }
    return layoutFamilyTree(persons, relationships, effectiveRoot);
  }, [persons, relationships, effectiveRoot]);

  // Update dimensions on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const { width, height } = container.getBoundingClientRect();
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Set up zoom behavior once
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    // Center the view initially
    const initialTransform = zoomIdentity.translate(
      dimensions.width / 2,
      dimensions.height / 3
    );
    svg.call(zoomBehavior.transform, initialTransform);

    return () => {
      svg.on('.zoom', null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center when root changes
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

  const getLifespan = (person: Person) => {
    const birthDate = timestampToDate(person.birthDate);
    const deathDate = timestampToDate(person.deathDate);

    if (!birthDate) return '';
    const birth = format(birthDate, 'yyyy');
    if (person.isLiving) return `b. ${birth}`;
    if (deathDate) return `${birth} - ${format(deathDate, 'yyyy')}`;
    return `b. ${birth}`;
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
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
          </filter>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6" fill="#9CA3AF" />
          </marker>
        </defs>

        <g
          transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
        >
          {/* Draw links first (behind nodes) */}
          {links.map((link, i) => {
            if (link.type === 'spouse') {
              // Horizontal dashed line between spouses
              return (
                <line
                  key={`link-${i}`}
                  x1={link.from.x}
                  y1={link.from.y}
                  x2={link.to.x}
                  y2={link.to.y}
                  stroke="#F472B6"
                  strokeWidth={2}
                  strokeDasharray="6,3"
                  opacity={0.6}
                />
              );
            }

            // Parent-child connector with elbow
            const midY = (link.from.y + link.to.y) / 2;
            return (
              <path
                key={`link-${i}`}
                d={`M${link.from.x},${link.from.y} L${link.from.x},${midY} L${link.to.x},${midY} L${link.to.x},${link.to.y}`}
                stroke="#9CA3AF"
                strokeWidth={2}
                fill="none"
                opacity={0.5}
              />
            );
          })}

          {/* Draw nodes */}
          {nodes.map(({ person, x, y }) => {
            const isSelected = selectedPersonId === person.id;
            const isRoot = person.id === effectiveRoot;
            const borderColor = getNodeColor(person);
            const bgColor = getNodeBackgroundColor(person);
            const lifespan = getLifespan(person);

            return (
              <g
                key={person.id}
                transform={`translate(${x},${y})`}
                onClick={() => handleNodeClick(person.id)}
                className="cursor-pointer"
              >
                {/* Root indicator ring */}
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

                {/* Node background */}
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={12}
                  fill={isSelected ? bgColor : 'white'}
                  stroke={isSelected ? borderColor : '#E5E7EB'}
                  strokeWidth={isSelected ? 2 : 1}
                  filter="url(#shadow)"
                  className="transition-all duration-200"
                />

                {/* Avatar circle */}
                <circle
                  cx={32}
                  cy={NODE_HEIGHT / 2}
                  r={22}
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={2}
                />

                {/* Initials */}
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

                {/* Name */}
                <text
                  x={64}
                  y={NODE_HEIGHT / 2 - 8}
                  fontSize={13}
                  fontWeight={600}
                  fill="#1F2937"
                >
                  <tspan>
                    {person.firstName}{' '}
                    {person.lastName && person.lastName.length > 10
                      ? person.lastName.slice(0, 10) + '...'
                      : person.lastName}
                  </tspan>
                </text>

                {/* Lifespan */}
                {lifespan && (
                  <text
                    x={64}
                    y={NODE_HEIGHT / 2 + 10}
                    fontSize={11}
                    fill="#6B7280"
                  >
                    {lifespan}
                  </text>
                )}

                {/* Action icons (visible on hover via CSS — SVG hover uses opacity) */}
                {/* Navigate to person detail */}
                <g
                  transform={`translate(${NODE_WIDTH - 50}, 6)`}
                  onClick={(e) => handleNavigateToPerson(e, person.id)}
                  style={{ cursor: 'pointer' }}
                  opacity={0.3}
                >
                  <title>View details</title>
                  <rect
                    width={18}
                    height={18}
                    rx={4}
                    fill="#F3F4F6"
                  />
                  <path
                    d="M5 7l3 3-3 3"
                    stroke="#6B7280"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    transform="translate(2,0)"
                  />
                </g>

                {/* Set as root */}
                {!isRoot && (
                  <g
                    transform={`translate(${NODE_WIDTH - 26}, 6)`}
                    onClick={(e) => handleSetAsRoot(e, person.id)}
                    style={{ cursor: 'pointer' }}
                    opacity={0.3}
                  >
                    <title>Set as tree center</title>
                    <rect
                      width={18}
                      height={18}
                      rx={4}
                      fill="#F3F4F6"
                    />
                    <circle
                      cx={9}
                      cy={9}
                      r={4}
                      stroke="#6B7280"
                      strokeWidth={1.5}
                      fill="none"
                    />
                    <circle cx={9} cy={9} r={1.5} fill="#6B7280" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          title="Zoom in"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          title="Zoom out"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleResetView}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          title="Reset view"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
      </div>

      {/* Root person indicator */}
      {effectiveRoot && (
        <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur dark:bg-gray-800/90 dark:text-gray-300">
          Centered on:{' '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {persons.find((p) => p.id === effectiveRoot)?.firstName}{' '}
            {persons.find((p) => p.id === effectiveRoot)?.lastName}
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs text-gray-500 shadow-sm backdrop-blur dark:bg-gray-800/90 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-gray-400" />
          Parent-Child
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-pink-400" />
          Spouse
        </span>
      </div>
    </div>
  );
}
