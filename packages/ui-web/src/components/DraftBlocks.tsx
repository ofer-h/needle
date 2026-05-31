import { useState } from 'react';
import { type NewItemInput } from '../model';
import { Icon } from '../primitives';
import './DraftBlocks.css';

export type DraftBlock = NewItemInput & { id: string };

export type DraftBlocksProps = {
  rawText: string;
  blocks: DraftBlock[];
  onChange: (blocks: DraftBlock[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

type ItemKindOption = 'task' | 'event' | 'note';

const KIND_LABELS: Record<ItemKindOption, string> = {
  task: 'Task',
  event: 'Event',
  note: 'Note',
};

const KIND_OPTIONS: ItemKindOption[] = ['task', 'event', 'note'];

/** AI clean-up preview — editable cards for each parsed block. No mutation
 * happens until the user confirms. */
export function DraftBlocks({ rawText, blocks, onChange, onConfirm, onCancel }: DraftBlocksProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  function updateBlock(id: string, patch: Partial<DraftBlock>): void {
    onChange(
      blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  }

  function removeBlock(id: string): void {
    onChange(blocks.filter((b) => b.id !== id));
  }

  function cycleKind(block: DraftBlock): void {
    const current: ItemKindOption = (block.kind as ItemKindOption | undefined) ?? 'task';
    const next = KIND_OPTIONS[(KIND_OPTIONS.indexOf(current) + 1) % KIND_OPTIONS.length];
    if (next !== undefined) {
      updateBlock(block.id, { kind: next });
    }
  }

  return (
    <div className="draft-blocks" aria-label="AI clean-up preview">
      <div className="draft-blocks__raw">
        <span className="draft-blocks__raw-label">You wrote:</span>
        <span className="draft-blocks__raw-text">{rawText}</span>
      </div>

      {blocks.length === 0 && (
        <p className="draft-blocks__empty">Nothing parsed — all blocks removed.</p>
      )}

      <ul className="draft-blocks__list" role="list">
        {blocks.map((block) => {
          const isFocused = focusedId === block.id;
          const kind: ItemKindOption = (block.kind as ItemKindOption | undefined) ?? 'task';

          return (
            <li
              key={block.id}
              className={`draft-blocks__card${isFocused ? ' draft-blocks__card--focused' : ''}`}
            >
              <div className="draft-blocks__card-main">
                <input
                  className="draft-blocks__title"
                  type="text"
                  value={block.title}
                  aria-label="Item title"
                  onFocus={() => setFocusedId(block.id)}
                  onBlur={() => setFocusedId(null)}
                  onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                />
                <div className="draft-blocks__card-meta">
                  <button
                    type="button"
                    className="draft-blocks__kind-toggle"
                    onClick={() => cycleKind(block)}
                    aria-label={`Kind: ${KIND_LABELS[kind] ?? kind}. Click to cycle.`}
                  >
                    {KIND_LABELS[kind] ?? kind}
                  </button>
                  <input
                    type="time"
                    className={`draft-blocks__time${block.startTime ? ' draft-blocks__time--set' : ''}`}
                    value={block.startTime ?? ''}
                    aria-label="Start time"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        updateBlock(block.id, { startTime: val });
                      } else {
                        const { startTime: _dropped, ...rest } = block;
                        void _dropped;
                        onChange(blocks.map((b) => (b.id === block.id ? { ...rest, id: block.id } : b)));
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="draft-blocks__remove"
                    onClick={() => removeBlock(block.id)}
                    aria-label={`Remove "${block.title}"`}
                  >
                    <Icon name="x" size={13} tone="muted" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="draft-blocks__actions">
        <button
          type="button"
          className="draft-blocks__confirm"
          onClick={onConfirm}
          disabled={blocks.length === 0}
        >
          Add {blocks.length} item{blocks.length === 1 ? '' : 's'}
        </button>
        <button type="button" className="draft-blocks__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
