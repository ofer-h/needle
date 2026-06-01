import { useRef, useState, type KeyboardEvent } from 'react';
import { parseQuickAdd, type ItemId, type NewEventInput, type NewItemInput } from '../model';
import { Icon } from '../primitives';
import './InlineAdd.css';

type InlineAddProps = {
  onAdd: (input: NewItemInput) => ItemId;
  onAddEvent?: (input: NewEventInput) => void;
  onAddChild: (parentId: ItemId, title: string) => void;
  onPullYesterday?: () => void;
  hasYesterday?: boolean;
};

/** @internal — exported for unit tests only */
export function parseDurationMinutes(raw: string): number {
  const s = raw.trim().toLowerCase();
  const hoursOnly = /^(\d+)h$/.exec(s);
  if (hoursOnly) return parseInt(hoursOnly[1] ?? '0', 10) * 60;
  const minsOnly = /^(\d+)m$/.exec(s);
  if (minsOnly) return parseInt(minsOnly[1] ?? '0', 10);
  const combined = /^(\d+)h(\d+)m$/.exec(s);
  if (combined) return parseInt(combined[1] ?? '0', 10) * 60 + parseInt(combined[2] ?? '0', 10);
  return 0;
}

/** @internal — exported for unit tests only */
export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hStr, mStr] = timeStr.split(':');
  const totalMinutes = parseInt(hStr ?? '0', 10) * 60 + parseInt(mStr ?? '0', 10) + minutes;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** One inline composer — plain text first. Enter = top-level item by default.
 * The ↳ nest-mode toggle (or Tab key) makes the NEXT add a child of the last
 * added item. The ✨ AI toggle runs the mocked parser for time/duration/kind.
 * Typing "/" switches to event mode. */
export function InlineAdd({ onAdd, onAddEvent, onAddChild, onPullYesterday, hasYesterday }: InlineAddProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'task' | 'event'>('task');
  const [ai, setAi] = useState(false);
  const [nestMode, setNestMode] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [durationOpen, setDurationOpen] = useState(false);
  const lastId = useRef<ItemId | null>(null);
  const lastTitle = useRef<string>('');

  const switchMode = (next: 'task' | 'event') => {
    setMode(next);
    setText('');
    setTime('');
    setDuration('');
    setTimeOpen(false);
    setDurationOpen(false);
    setNestMode(false);
  };

  const submit = () => {
    const raw = text.trim();

    if (mode === 'event') {
      if (!raw || !time) return;
      const durationMinutes = parseDurationMinutes(duration);
      const endTime = durationMinutes > 0 ? addMinutesToTime(time, durationMinutes) : undefined;
      onAddEvent?.({ title: raw, startTime: time, ...(endTime !== undefined && { endTime }) });
      setText('');
      setTime('');
      setDuration('');
      setTimeOpen(false);
      setDurationOpen(false);
      setMode('task');
      return;
    }

    if (!raw) return;

    if (nestMode && lastId.current) {
      onAddChild(lastId.current, raw);
      setText('');
      return;
    }

    let input: NewItemInput;
    if (ai) {
      const parsed = parseQuickAdd(raw);
      input = parsed.input;
    } else {
      input = { title: raw };
    }
    if (time && !input.startTime) input.startTime = time;

    const newId = onAdd(input);
    lastId.current = newId;
    lastTitle.current = input.title;
    setText('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit();
    } else if (e.key === 'Tab' && mode === 'task') {
      e.preventDefault();
      if (lastId.current) setNestMode((v) => !v);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '/' && mode === 'task') {
      switchMode('event');
      return;
    }
    setText(val);
  };

  const toggleNest = () => {
    if (!lastId.current) return; // nothing to nest under yet
    setNestMode((v) => !v);
  };

  const cancelNest = () => {
    setNestMode(false);
  };

  const nestHint = nestMode && lastTitle.current ? lastTitle.current : '';

  return (
    <div className={`inline-add inline-add--${mode}${nestMode ? ' inline-add--nest' : ''}`}>
      <div className="inline-add__main">
        <div className="inline-add__type-toggle" role="group" aria-label="Item type">
          <button
            type="button"
            className={`inline-add__type-btn${mode === 'task' ? ' inline-add__type-btn--task' : ''}`}
            onClick={() => switchMode('task')}
            aria-pressed={mode === 'task'}
          >
            Task
          </button>
          <button
            type="button"
            className={`inline-add__type-btn${mode === 'event' ? ' inline-add__type-btn--event' : ''}`}
            onClick={() => switchMode('event')}
            aria-pressed={mode === 'event'}
          >
            Event
          </button>
        </div>
        <input
          className="inline-add__input"
          value={text}
          placeholder={
            mode === 'event'
              ? 'Event name…'
              : nestMode
                ? 'Add a subtask…'
                : 'Add a task…'
          }
          onChange={handleTextChange}
          onKeyDown={onKey}
          aria-label="Add an item"
        />
        <div className="inline-add__chips">
          {mode === 'task' && lastId.current && (
            <button
              type="button"
              className={`inline-add__chip inline-add__nest-toggle${nestMode ? ' inline-add__chip--on' : ''}`}
              onClick={toggleNest}
              aria-pressed={nestMode}
              aria-label={nestMode ? 'Cancel nest mode — add to top level' : 'Nest next item under last added'}
              title={nestMode ? 'Click to add at top level instead' : 'Nest under last added item'}
            >
              <Icon name="chevron-right" size={12} tone={nestMode ? 'upcoming' : 'muted'} rotate={90} />
            </button>
          )}
          <button
            type="button"
            className={`inline-add__chip${timeOpen || time ? ' inline-add__chip--on' : ''}${mode === 'event' ? ' inline-add__chip--event' : ''}`}
            onClick={() => setTimeOpen((v) => !v)}
            aria-label="Set a time"
          >
            <Icon name="clock" size={13} tone={time ? (mode === 'event' ? 'urgent' : 'upcoming') : 'muted'} />
            {time || 'time'}
          </button>
          {timeOpen && (
            <input
              type="time"
              className="inline-add__time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Time"
            />
          )}
          {mode === 'event' && (
            <>
              <button
                type="button"
                className={`inline-add__chip${durationOpen || duration ? ' inline-add__chip--on' : ''} inline-add__chip--event`}
                onClick={() => setDurationOpen((v) => !v)}
                aria-label="Set duration"
              >
                <Icon name="clock" size={13} tone={duration ? 'urgent' : 'muted'} />
                {duration || 'duration'}
              </button>
              {durationOpen && (
                <input
                  type="text"
                  className="inline-add__duration"
                  value={duration}
                  placeholder="30m"
                  onChange={(e) => setDuration(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDurationOpen(false); } }}
                  aria-label="Duration (e.g. 30m, 1h, 1h30m)"
                />
              )}
            </>
          )}
          <button
            type="button"
            className="inline-add__submit"
            onClick={submit}
            disabled={mode === 'event' ? (!text.trim() || !time) : !text.trim()}
          >
            Add
          </button>
        </div>
      </div>
      {nestMode && nestHint && (
        <div className="inline-add__nest-hint">
          <Icon name="chevron-right" size={11} tone="muted" rotate={90} />
          adding under: <span className="inline-add__nest-label">{nestHint}</span>
          <button
            type="button"
            className="inline-add__nest-cancel"
            onClick={cancelNest}
            aria-label="Cancel nest mode"
          >
            <Icon name="x" size={11} tone="muted" />
          </button>
        </div>
      )}
      {hasYesterday && onPullYesterday && (
        <button type="button" className="inline-add__yesterday" onClick={onPullYesterday}>
          <Icon name="undo" size={13} tone="muted" /> Pull yesterday&#8217;s unfinished
        </button>
      )}
    </div>
  );
}
