import { useEffect, useRef } from 'react';
import {
  addEvent,
  addTravelPrep,
  EventEditor,
  TodayBoard,
  BUILTIN_TEMPLATES,
  type ItemId,
  type NewEventInput,
  type TodayData,
} from '@needle/ui-web';
import './screens.css';

type EventsScreenProps = {
  data: TodayData;
  setData: (next: TodayData) => void;
  now: Date;
};

/** Create fixed events / alarms. The EventEditor fires onCreate then (for travel
 * places) onAddPrep in the same tick, so we thread the just-created snapshot
 * through a ref — onAddPrep must see the event onCreate added. */
export function EventsScreen({ data, setData, now }: EventsScreenProps) {
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const handleCreate = (input: NewEventInput): ItemId => {
    const result = addEvent(dataRef.current, input, now);
    dataRef.current = result.data;
    setData(result.data);
    return result.itemId;
  };

  const handleAddPrep = (
    eventId: ItemId,
    opts: { travelMinutes: number; bufferMinutes?: number },
  ) => {
    const result = addTravelPrep(dataRef.current, eventId, opts);
    if (result) {
      dataRef.current = result.data;
      setData(result.data);
    }
  };

  // A filtered snapshot of just events + their prep hard-stops, shown on a
  // timeline. Prep tasks are the `from` side of a prep_for relation.
  const prepIds = new Set(
    data.relations.filter((r) => r.relationType === 'prep_for').map((r) => r.fromItemId),
  );
  const keep = new Set<ItemId>();
  for (const item of data.items) {
    if (item.kind === 'event' || prepIds.has(item.id)) keep.add(item.id);
  }
  const eventsData: TodayData = {
    items: data.items.filter((i) => keep.has(i.id)),
    plans: data.plans.filter((p) => keep.has(p.itemId)),
    occurrences: data.occurrences.filter((o) => keep.has(o.itemId)),
    relations: data.relations.filter((r) => keep.has(r.fromItemId) && keep.has(r.toItemId)),
  };

  return (
    <div className="screen">
      <h1 className="screen__title">Events &amp; alarms</h1>
      <p className="screen__lede">
        Create fixed events. Mark a place you travel to (like a school pickup) and a “leave
        by” hard stop is added automatically.
      </p>
      <EventEditor onCreate={handleCreate} onAddPrep={handleAddPrep} />

      <div className="screen__events-list">
        {eventsData.items.length > 0 ? (
          <TodayBoard
            data={eventsData}
            template={BUILTIN_TEMPLATES.timeline!}
            now={now}
            onChange={setData}
          />
        ) : (
          <p className="screen__hint">No events yet — add one above.</p>
        )}
      </div>
    </div>
  );
}
