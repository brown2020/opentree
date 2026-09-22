'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { PhotoGallery } from '@/components/person/PhotoGallery';
import { DocumentList } from '@/components/person/DocumentList';
import { TimelineView } from '@/components/person/TimelineView';
import { PersonDetailHeader } from '@/components/person/PersonDetailHeader';
import { PersonOverviewTab } from '@/components/person/PersonOverviewTab';
import { PersonDetailModals } from '@/components/person/PersonDetailModals';

export function PersonDetailView({ ctx }: { ctx: UiCtx }) {
  const { treeId, tree, person, personId, activeTab, showFullDetails } = ctx;
  return (
    <div className="mx-auto max-w-5xl">
      <PersonDetailHeader ctx={ctx} />
      <PersonOverviewTab ctx={ctx} />
      {showFullDetails && activeTab === 'photos' && tree && (
        <PhotoGallery treeId={treeId} personId={personId} treeOwnerId={tree.userId} />
      )}

      {showFullDetails && activeTab === 'documents' && tree && (
        <DocumentList treeId={treeId} personId={personId} treeOwnerId={tree.userId} />
      )}

      {showFullDetails && activeTab === 'timeline' && (
        <TimelineView treeId={treeId} personId={personId} />
      )}

      <PersonDetailModals ctx={ctx} />
    </div>
  );
}
