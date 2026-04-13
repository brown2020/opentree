'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useActivity } from '@/lib/hooks/useActivity';
import { timestampToDate } from '@/lib/firebase/firestore';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import type { Activity, ActivityType } from '@/lib/types/activity';

interface ActivityFeedProps {
  treeId: string;
}

const ACTIVITY_ICONS: Record<ActivityType, { icon: string; color: string }> = {
  person_added: {
    icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  },
  person_updated: {
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  },
  person_deleted: {
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  },
  relationship_added: {
    icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  },
  relationship_removed: {
    icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  },
  photo_added: {
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  },
  document_added: {
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
  },
  event_added: {
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  },
  tree_updated: {
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    color: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
  },
  member_added: {
    icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
    color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
  },
  member_removed: {
    icon: 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6',
    color: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
  },
};

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
            const config = ACTIVITY_ICONS[activity.type];
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
