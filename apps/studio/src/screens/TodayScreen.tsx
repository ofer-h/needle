import { useMemo } from 'react';
import {
  addChild,
  addItem,
  buildTodayView,
  Countdown,
  InlineAdd,
  ProgressKudos,
  pullYesterdayUnfinished,
  TodayBoard,
  type NewItemInput,
  type ItemId,
  type TodayData,
} from '@needle/ui-web';
import type { TemplatesApi } from '../templates';
import './screens.css';

type TodayScreenProps = {
  data: TodayData;
  setData: (next: TodayData) => void;
  now: Date;
  templates: TemplatesApi;
};

export function TodayScreen({ data, setData, now, templates }: TodayScreenProps) {
  const template = templates.active;

  const views = useMemo(() => buildTodayView(data, now), [data, now]);
  const todayISO = now.toISOString().slice(0, 10);
  const hasYesterday = data.plans.some((p) => {
    const item = data.items.find((i) => i.id === p.itemId);
    return item && item.status !== 'done' && p.planDate !== undefined && p.planDate < todayISO;
  });

  const handleAdd = (input: NewItemInput): ItemId => {
    const result = addItem(data, input);
    setData(result.data);
    return result.itemId;
  };

  return (
    <div className="screen screen--today">
      <div className="screen__header">
        <ProgressKudos views={views} />
        <label className="template-switch">
          <span className="template-switch__label">Template</span>
          <select
            className="template-switch__select"
            value={templates.activeId}
            onChange={(e) => templates.setActiveId(e.target.value)}
          >
            {templates.all.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.custom ? ' (custom)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      <InlineAdd
        onAdd={handleAdd}
        onAddChild={(pid, title) => setData(addChild(data, pid, title))}
        onPullYesterday={() => setData(pullYesterdayUnfinished(data, now))}
        hasYesterday={hasYesterday}
      />

      {template.showCountdown && (
        <div className="screen__countdown">
          <Countdown views={views} now={now} variant="inline" />
        </div>
      )}

      <TodayBoard data={data} template={template} now={now} onChange={setData} />

      {template.showCountdown && <Countdown views={views} now={now} variant="floating" />}
    </div>
  );
}
