'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTimeline } from '@/lib/hooks/useTimeline';
import { timestampToDate } from '@/lib/firebase/firestore';
import type { PersonEvent, EventFormData } from '@/lib/types';
import { TimelineEventList } from '@/components/person/TimelineEventList';
import { TimelineEventModal } from '@/components/person/TimelineEventModal';

interface TimelineViewProps {
  treeId: string;
  personId: string;
}

export function TimelineView({ treeId, personId }: TimelineViewProps) {
  const { events, loading, create, update, remove } = useTimeline(treeId, personId);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<PersonEvent | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<PersonEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, control, reset } = useForm<EventFormData>({
    defaultValues: { type: 'custom', title: '', date: new Date() },
  });

  const openAddModal = () => {
    reset({ type: 'custom', title: '', description: '', place: '', date: new Date() });
    setAddModalOpen(true);
  };

  const openEditModal = (event: PersonEvent) => {
    reset({
      type: event.type,
      title: event.title,
      description: event.description || '',
      place: event.place || '',
      date: timestampToDate(event.date) || new Date(),
      endDate: event.endDate ? timestampToDate(event.endDate) || undefined : undefined,
    });
    setEditEvent(event);
  };

  const handleSave = async (data: EventFormData) => {
    setIsSaving(true);
    if (editEvent) {
      await update(editEvent.id, data);
      setEditEvent(null);
    } else {
      await create(data);
      setAddModalOpen(false);
    }
    setIsSaving(false);
    reset();
  };

  const handleDelete = async () => {
    if (!deleteEvent) return;
    setIsDeleting(true);
    await remove(deleteEvent.id);
    setIsDeleting(false);
    setDeleteEvent(null);
  };

  const closeModal = () => {
    setAddModalOpen(false);
    setEditEvent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openAddModal}>
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </Button>
      </div>

      <TimelineEventList events={events} onEdit={openEditModal} onDelete={setDeleteEvent} />

      <TimelineEventModal
        isOpen={addModalOpen || !!editEvent}
        editEvent={editEvent}
        isSaving={isSaving}
        register={register}
        control={control}
        handleSubmit={handleSubmit}
        reset={reset}
        onClose={closeModal}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={!!deleteEvent}
        onClose={() => setDeleteEvent(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteEvent?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
