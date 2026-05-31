import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { childrenOf, type Item, type ItemId, type TodayItemView } from '../model';
import { Checkbox, Icon, Pill } from '../primitives';
import { useBoard } from './BoardContext';
import './ItemLine.css';

const REF_RE = /\b([a-z][a-z0-9]*-\d+)\b/gi;

/** Render plain text with `task-123`-style refs auto-tagged. No labels, no
 * markup syntax shown — just the words. */
function renderText(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  REF_RE.lastIndex = 0;
  let i = 0;
  while ((m = REF_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span key={`ref-${i++}`} className="itemline__ref">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function checkboxTone(view: TodayItemView): 'neutral' | 'urgent' | 'upcoming' {
  if (view.isOverdue || view.item.commitmentLevel === 'unmissable') return 'urgent';
  if (view.item.commitmentLevel === 'firm') return 'upcoming';
  return 'neutral';
}

type ItemLineProps = {
  view: TodayItemView;
  /** Visual nudges a layout can pass without changing the row's behavior. */
  hideTime?: boolean;
};

export function ItemLine({ view, hideTime = false }: ItemLineProps) {
  const { data, template, handlers } = useBoard();
  const { item } = view;
  const children = childrenOf(data, item.id);
  const isEvent = item.kind === 'event';
  const isDone = item.status === 'done';

  return (
    <div className={`itemline${isDone ? ' itemline--done' : ''}`}>
      <div className="itemline__row">
        <span className="itemline__control">
          {isEvent ? (
            <span className="itemline__event-dot" aria-hidden>
              <Icon name="calendar" size={14} tone="calendar" />
            </span>
          ) : (
            <Checkbox
              checked={isDone}
              tone={checkboxTone(view)}
              label={`Mark “${item.title}” ${isDone ? 'not done' : 'done'}`}
              onToggle={() => handlers.toggleDone(item.id)}
            />
          )}
        </span>

        <EditableTitle
          text={item.title}
          done={isDone}
          onCommit={(next) => handlers.setTitle(item.id, next)}
        />

        <span className="itemline__meta">
          {template.fieldsShown.includes('commitment') && item.commitmentLevel !== 'soft' && (
            <Pill tone={item.commitmentLevel === 'unmissable' ? 'urgent' : 'upcoming'}>
              {item.commitmentLevel === 'unmissable' ? 'unmissable' : 'committed'}
            </Pill>
          )}
          {template.fieldsShown.includes('source') && item.sourceId && (
            <span className="itemline__source">{String(item.sourceId)}</span>
          )}
          {template.showProgress && children.length > 0 && (
            <Pill tone="neutral" leadingIcon={<Icon name="check" size={10} tone="muted" />}>
              {view.childProgress.done}/{view.childProgress.total}
            </Pill>
          )}
          {!hideTime && template.fieldsShown.includes('time') && (
            <span className={`itemline__time${view.isOverdue ? ' itemline__time--overdue' : ''}`}>
              {view.dateLabel}
            </span>
          )}
        </span>
      </div>

      {(children.length > 0 || !isEvent) && (
        <div className="itemline__children">
          {children.map((child) => (
            <ChildLine key={child.id} child={child} />
          ))}
          {!isEvent && <AddSubtask parentId={item.id} onAdd={handlers.addChild} />}
        </div>
      )}
    </div>
  );
}

function ChildLine({ child }: { child: Item }) {
  const { handlers } = useBoard();
  const done = child.status === 'done';
  return (
    <div className={`itemline__child${done ? ' itemline__child--done' : ''}`}>
      <span className="itemline__child-arrow" aria-hidden>
        ↳
      </span>
      <Checkbox
        checked={done}
        label={`Mark “${child.title}” ${done ? 'not done' : 'done'}`}
        onToggle={() => handlers.toggleDone(child.id)}
      />
      <EditableTitle
        text={child.title}
        done={done}
        small
        onCommit={(next) => handlers.setTitle(child.id, next)}
      />
    </div>
  );
}

function EditableTitle({
  text,
  done,
  small = false,
  onCommit,
}: {
  text: string;
  done: boolean;
  small?: boolean;
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== text) onCommit(draft);
    else setDraft(text);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      setDraft(text);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`itemline__edit${small ? ' itemline__edit--sm' : ''}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        aria-label="Edit text"
      />
    );
  }

  return (
    <button
      type="button"
      className={`itemline__title${small ? ' itemline__title--sm' : ''}${
        done ? ' itemline__title--done' : ''
      }`}
      onClick={() => {
        setDraft(text);
        setEditing(true);
      }}
    >
      {renderText(text)}
    </button>
  );
}

function AddSubtask({
  parentId,
  onAdd,
}: {
  parentId: ItemId;
  onAdd: (parentId: ItemId, title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const commit = () => {
    if (draft.trim()) onAdd(parentId, draft);
    setDraft('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" className="itemline__add-subtask" onClick={() => setOpen(true)}>
        <Icon name="plus" size={12} tone="muted" /> add subtask
      </button>
    );
  }

  return (
    <div className="itemline__child itemline__child--adding">
      <span className="itemline__child-arrow" aria-hidden>
        ↳
      </span>
      <input
        ref={inputRef}
        className="itemline__edit itemline__edit--sm"
        value={draft}
        placeholder="Subtask…"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft('');
            setOpen(false);
          }
        }}
        aria-label="New subtask"
      />
    </div>
  );
}
