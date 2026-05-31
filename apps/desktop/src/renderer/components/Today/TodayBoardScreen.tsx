import { useMemo } from 'react';
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

const TEMPLATE: Template = BUILTIN_TEMPLATES.editorial as Template;

type TodayBoardScreenProps = {
  data: TodayData;
  now: Date;
  onChange: (data: TodayData) => void;
  onNavigateCapture: () => void;
};

export default function TodayBoardScreen({
  data,
  now,
  onChange,
  onNavigateCapture,
}: TodayBoardScreenProps) {
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

  const handleAdd = (input: NewItemInput): ItemId => {
    const result = addItem(data, input);
    onChange(result.data);
    return result.itemId;
  };

  return (
    <div className="today-screen">
      <ProgressKudos views={views} />

      <InlineAdd
        onAdd={handleAdd}
        onAddChild={(parentId, title) => onChange(addChild(data, parentId, title))}
        onPullYesterday={() => onChange(pullYesterdayUnfinished(data, now))}
        hasYesterday={hasYesterday}
      />

      {TEMPLATE.showCountdown && <Countdown views={views} now={now} variant="inline" />}

      <TodayBoard data={data} template={TEMPLATE} now={now} onChange={onChange} />

      {TEMPLATE.showCountdown && <Countdown views={views} now={now} variant="floating" />}

      <CaptureFab onClick={onNavigateCapture} />
    </div>
  );
}
