import { useCallback, useEffect, useMemo, useState } from 'react';
import FxWindow from '../Window/FxWindow';
import Section from './Section';
import TaskRow from './TaskRow';
import EventRow from './EventRow';
import { IconPlus, IconChevron } from '../Icons';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../../shared/types';

type Props = {
  onNavigateCapture: () => void;
  active: boolean;
};

const SECTION_ORDER: { slot: 'today' | 'tomorrow' | 'this-week'; title: string; date?: string }[] = [
  { slot: 'today', title: 'Today', date: formatHeaderDate(new Date()) },
  { slot: 'tomorrow', title: 'Tomorrow', date: formatHeaderDate(addDays(new Date(), 1)) },
  { slot: 'this-week', title: 'This week', date: `ends ${formatShortWeekday(addDays(new Date(), 6))}` },
];

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatShortWeekday(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function groupTasks(tasks: Task[]): Record<'today' | 'tomorrow' | 'this-week', Task[]> {
  const groups: Record<'today' | 'tomorrow' | 'this-week', Task[]> = {
    today: [],
    tomorrow: [],
    'this-week': [],
  };

  for (const task of tasks) {
    if (task.timeSlot === 'today') groups.today.push(task);
    else if (task.timeSlot === 'tomorrow') groups.tomorrow.push(task);
    else if (task.timeSlot === 'in-a-few-days' || task.timeSlot === 'next-week') {
      groups['this-week'].push(task);
    }
  }

  return groups;
}

export default function TodayScreen({ onNavigateCapture, active }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { listToday, setDone, error } = useTasks();

  const loadTasks = useCallback(async () => {
    const next = await listToday();
    setTasks(next);
  }, [listToday]);

  useEffect(() => {
    if (!active) return;
    void loadTasks();
  }, [active, loadTasks]);

  const grouped = useMemo(() => groupTasks(tasks), [tasks]);
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const progressPct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const toggle = async (id: string, done: boolean) => {
    await setDone(id, !done);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
  };

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <FxWindow title="Focus · Today">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 40px 14px',
          borderBottom: '0.5px solid var(--hairline)',
        }}
      >
        <div>
          <div className="t-display" style={{ fontSize: 32, lineHeight: 1, color: 'var(--ink)' }}>
            Today
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--ink-3)',
              marginTop: 4,
              letterSpacing: '-0.005em',
            }}
          >
            {todayLabel} · {total} tasks · {doneCount} done
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 6 }}>
          <div
            style={{
              width: 88,
              height: 4,
              background: 'var(--surface-sub)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'var(--upcoming)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 11.5,
              color: 'var(--ink-3)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {doneCount}/{total}
          </span>
        </div>

        <button
          onClick={onNavigateCapture}
          style={{
            height: 30,
            padding: '0 14px 0 11px',
            borderRadius: 8,
            background: 'var(--ink)',
            color: 'var(--bg)',
            border: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontFamily: 'var(--sans)',
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: '-0.005em',
            cursor: 'pointer',
          }}
        >
          <IconPlus size={11} />
          <span>Add task</span>
          <span
            className="t-mono"
            style={{
              fontSize: 10,
              opacity: 0.6,
              marginLeft: 4,
              paddingLeft: 7,
              borderLeft: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            ⌘ N
          </span>
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 32px 100px',
        }}
      >
        {total === 0 && (
          <div
            style={{
              padding: '32px 10px',
              textAlign: 'center',
              color: 'var(--ink-3)',
              fontSize: 14,
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
            className="t-serif-i"
          >
            Nothing here yet. Something on your mind?
          </div>
        )}

        {SECTION_ORDER.map((section) => {
          const sectionTasks = grouped[section.slot];
          if (sectionTasks.length === 0) return null;

          return (
            <Section
              key={section.slot}
              title={section.title}
              {...(section.date ? { date: section.date } : {})}
              count={sectionTasks.length}
            >
              {section.slot === 'today' && (
                <EventRow time="3:00 PM" label="Manager 1:1" sublabel="30 min · with Maya · Zoom" />
              )}
              {sectionTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  kind={task.kind}
                  label={task.title}
                  date={task.date}
                  done={task.done}
                  onToggle={() => void toggle(task.id, task.done)}
                  {...(task.sublabel ? { sublabel: task.sublabel } : {})}
                  {...(task.link ? { link: task.link } : {})}
                  {...(task.datePill ? { datePill: task.datePill } : {})}
                />
              ))}
            </Section>
          );
        })}

        <div className="t-quickadd" onClick={onNavigateCapture} role="button" tabIndex={0}>
          <span className="plus-bubble">
            <IconPlus size={10} />
          </span>
          <span>
            Add a task, paste anything, or hit&nbsp;
            <span
              className="t-mono"
              style={{
                fontSize: 10,
                background: 'var(--surface-sub)',
                padding: '1px 5px',
                borderRadius: 4,
                color: 'var(--ink-2)',
              }}
            >
              ⌘ K
            </span>
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 18,
            padding: '0 10px',
            fontSize: 12,
            color: 'var(--ink-3)',
          }}
        >
          <span style={{ flex: 1, height: 0.5, background: 'var(--hairline)', display: 'block' }} />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <span>Someday</span>
            <span
              style={{
                fontSize: 10.5,
                fontVariantNumeric: 'tabular-nums',
                padding: '1px 7px',
                borderRadius: 999,
                background: 'var(--surface-sub)',
                color: 'var(--ink-2)',
              }}
            >
              0
            </span>
            <IconChevron size={11} />
          </span>
          <span style={{ flex: 1, height: 0.5, background: 'var(--hairline)', display: 'block' }} />
        </div>

        {error && (
          <div style={{ marginTop: 16, textAlign: 'center', color: 'var(--urgent)', fontSize: 12 }}>
            {error}
          </div>
        )}
      </div>

      <button className="fab" onClick={onNavigateCapture} aria-label="New capture">
        <span className="ic">
          <IconPlus size={14} />
        </span>
        <span>Capture</span>
        <span className="kbd">⌘ K</span>
      </button>
    </FxWindow>
  );
}
