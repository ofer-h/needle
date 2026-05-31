import { useMemo, useState } from 'react';
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

  // Templates are pure presentation — switching only swaps which layout renders,
  // never the underlying item data. The editorial fallback is the documented
  // default and always present in the built-in registry.
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

  return (
    <div className="today-screen">
      <div className="today-screen__header">
        <ProgressKudos views={views} />
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
