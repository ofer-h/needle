import { useRef, useState, type KeyboardEvent } from 'react';
import { parseQuickAdd, type ItemId, type NewItemInput } from '../model';
import { Icon } from '../primitives';
import './InlineAdd.css';

type InlineAddProps = {
  /** Create a top-level item; returns its id so a following `**` subtask can
   * nest under it. */
  onAdd: (input: NewItemInput) => ItemId;
  onAddChild: (parentId: ItemId, title: string) => void;
  onPullYesterday?: () => void;
  hasYesterday?: boolean;
};

/** One inline composer — no separate full-screen flow. Manual create by
 * default; the ✨ toggle runs the (mocked) AI parse for time/duration/kind.
 * Leading `*` / `**` (or the time chip) work in both modes. */
export function InlineAdd({ onAdd, onAddChild, onPullYesterday, hasYesterday }: InlineAddProps) {
  const [text, setText] = useState('');
  const [ai, setAi] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState('');
  const lastId = useRef<ItemId | null>(null);

  const submit = () => {
    const raw = text.trim();
    if (!raw) return;

    let input: NewItemInput;
    let level: 'item' | 'subtask';
    if (ai) {
      const parsed = parseQuickAdd(raw);
      input = parsed.input;
      level = parsed.level;
    } else {
      // Manual: still honor the `*` / `**` shorthand, nothing else.
      level = /^\*\*/.test(raw) ? 'subtask' : 'item';
      const title = raw.replace(/^\*+\s*/, '');
      input = { title };
    }
    if (time && !input.startTime) input.startTime = time;

    if (level === 'subtask' && lastId.current) {
      onAddChild(lastId.current, input.title);
    } else {
      lastId.current = onAdd(input);
    }
    setText('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className={`inline-add${ai ? ' inline-add--ai' : ''}`}>
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
          placeholder={ai ? 'Add anything — e.g. “standup 10am for 15m”' : 'Add a task…  (* item, ** subtask)'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          aria-label="Add an item"
        />
        <div className="inline-add__chips">
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
      {hasYesterday && onPullYesterday && (
        <button type="button" className="inline-add__yesterday" onClick={onPullYesterday}>
          <Icon name="undo" size={13} tone="muted" /> Pull yesterday’s unfinished
        </button>
      )}
    </div>
  );
}
