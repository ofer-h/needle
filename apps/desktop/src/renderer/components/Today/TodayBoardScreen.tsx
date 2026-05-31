import { useEffect, useMemo, useState } from 'react';
import {
  addChild,
  addItem,
  buildTodayView,
  BUILTIN_TEMPLATES,
  Countdown,
  InlineAdd,
  ProgressKudos,
  pullYesterdayUnfinished,
  TodayBoard,
  type ItemId,
  type NewItemInput,
  type Template,
  type TodayData,
} from '@needle/ui-web';
import CaptureFab from './CaptureFab';
import { nowIsoFromState, useDevClock } from '../../utils/dev-clock';

const EMPTY_DATA: TodayData = {
  items: [],
  plans: [],
  occurrences: [],
  relations: [],
  tags: [],
  itemTags: [],
};

const TEMPLATE: Template = BUILTIN_TEMPLATES.editorial as Template;

type TodayBoardScreenProps = {
  onNavigateCapture: () => void;
};

export default function TodayBoardScreen({ onNavigateCapture }: TodayBoardScreenProps) {
  const [data, setData] = useState<TodayData>(EMPTY_DATA);
  const frozenIso = useDevClock((s) => s.frozenIso);
  const [now, setNow] = useState<Date>(() => new Date(nowIsoFromState(frozenIso)));

  // Load the canonical Today model once on mount.
  useEffect(() => {
    if (!window.api?.db) return;
    let active = true;
    window.api.db
      .getTodayData()
      .then((loaded) => {
        if (active) setData(loaded);
      })
      .catch((error: unknown) => {
        console.error('Failed to load today data', error);
      });
    return () => {
      active = false;
    };
  }, []);

  // Drive `now` from the dev clock: update immediately when frozenIso changes,
  // and tick every second so a live (unfrozen) clock advances.
  useEffect(() => {
    setNow(new Date(nowIsoFromState(frozenIso)));
    const interval = setInterval(() => {
      setNow(new Date(nowIsoFromState(frozenIso)));
    }, 1000);
    return () => clearInterval(interval);
  }, [frozenIso]);

  const views = useMemo(() => buildTodayView(data, now), [data, now]);

  const todayISO = now.toISOString().slice(0, 10);
  const hasYesterday = data.plans.some((plan) => {
    const item = data.items.find((i) => i.id === plan.itemId);
    return (
      item !== undefined &&
      item.status !== 'done' &&
      plan.planDate !== undefined &&
      plan.planDate < todayISO
    );
  });

  const persist = (next: TodayData): void => {
    setData(next);
    if (!window.api?.db) return;
    window.api.db.saveTodayData(next).catch((error: unknown) => {
      console.error('Failed to save today data', error);
    });
  };

  const handleAdd = (input: NewItemInput): ItemId => {
    const result = addItem(data, input);
    persist(result.data);
    return result.itemId;
  };

  return (
    <div className="today-screen">
      <ProgressKudos views={views} />

      <InlineAdd
        onAdd={handleAdd}
        onAddChild={(parentId, title) => persist(addChild(data, parentId, title))}
        onPullYesterday={() => persist(pullYesterdayUnfinished(data, now))}
        hasYesterday={hasYesterday}
      />

      {TEMPLATE.showCountdown && <Countdown views={views} now={now} variant="inline" />}

      <TodayBoard data={data} template={TEMPLATE} now={now} onChange={persist} />

      {TEMPLATE.showCountdown && <Countdown views={views} now={now} variant="floating" />}

      <CaptureFab onClick={onNavigateCapture} />
    </div>
  );
}
