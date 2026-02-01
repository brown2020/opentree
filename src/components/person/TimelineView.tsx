'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTimeline } from '@/lib/hooks/useTimeline';
import { timestampToDate } from '@/lib/firebase/firestore';
import { EVENT_TYPE_LABELS } from '@/lib/types';
import type { PersonEvent, EventType, EventFormData } from '@/lib/types';

interface TimelineViewProps {
  treeId: string;
  personId: string;
}

const EVENT_ICONS: Record<EventType, string> = {
  birth: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  death: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  marriage: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  divorce: 'M6 18L18 6M6 6l12 12',
  graduation: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  immigration: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  military: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  occupation: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  residence: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  custom: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
};

export function TimelineView({ treeId, personId }: TimelineViewProps) {
  const { events, loading, create, update, remove } = useTimeline(
    treeId,
    personId
  );
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<PersonEvent | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<PersonEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, control, reset } = useForm<EventFormData>({
    defaultValues: {
      type: 'custom',
      title: '',
      date: new Date(),
    },
  });

  const openAddModal = () => {
    reset({
      type: 'custom',
      title: '',
      description: '',
      place: '',
      date: new Date(),
    });
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
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No events yet. Add life events to create a timeline.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-6">
            {events.map((event) => {
              const date = timestampToDate(event.date);
              return (
                <div key={event.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={EVENT_ICONS[event.type]}
                      />
                    </svg>
                  </div>

                  {/* Event card */}
                  <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {EVENT_TYPE_LABELS[event.type]}
                        </span>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {event.title}
                        </h3>
                        {date && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(date, 'MMMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(event)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteEvent(event)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {event.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {event.description}
                      </p>
                    )}
                    {event.place && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {event.place}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <Modal
        isOpen={addModalOpen || !!editEvent}
        onClose={() => {
          setAddModalOpen(false);
          setEditEvent(null);
          reset();
        }}
        title={editEvent ? 'Edit Event' : 'Add Event'}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setAddModalOpen(false);
                setEditEvent(null);
                reset();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit(handleSave)} loading={isSaving}>
              {editEvent ? 'Save Changes' : 'Add Event'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Event Type
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              {...register('type')}
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Input label="Title" {...register('title')} />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Date
                </label>
                <input
                  type="date"
                  value={field.value ? field.value.toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? new Date(e.target.value) : null
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
          />

          <Input label="Place" {...register('place')} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              {...register('description')}
            />
          </div>
        </form>
      </Modal>

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
