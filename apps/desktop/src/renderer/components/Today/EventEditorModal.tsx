import {
  addEvent,
  addTravelPrep,
  EventEditor,
  type ItemId,
  type NewEventInput,
  type TodayData,
} from '@needle/ui-web';

type EventEditorModalProps = {
  data: TodayData;
  now: Date;
  onChange: (data: TodayData) => void;
  onClose: () => void;
};

/** A simple modal wrapper around ui-web's EventEditor: a dimmed backdrop plus a
 * fixed card. Creating an event applies the pure mutation and closes; the
 * backdrop and Escape just close without touching data. */
export default function EventEditorModal({ data, now, onChange, onClose }: EventEditorModalProps) {
  // Track the freshly created event so a follow-up travel-prep call mutates the
  // same up-to-date data rather than a stale closure.
  let working = data;

  const handleCreate = (input: NewEventInput): ItemId => {
    const result = addEvent(working, input, now);
    working = result.data;
    onChange(working);
    onClose();
    return result.itemId;
  };

  const handleAddPrep = (
    eventId: ItemId,
    opts: { travelMinutes: number; bufferMinutes?: number }
  ): void => {
    const result = addTravelPrep(working, eventId, opts);
    if (!result) return;
    working = result.data;
    onChange(working);
  };

  return (
    <div
      className="event-modal__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="event-modal__card"
        role="dialog"
        aria-modal="true"
        aria-label="Add an event"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <div className="event-modal__head">
          <h2 className="event-modal__title">Add an event</h2>
          <button type="button" className="event-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <EventEditor onCreate={handleCreate} onAddPrep={handleAddPrep} />
      </div>
    </div>
  );
}
