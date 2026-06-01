import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  childrenOf,
  effectiveSubtaskDisplay,
  MAX_SUBTASK_DEPTH,
  parseQuickAdd,
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

  // Subtasks can be added to any non-event item that can still nest and whose
  // template doesn't hide subtasks. Opening the composer also expands the group
  // so the new child (and the continuing input) are visible.
  const canAddSub = !isEvent && canNest && display !== 'hidden';
  const startAdding = () => {
    setCollapsed(false);
    setAdding(true);
  };

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
          {...(canAddSub ? { onAddChild: startAdding } : {})}
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
          {canAddSub && (
            <button
              type="button"
              className="itemline__add-sub"
              onClick={startAdding}
              aria-label="Add subtask"
              title="Add subtask (⇧⏎)"
            >
              <Icon name="plus" size={14} tone="muted" />
            </button>
          )}
          <RowMenu itemId={item.id} canAddChild={canAddSub} onAddSubtask={startAdding} />
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
          onAdd={(title, keepOpen) => {
            handlers.addChild(item.id, title);
            // ⇧⏎ keeps the composer open for the next sibling subtask; plain ⏎
            // (or blur) commits and closes.
            if (!keepOpen) setAdding(false);
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
  onAddChild,
}: {
  text: string;
  done: boolean;
  small?: boolean;
  onCommit: (next: string) => void;
  /** ⇧⏎ while editing commits the title and starts a subtask under this item. */
  onAddChild?: () => void;
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
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
      // ⇧⏎ chains straight into adding a subtask under this item.
      if (e.shiftKey && onAddChild) onAddChild();
    }
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
  /** keepOpen = ⇧⏎: commit this subtask but stay open for the next sibling. */
  onAdd: (title: string, keepOpen: boolean) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [ai, setAi] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // parentId is implicit in the onAdd closure; kept for clarity at call sites.
  void parentId;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = (keepOpen: boolean) => {
    const raw = draft.trim();
    if (!raw) {
      onCancel();
      return;
    }
    // With AI on, run the quick-add parser and use its cleaned title.
    const title = ai ? parseQuickAdd(raw).input.title : raw;
    onAdd(title, keepOpen);
    if (keepOpen) {
      setDraft('');
      inputRef.current?.focus();
    }
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
        placeholder={ai ? 'Add a subtask — ⇧⏎ for another' : 'Subtask… (⇧⏎ adds another)'}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(e.shiftKey);
          }
          if (e.key === 'Escape') onCancel();
        }}
        aria-label="New subtask"
      />
      <button
        type="button"
        className={`itemline__add-ai${ai ? ' itemline__add-ai--on' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setAi((v) => !v)}
        aria-pressed={ai}
        aria-label="Parse with AI"
        title={ai ? 'AI parsing on — cleans up the text' : 'Parse with AI'}
      >
        <Icon name="spark" size={14} tone={ai ? 'upcoming' : 'muted'} />
      </button>
    </div>
  );
}
