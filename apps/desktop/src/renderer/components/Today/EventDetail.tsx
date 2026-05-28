import { useEffect, useState } from 'react';
import { useAppStore } from '../../state/store';
import { Button } from '../primitives/Button';
import './ItemDetail.css';

type Props = {
  id: string;
  eventId: string;
  labelledBy: string;
};

export default function EventDetail({ id, eventId, labelledBy }: Props) {
  const event = useAppStore((s) => s.events.find((item) => item.id === eventId));
  const updateEvent = useAppStore((s) => s.updateEvent);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const convertEventToTask = useAppStore((s) => s.convertEventToTask);
  const expandItem = useAppStore((s) => s.expandItem);

  const [title, setTitle] = useState(event?.label ?? '');
  const [date, setDate] = useState(event?.date ?? '');
  const [startTime, setStartTime] = useState(event?.startTime ?? '');
  const [endTime, setEndTime] = useState(event?.endTime ?? '');
  const [notes, setNotes] = useState(event?.notes ?? '');

  useEffect(() => {
    setTitle(event?.label ?? '');
    setDate(event?.date ?? '');
    setStartTime(event?.startTime ?? '');
    setEndTime(event?.endTime ?? '');
    setNotes(event?.notes ?? '');
  }, [event]);

  if (event === undefined) return null;

  function handleSave() {
    if (!title.trim() || !date || !startTime || !endTime) return;
    updateEvent(eventId, {
      label: title.trim(),
      date,
      startTime,
      endTime,
      notes,
    });
  }

  function handleDelete() {
    deleteEvent(eventId);
  }

  function handleRemoveTime() {
    convertEventToTask(eventId);
    expandItem(null);
  }

  return (
    <div id={id} className="item-detail" role="region" aria-labelledby={labelledBy}>
      <div className="item-detail__grid">
        <label className="item-detail__section">
          <span className="item-detail__label">Title</span>
          <input
            className="item-detail__input"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
        </label>

        <div className="item-detail__section">
          <span className="item-detail__label">Timing</span>
          <div className="item-detail__inline-controls">
            <input className="item-detail__input" type="date" value={date} onChange={(event) => setDate(event.currentTarget.value)} />
            <input className="item-detail__input" type="time" value={startTime} onChange={(event) => setStartTime(event.currentTarget.value)} />
            <input className="item-detail__input" type="time" value={endTime} onChange={(event) => setEndTime(event.currentTarget.value)} />
          </div>
        </div>

        <label className="item-detail__notes">
          <span className="item-detail__label">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
            placeholder="Add notes"
          />
        </label>

        <div className="item-detail__actions" aria-label="Event actions">
          <Button size="sm" variant="ghost" onClick={handleSave}>
            Save changes
          </Button>
          <Button size="sm" variant="ghost" onClick={handleRemoveTime}>
            Remove time
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
