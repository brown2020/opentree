'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Person } from '@/lib/types';
import { timestampToDate } from '@/lib/firebase/firestore';
import { getNodeColor, getNodeBackgroundColor } from '@/lib/utils/treeLayout';

interface FamilyTreeProps {
  persons: Person[];
  selectedPersonId: string | null;
  onSelectPerson: (id: string | null) => void;
  treeId: string;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const NODE_MARGIN = 20;

export function FamilyTree({
  persons,
  selectedPersonId,
  onSelectPerson,
  treeId,
}: FamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState(d3.zoomIdentity);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Set up zoom behavior
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    svg.call(zoom);

    // Center the view initially
    const initialTransform = d3.zoomIdentity
      .translate(dimensions.width / 4, dimensions.height / 2);
    svg.call(zoom.transform, initialTransform);

    return () => {
      svg.on('.zoom', null);
    };
  }, [dimensions]);

  // Calculate node positions (simple grid for now)
  const nodes = persons.map((person, index) => {
    const cols = Math.ceil(Math.sqrt(persons.length));
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      person,
      x: col * (NODE_WIDTH + NODE_MARGIN * 2) + NODE_MARGIN,
      y: row * (NODE_HEIGHT + NODE_MARGIN * 2) + NODE_MARGIN,
    };
  });

  const handleNodeClick = useCallback((personId: string) => {
    onSelectPerson(selectedPersonId === personId ? null : personId);
  }, [selectedPersonId, onSelectPerson]);

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
    <div ref={containerRef} className="h-full w-full overflow-hidden">
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
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {nodes.map(({ person, x, y }) => {
            const isSelected = selectedPersonId === person.id;
            const borderColor = getNodeColor(person);
            const bgColor = getNodeBackgroundColor(person);

            return (
              <g
                key={person.id}
                transform={`translate(${x},${y})`}
                onClick={() => handleNodeClick(person.id)}
                className="cursor-pointer"
              >
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
                  cx={30}
                  cy={NODE_HEIGHT / 2}
                  r={20}
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={2}
                />

                {/* Initials */}
                <text
                  x={30}
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
                  x={60}
                  y={NODE_HEIGHT / 2 - 8}
                  fontSize={13}
                  fontWeight={600}
                  fill="#1F2937"
                >
                  <tspan>
                    {person.firstName} {person.lastName?.slice(0, 8)}
                    {(person.lastName?.length || 0) > 8 ? '...' : ''}
                  </tspan>
                </text>

                {/* Lifespan */}
                <text
                  x={60}
                  y={NODE_HEIGHT / 2 + 10}
                  fontSize={11}
                  fill="#6B7280"
                >
                  {getLifespan(person)}
                </text>

                {/* Link icon */}
                <Link href={`/person/${person.id}?tree=${treeId}`}>
                  <g
                    transform={`translate(${NODE_WIDTH - 28}, 8)`}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <rect
                      width={20}
                      height={20}
                      rx={4}
                      fill="#F3F4F6"
                      className="hover:fill-emerald-100"
                    />
                    <path
                      d="M6 8l4 4-4 4M10 8h4"
                      stroke="#6B7280"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      transform="translate(2, 2)"
                    />
                  </g>
                </Link>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => {
            if (svgRef.current) {
              const svg = d3.select(svgRef.current);
              svg.transition().call(
                d3.zoom<SVGSVGElement, unknown>().scaleBy,
                1.5
              );
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          title="Zoom in"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            if (svgRef.current) {
              const svg = d3.select(svgRef.current);
              svg.transition().call(
                d3.zoom<SVGSVGElement, unknown>().scaleBy,
                0.67
              );
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          title="Zoom out"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            if (svgRef.current) {
              const svg = d3.select(svgRef.current);
              const initialTransform = d3.zoomIdentity.translate(
                dimensions.width / 4,
                dimensions.height / 2
              );
              svg.transition().call(
                d3.zoom<SVGSVGElement, unknown>().transform,
                initialTransform
              );
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600"
          title="Reset view"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
