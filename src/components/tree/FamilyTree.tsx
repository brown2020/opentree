'use client';

import { FamilyTreeView } from '@/components/tree/FamilyTreeView';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { attachSvgZoom } from '@/lib/utils/attachSvgZoom';
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
  readOnly?: boolean;
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
  readOnly = false,
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
    return attachSvgZoom(
      svgRef.current,
      dimensions,
      setTransform,
      zoomRef
    );
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

  const treeViewCtx = {
    containerRef, svgRef, dimensions, nodes, links,
    linkColor, spouseLinkColor, nodeBg, nodeBorder, textPrimary, textSecondary,
    actionBg, actionStroke, shadowId, selectedPersonId, onSelectPerson,
    treeId, rootPersonId, onChangeRoot, getLifespanLabel, readOnly, router,
    effectiveRoot, getNodeColor, getNodeBackgroundColor, getLifespan,
    handleNodeClick, isDark, handleNavigateToPerson, handleSetAsRoot,
    handleFitAll, handleResetView, handleZoomIn, handleZoomOut, persons,
    NODE_WIDTH, NODE_HEIGHT, transform,
  };

  return <FamilyTreeView ctx={treeViewCtx} />;
}
