import { useEffect, useMemo, useState } from 'react';
import {
  addChild,
  addItem,
  buildTodayView,
  BUILTIN_TEMPLATES,
  Countdown,
  InlineAdd,
  ProgressBar,
  pullYesterdayUnfinished,
  TodayBoard,
  type ItemId,
  type NewItemInput,
  type Template,
  type TemplateId,
  type TodayData,
} from '@needle/ui-web';
import CaptureFab from './CaptureFab';
import EventEditorModal from './EventEditorModal';
import './TodayScreen.css';

type TodayBoardScreenProps = {
  data: TodayData;
  now: Date;
  templateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  onChange: (data: TodayData) => void;
  onNavigateCapture: () => void;
};

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function useLiveClock(): string {
  const [time, setTime] = useState(() => formatTime(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function microcopy(done: number, total: number): string {
  if (total === 0) return 'Nothing due — a clear runway.';
  if (done === 0) return 'Fresh start. Pick one thing.';
  if (done === total) return "All clear. That's the whole list.";
  const frac = done / total;
  if (frac >= 0.75) return 'Almost there — strong finish in sight.';
  if (frac >= 0.5) return "Past halfway. Momentum's real.";
  return 'Good start — keep the thread going.';
}

export default function TodayBoardScreen({
  data,
  now,
  templateId,
  onTemplateChange,
  onChange,
  onNavigateCapture,
}: TodayBoardScreenProps) {
  const views = useMemo(() => buildTodayView(data, now), [data, now]);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const template: Template =
    BUILTIN_TEMPLATES[templateId] ?? (BUILTIN_TEMPLATES.editorial as Template);

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

  const currentTime = useLiveClock();

  const tasks = views.filter((v) => v.item.kind === 'task');
  const total = tasks.length;
  const done = tasks.filter((v) => v.item.status === 'done').length;

  const monthDay = now.toLocaleDateString([], { month: 'long', day: 'numeric' });
  const weekday = now.toLocaleDateString([], { weekday: 'short' });
  const greetingText = `${greeting(now)}. You have ${total} thing${total === 1 ? '' : 's'} today.`;

  return (
    <div className="today-screen">
      {/* Hero header */}
      <div className="today-hero">
        <div className="today-hero__left">
          <div className="today-hero__date">
            <span className="today-hero__weekday">{weekday},&nbsp;</span>
            {monthDay}
            <span className="today-hero__time">&ensp;·&ensp;{currentTime}</span>
          </div>
          <p className="today-hero__greeting">{greetingText}</p>
          <div className="today-hero__progress-row">
            <span className="today-hero__count">{done} of {total} done</span>
            <ProgressBar
              value={done}
              max={total}
              tone={done === total && total > 0 ? 'accent' : 'upcoming'}
              label={`${done} of ${total} tasks done`}
            />
          </div>
        </div>

        <label className="template-switch">
          <span className="template-switch__label">Template</span>
          <select
            className="template-switch__select"
            value={template.id}
            onChange={(e) => onTemplateChange(e.target.value as TemplateId)}
          >
            {Object.values(BUILTIN_TEMPLATES).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <InlineAdd
        onAdd={handleAdd}
        onAddChild={(parentId, title) => onChange(addChild(data, parentId, title))}
        onPullYesterday={() => onChange(pullYesterdayUnfinished(data, now))}
        hasYesterday={hasYesterday}
      />

      <div className="today-screen__event-add">
        <button
          type="button"
          className="today-screen__event-btn"
          onClick={() => setEventModalOpen(true)}
        >
          + Event
        </button>
      </div>

      {template.showCountdown && <Countdown views={views} now={now} variant="inline" />}

      <TodayBoard data={data} template={template} now={now} onChange={onChange} />

      {template.showCountdown && <Countdown views={views} now={now} variant="floating" />}

      <CaptureFab onClick={onNavigateCapture} />

      {eventModalOpen && (
        <EventEditorModal
          data={data}
          now={now}
          onChange={onChange}
          onClose={() => setEventModalOpen(false)}
        />
      )}
    </div>
  );
}
