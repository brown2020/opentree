'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useActivity } from '@/lib/hooks/useActivity';
import { timestampToDate } from '@/lib/firebase/firestore';
import { ACTIVITY_ICONS } from '@/lib/utils/activityIcons';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import type { Activity } from '@/lib/types/activity';

interface ActivityFeedProps {
  treeId: string;
}

function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

function groupByDay(activities: Activity[]): { label: string; items: Activity[] }[] {
  const groups: { label: string; items: Activity[] }[] = [];
  let currentLabel = '';

  for (const activity of activities) {
    const ts = timestampToDate(activity.timestamp);
    const label = ts ? getDayLabel(ts) : 'Unknown';
    if (label !== currentLabel) {
      groups.push({ label, items: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].items.push(activity);
  }

  return groups;
}

export function ActivityFeed({ treeId }: ActivityFeedProps) {
  const { activities, loading } = useActivity(treeId);
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedActivities = isExpanded ? activities : activities.slice(0, 5);
  const dayGroups = useMemo(() => groupByDay(displayedActivities), [displayedActivities]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-1 h-2 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No recent activity.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {dayGroups.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {group.label}
          </p>
          {group.items.map((activity) => {
            const config = ACTIVITY_ICONS[activity.type] ?? ACTIVITY_ICONS.tree_updated;
            const time = timestampToDate(activity.timestamp);
            const timeAgo = time ? formatDistanceToNow(time, { addSuffix: true }) : '';

            const content = (
              <>
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.color}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {activity.userDisplayName && (
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {activity.userDisplayName}
                      </span>
                    )}
                    {activity.userDisplayName && ' · '}
                    {timeAgo}
                  </p>
                </div>
              </>
            );

            if (activity.personId) {
              return (
                <Link
                  key={activity.id}
                  href={`/person/${activity.personId}?tree=${treeId}`}
                  className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                {content}
              </div>
            );
          })}
        </div>
      ))}

      {activities.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full rounded-lg py-2 text-center text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/10"
        >
          {isExpanded ? 'Show less' : `Show ${activities.length - 5} more`}
        </button>
      )}
    </div>
  );
}
