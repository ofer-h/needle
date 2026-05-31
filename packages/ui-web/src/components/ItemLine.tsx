import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  childrenOf,
  effectiveSubtaskDisplay,
  MAX_SUBTASK_DEPTH,
  tagsForItem,
  viewForItem,
  type DayTarget,
  type ItemId,
  type TodayItemView,
} from '../model';
import { Checkbox, Icon, Pill } from '../primitives';
import { useBoard } from './BoardContext';
import { TagChips } from './TagChips';
import './ItemLine.css';

const REF_RE = /\b([a-z][a-z0-9]*-\d+)\b/gi;

/** Render plain text with `task-123`-style refs auto-tagged. */
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
  /** Visual nudges a layout can pass without changing behavior. */
  hideTime?: boolean;
  /** Nesting depth (0 = top-level). Children recurse at depth + 1. */
  depth?: number;
};

/** A single row. Recursive: children render as nested ItemLines down to
 * MAX_SUBTASK_DEPTH (deeper levels collapse into an overflow affordance).
 * Collapse, tags, day-targeting and delete all live here. */
export function ItemLine({ view, hideTime = false, depth = 0 }: ItemLineProps) {
  const { data, now, template, handlers } = useBoard();
  const { item } = view;
  const children = childrenOf(data, item.id);
  const isEvent = item.kind === 'event';
  const isDone = item.status === 'done';

  const display = effectiveSubtaskDisplay(template);
  const hasChildren = children.length > 0;
  const childDepth = depth + 1;
  const canNest = childDepth <= MAX_SUBTASK_DEPTH;

  const [collapsed, setCollapsed] = useState(display === 'collapsed');
  const [adding, setAdding] = useState(false);

  const showChildren = hasChildren && display !== 'hidden' && !collapsed && canNest;
  const overflowCount = hasChildren && !canNest ? children.length : 0;

  const tags = tagsForItem(data, item.id);
  const allTags = data.tags ?? [];
  const assign = handlers.assignTag;
  const unassign = handlers.unassignTag;
  const createTag = handlers.createAndAssignTag;
  const canTag = assign !== undefined || createTag !== undefined;

  const rowStyle =
    depth > 0 ? { paddingLeft: `calc(${depth} * var(--space-6))` } : undefined;

  return (
    <div className={`itemline itemline--d${depth}${isDone ? ' itemline--done' : ''}`} data-depth={depth}>
      <div className="itemline__row" style={rowStyle}>
        <span className="itemline__lead">
          {hasChildren && display !== 'hidden' ? (
            <button
              type="button"
              className="itemline__chevron"
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand subtasks' : 'Collapse subtasks'}
            >
              <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} size={14} tone="muted" />
            </button>
          ) : (
            <span className="itemline__chevron-spacer" aria-hidden />
          )}
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
          small={depth > 0}
          onCommit={(next) => handlers.setTitle(item.id, next)}
        />

        <span className="itemline__meta">
          {template.fieldsShown.includes('tags') && (tags.length > 0 || canTag) && (
            <TagChips
              tags={tags}
              allTags={allTags}
              {...(assign ? { onAdd: (id) => assign(item.id, id) } : {})}
              {...(unassign ? { onRemove: (id) => unassign(item.id, id) } : {})}
              {...(createTag ? { onCreate: (n, c) => createTag(item.id, n, c) } : {})}
            />
          )}
          {template.fieldsShown.includes('commitment') && item.commitmentLevel !== 'soft' && (
            <Pill tone={item.commitmentLevel === 'unmissable' ? 'urgent' : 'upcoming'}>
              {item.commitmentLevel === 'unmissable' ? 'unmissable' : 'committed'}
            </Pill>
          )}
          {hasChildren && (collapsed || template.showProgress) && (
            <Pill tone="neutral" leadingIcon={<Icon name="check" size={10} tone="muted" />}>
              {view.childProgress.done}/{view.childProgress.total}
            </Pill>
          )}
          {!hideTime && template.fieldsShown.includes('time') && (
            <span className={`itemline__time${view.isOverdue ? ' itemline__time--overdue' : ''}`}>
              {view.dateLabel}
            </span>
          )}
          <RowMenu itemId={item.id} canAddChild={!isEvent} onAddSubtask={() => setAdding(true)} />
        </span>
      </div>

      {showChildren && (
        <div className="itemline__children">
          {children.map((child) => (
            <ItemLine key={child.id} view={viewForItem(data, child, now)} depth={childDepth} hideTime={hideTime} />
          ))}
        </div>
      )}

      {overflowCount > 0 && (
        <button
          type="button"
          className="itemline__overflow"
          style={rowStyle}
          onClick={() => setCollapsed(false)}
        >
          <Icon name="dots" size={12} tone="muted" /> {overflowCount} more nested
        </button>
      )}

      {adding && (
        <AddSubtaskInline
          parentId={item.id}
          depth={childDepth}
          onAdd={(title) => {
            handlers.addChild(item.id, title);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}

type RowMenuProps = {
  itemId: ItemId;
  canAddChild: boolean;
  onAddSubtask: () => void;
};

function RowMenu({ itemId, canAddChild, onAddSubtask }: RowMenuProps) {
  const { handlers } = useBoard();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const moveTo = handlers.moveTo;
  const removeItem = handlers.removeItem;
  const move = (t: DayTarget) => {
    moveTo?.(itemId, t);
    setOpen(false);
  };

  return (
    <div className="rowmenu" ref={ref}>
      <button
        type="button"
        className="rowmenu__btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Item actions"
        aria-expanded={open}
      >
        <Icon name="dots" size={16} tone="muted" />
      </button>
      {open && (
        <div className="rowmenu__pop" role="menu">
          {canAddChild && (
            <button
              type="button"
              role="menuitem"
              className="rowmenu__item"
              onClick={() => {
                onAddSubtask();
                setOpen(false);
              }}
            >
              <Icon name="plus" size={13} tone="muted" /> Add subtask
            </button>
          )}
          {moveTo && (
            <>
              <div className="rowmenu__sep" />
              <div className="rowmenu__label">Move to</div>
              <button type="button" role="menuitem" className="rowmenu__item" onClick={() => move('today')}>
                Today
              </button>
              <button type="button" role="menuitem" className="rowmenu__item" onClick={() => move('tomorrow')}>
                Tomorrow
              </button>
              <button type="button" role="menuitem" className="rowmenu__item" onClick={() => move('someday')}>
                Someday
              </button>
              <label className="rowmenu__date">
                Pick date
                <input
                  type="date"
                  onChange={(e) => {
                    if (e.target.value) move({ date: e.target.value });
                  }}
                  aria-label="Pick a date"
                />
              </label>
            </>
          )}
          {removeItem && (
            <>
              <div className="rowmenu__sep" />
              <button
                type="button"
                role="menuitem"
                className="rowmenu__item rowmenu__item--danger"
                onClick={() => {
                  removeItem(itemId);
                  setOpen(false);
                }}
              >
                <Icon name="trash" size={13} /> Delete
              </button>
            </>
          )}
        </div>
      )}
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

function AddSubtaskInline({
  parentId,
  depth,
  onAdd,
  onCancel,
}: {
  parentId: ItemId;
  depth: number;
  onAdd: (title: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // parentId is implicit in the onAdd closure; kept for clarity at call sites.
  void parentId;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = () => {
    if (draft.trim()) onAdd(draft);
    else onCancel();
  };

  return (
    <div
      className="itemline__add-row"
      style={depth > 0 ? { paddingLeft: `calc(${depth} * var(--space-6))` } : undefined}
    >
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
          if (e.key === 'Escape') onCancel();
        }}
        aria-label="New subtask"
      />
    </div>
  );
}
