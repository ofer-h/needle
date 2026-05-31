import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { TAG_COLORS, type Tag, type TagColor, type TagId } from '../model';
import { Icon } from '../primitives';
import './TagChips.css';

type TagChipsProps = {
  /** Tags currently attached to the item. */
  tags: Tag[];
  /** Full registry, for the picker. */
  allTags?: Tag[];
  onAdd?: (tagId: TagId) => void;
  onRemove?: (tagId: TagId) => void;
  onCreate?: (name: string, color: TagColor) => void;
  /** Read-only display (no add/remove affordances). */
  readOnly?: boolean;
};

function chipStyle(color: TagColor): CSSProperties {
  return {
    ['--chip' as string]: `var(--tag-${color})`,
    ['--chip-soft' as string]: `var(--tag-${color}-soft)`,
  } as CSSProperties;
}

/** Compact, colored tag chips with an optional picker (assign existing or create
 * a new tag with a curated color). Colors are semantic token keys, never hex. */
export function TagChips({ tags, allTags, onAdd, onRemove, onCreate, readOnly }: TagChipsProps) {
  const [picking, setPicking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!picking) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPicking(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [picking]);

  const canPick = !readOnly && (onAdd !== undefined || onCreate !== undefined);
  const assignedIds = new Set(tags.map((t) => t.id));
  const available = (allTags ?? []).filter((t) => !assignedIds.has(t.id));

  return (
    <span className="tagchips" ref={ref}>
      {tags.map((tag) => (
        <span key={tag.id} className="tagchip" style={chipStyle(tag.color)}>
          {tag.name}
          {!readOnly && onRemove && (
            <button
              type="button"
              className="tagchip__x"
              onClick={() => onRemove(tag.id)}
              aria-label={`Remove tag ${tag.name}`}
            >
              <Icon name="x" size={9} />
            </button>
          )}
        </span>
      ))}

      {canPick && (
        <span className="tagchips__pick">
          <button
            type="button"
            className="tagchips__add"
            onClick={() => setPicking((v) => !v)}
            aria-label="Add tag"
            aria-expanded={picking}
          >
            <Icon name="plus" size={10} tone="muted" />
          </button>
          {picking && (
            <TagPicker
              available={available}
              {...(onAdd ? { onAdd } : {})}
              {...(onCreate ? { onCreate } : {})}
              onDone={() => setPicking(false)}
            />
          )}
        </span>
      )}
    </span>
  );
}

type TagPickerProps = {
  available: Tag[];
  onAdd?: (tagId: TagId) => void;
  onCreate?: (name: string, color: TagColor) => void;
  onDone: () => void;
};

function TagPicker({ available, onAdd, onCreate, onDone }: TagPickerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<TagColor>('blue');

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed || !onCreate) return;
    onCreate(trimmed, color);
    setName('');
    onDone();
  };

  return (
    <div className="tagpicker" role="dialog" aria-label="Choose a tag">
      {available.length > 0 && onAdd && (
        <div className="tagpicker__existing">
          {available.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="tagchip tagpicker__option"
              style={chipStyle(tag.color)}
              onClick={() => {
                onAdd(tag.id);
                onDone();
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {onCreate && (
        <div className="tagpicker__create">
          <input
            className="tagpicker__name"
            value={name}
            placeholder="New tag…"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') create();
              if (e.key === 'Escape') onDone();
            }}
            aria-label="New tag name"
          />
          <div className="tagpicker__swatches">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`tagpicker__swatch${c === color ? ' tagpicker__swatch--on' : ''}`}
                style={chipStyle(c)}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                aria-pressed={c === color}
              />
            ))}
          </div>
          <button
            type="button"
            className="tagpicker__make"
            onClick={create}
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      )}
    </div>
  );
}
