'use client';

import { Controller, type Control, type UseFormHandleSubmit, type UseFormRegister, type UseFormReset } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toLocalDateString } from '@/lib/utils/dateFormat';
import { EVENT_TYPE_LABELS } from '@/lib/types';
import type { EventFormData, PersonEvent } from '@/lib/types';

interface Props {
  isOpen: boolean;
  editEvent: PersonEvent | null;
  isSaving: boolean;
  register: UseFormRegister<EventFormData>;
  control: Control<EventFormData>;
  handleSubmit: UseFormHandleSubmit<EventFormData>;
  reset: UseFormReset<EventFormData>;
  onClose: () => void;
  onSave: (data: EventFormData) => void;
}

export function TimelineEventModal({
  isOpen, editEvent, isSaving, register, control, handleSubmit, reset, onClose, onSave,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); reset(); }}
      title={editEvent ? 'Edit Event' : 'Add Event'}
      footer={
        <>
          <Button variant="outline" onClick={() => { onClose(); reset(); }} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSave)} loading={isSaving}>
            {editEvent ? 'Save Changes' : 'Add Event'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label htmlFor="TimelineView-field-6" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Event Type
          </label>
          <select id="TimelineView-field-6"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            {...register('type')}
          >
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Input label="Title" {...register('title')} />
        <Controller name="date" control={control} render={({ field }) => (
          <div>
            <label htmlFor="TimelineView-field-7" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Date</label>
            <input id="TimelineView-field-7" type="date"
              value={field.value ? toLocalDateString(field.value) : ''}
              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        )} />
        <Controller name="endDate" control={control} render={({ field }) => (
          <div>
            <label htmlFor="timeline-end-date" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
              End Date <span className="text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input id="timeline-end-date" type="date"
              value={field.value ? toLocalDateString(field.value) : ''}
              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        )} />
        <Input label="Place" {...register('place')} />
        <div>
          <label htmlFor="TimelineView-field-8" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
          <textarea id="TimelineView-field-8" rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            {...register('description')} />
        </div>
      </form>
    </Modal>
  );
}
