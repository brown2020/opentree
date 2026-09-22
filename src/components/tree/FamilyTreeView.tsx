'use client';

import type { UiCtx } from '@/lib/types/uiCtx';
import { FamilyTreeControls } from '@/components/tree/FamilyTreeControls';
function renderRoundedElbow(link: UiCtx, i: number, linkColor: string) {
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
  }
export function FamilyTreeView({ ctx }: { ctx: UiCtx }) {
  const {
    containerRef, svgRef, dimensions, nodes, links,
    linkColor, spouseLinkColor, nodeBg, nodeBorder, textPrimary, textSecondary,
    actionBg, actionStroke, shadowId, selectedPersonId, onSelectPerson,
    treeId, rootPersonId, onChangeRoot, getLifespanLabel, readOnly, router,
    effectiveRoot, getNodeColor, getNodeBackgroundColor, getLifespan,
    handleNodeClick, isDark, handleNavigateToPerson, handleSetAsRoot,
    handleFitAll, handleResetView, handleZoomIn, handleZoomOut, persons,
    NODE_WIDTH, NODE_HEIGHT, transform,
  } = ctx;
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
          {nodes.map(({ person }: UiCtx) =>
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
          {links.map((link: UiCtx, i: number) => {
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
            return renderRoundedElbow(link, i, linkColor);
          })}
          {nodes.map(({ person, x, y }: UiCtx) => {
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
                  className="transition-colors duration-200"
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
                {!readOnly && (
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
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <FamilyTreeControls ctx={ctx} />
    </div>
  );
}

