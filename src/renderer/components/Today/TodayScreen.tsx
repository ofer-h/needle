import { useState } from 'react';
import FxWindow from '../Window/FxWindow';
import Section from './Section';
import TaskRow from './TaskRow';
import EventRow from './EventRow';
import { IconPlus, IconChevron } from '../Icons';

type Props = {
  onNavigateCapture: () => void;
};

const INITIAL_TASKS = [
  { id: '1', done: false },
  { id: '2', done: false },
  { id: '3', done: false },
  { id: '4', done: true },
  { id: '5', done: false },
  { id: '6', done: false },
  { id: '7', done: false },
  { id: '8', done: false },
  { id: '9', done: false },
];

export default function TodayScreen({ onNavigateCapture }: Props) {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set(['4']));

  const toggle = (id: string) =>
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const total = INITIAL_TASKS.length;
  const doneCount = doneIds.size;
  const progressPct = Math.round((doneCount / total) * 100);

  return (
    <FxWindow title="Focus · Today">
      {/* Sub-toolbar */}
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
          <div
            className="t-display"
            style={{ fontSize: 32, lineHeight: 1, color: 'var(--ink)' }}
          >
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
            Sunday, May 25 · {total} tasks · {doneCount} done
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Progress bar */}
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

        {/* Add task button */}
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

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 32px 100px',
        }}
      >
        {/* Overdue */}
        <Section title="Overdue" count={1} accent="var(--urgent)">
          <TaskRow
            kind="urgent"
            label="Call back Dana"
            sublabel="from your captured note"
            date="yesterday"
            datePill="urgent"
            done={doneIds.has('1')}
            onToggle={() => toggle('1')}
          />
        </Section>

        {/* Today */}
        <Section title="Today" date="Sun, May 25" count={4}>
          <TaskRow
            kind="urgent"
            label="Prep for manager 1:1"
            sublabel="2 hr lead time"
            date="1 PM"
            link="Manager 1:1 · 3 PM"
            done={doneIds.has('2')}
            onToggle={() => toggle('2')}
          />
          <EventRow time="3:00 PM" label="Manager 1:1" sublabel="30 min · with Maya · Zoom" />
          <TaskRow
            kind="upcoming"
            label="Email last week's recap"
            date="anytime"
            done={doneIds.has('3')}
            onToggle={() => toggle('3')}
          />
          <TaskRow
            done={doneIds.has('4')}
            label="Pick up dry cleaning"
            date="11 AM"
            onToggle={() => toggle('4')}
          />
        </Section>

        {/* Tomorrow */}
        <Section title="Tomorrow" date="Mon, May 26" count={2}>
          <TaskRow
            kind="upcoming"
            label="Review PR from Tal"
            sublabel="auth refactor — 12 files"
            link="GitHub"
            date="morning"
            done={doneIds.has('5')}
            onToggle={() => toggle('5')}
          />
          <TaskRow
            kind="upcoming"
            label="Book dentist"
            date="9 AM"
            done={doneIds.has('6')}
            onToggle={() => toggle('6')}
          />
        </Section>

        {/* This week */}
        <Section title="This week" date="ends Sat, May 31" count={3}>
          <TaskRow
            kind="faded"
            label="Fix kitchen light"
            date="Next Sun"
            done={doneIds.has('7')}
            onToggle={() => toggle('7')}
          />
          <TaskRow
            kind="faded"
            label="Renew driver's license"
            date="Wed"
            done={doneIds.has('8')}
            onToggle={() => toggle('8')}
          />
          <TaskRow
            kind="faded"
            label="Plan dad's birthday gift"
            date="Sat"
            done={doneIds.has('9')}
            onToggle={() => toggle('9')}
          />
        </Section>

        {/* Quick-add row */}
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
              ⌘ N
            </span>
          </span>
        </div>

        {/* Someday footer */}
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
              14
            </span>
            <IconChevron size={11} />
          </span>
          <span style={{ flex: 1, height: 0.5, background: 'var(--hairline)', display: 'block' }} />
        </div>
      </div>

      {/* FAB */}
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
