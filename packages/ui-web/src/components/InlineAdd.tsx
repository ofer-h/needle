import { useRef, useState, type KeyboardEvent } from 'react';
import { parseQuickAdd, type ItemId, type NewItemInput } from '../model';
import { Icon } from '../primitives';
import './InlineAdd.css';

type InlineAddProps = {
  /** Create a top-level item; returns its id so the nest-mode affordance can
   * nest a following item as a child of the just-added item. */
  onAdd: (input: NewItemInput) => ItemId;
  onAddChild: (parentId: ItemId, title: string) => void;
  onPullYesterday?: () => void;
  hasYesterday?: boolean;
};

/** One inline composer — plain text first. Enter = top-level item by default.
 * The ↳ nest-mode toggle (or Tab key) makes the NEXT add a child of the last
 * added item. The ✨ AI toggle runs the mocked parser for time/duration/kind. */
export function InlineAdd({ onAdd, onAddChild, onPullYesterday, hasYesterday }: InlineAddProps) {
  const [text, setText] = useState('');
  const [ai, setAi] = useState(false);
  const [nestMode, setNestMode] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState('');
  const lastId = useRef<ItemId | null>(null);
  const lastTitle = useRef<string>('');

  const submit = () => {
    const raw = text.trim();
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
    // Stay in nest mode if it was active; user can cancel explicitly.
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (lastId.current) setNestMode((v) => !v);
    }
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
    <div className={`inline-add${ai ? ' inline-add--ai' : ''}${nestMode ? ' inline-add--nest' : ''}`}>
      <div className="inline-add__main">
        <button
          type="button"
          className={`inline-add__spark${ai ? ' inline-add__spark--on' : ''}`}
          onClick={() => setAi((v) => !v)}
          aria-pressed={ai}
          aria-label="Toggle AI parsing"
          title={ai ? 'AI parsing on — detects time, duration, kind' : 'Plain add'}
        >
          <Icon name={ai ? 'spark' : 'plus'} size={15} tone={ai ? 'upcoming' : 'muted'} />
        </button>
        <input
          className="inline-add__input"
          value={text}
          placeholder={
            nestMode
              ? 'Add a subtask…'
              : ai
                ? 'Add anything — e.g. "standup 10am for 15m"'
                : 'Add a task…'
          }
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          aria-label="Add an item"
        />
        <div className="inline-add__chips">
          {lastId.current && (
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
            className={`inline-add__chip${timeOpen || time ? ' inline-add__chip--on' : ''}`}
            onClick={() => setTimeOpen((v) => !v)}
            aria-label="Set a time"
          >
            <Icon name="clock" size={13} tone={time ? 'upcoming' : 'muted'} />
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
          <button type="button" className="inline-add__submit" onClick={submit} disabled={!text.trim()}>
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
