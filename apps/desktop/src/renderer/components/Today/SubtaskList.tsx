import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Subtask } from '@needle/domain/types';
import { useAppStore } from '../../state/store';
import { Button } from '../primitives/Button';
import { Checkbox } from '../primitives/Checkbox';
import { IconButton } from '../primitives/IconButton';
import './SubtaskList.css';

type Props = {
  taskId: string;
  subtasks: Subtask[];
};

type SubtaskRowProps = {
  parentTaskId: string;
  subtask: Subtask;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  parentOptions: Array<{ id: string; title: string }>;
};

function SubtaskRow({
  parentTaskId,
  subtask,
  index,
  canMoveUp,
  canMoveDown,
  parentOptions,
}: SubtaskRowProps) {
  const toggleSubtask = useAppStore((s) => s.toggleSubtask);
  const removeSubtask = useAppStore((s) => s.removeSubtask);
  const updateSubtask = useAppStore((s) => s.updateSubtask);
  const reorderSubtask = useAppStore((s) => s.reorderSubtask);
  const moveSubtask = useAppStore((s) => s.moveSubtask);
  const promoteSubtask = useAppStore((s) => s.promoteSubtask);
  const [title, setTitle] = useState(subtask.title);
  const [notes, setNotes] = useState(subtask.notes ?? '');
  const [targetTaskId, setTargetTaskId] = useState('');

  useEffect(() => setTitle(subtask.title), [subtask.title]);
  useEffect(() => setNotes(subtask.notes ?? ''), [subtask.notes]);

  function commitTitle() {
    const trimmed = title.trim();
    if (trimmed.length > 0 && trimmed !== subtask.title) {
      updateSubtask(parentTaskId, subtask.id, { title: trimmed });
    }
  }

  function commitNotes() {
    if ((subtask.notes ?? '') !== notes) {
      updateSubtask(parentTaskId, subtask.id, { notes });
    }
  }

  function handleMoveTask() {
    if (targetTaskId.length === 0) return;
    moveSubtask(parentTaskId, subtask.id, targetTaskId);
    setTargetTaskId('');
  }

  return (
    <li className="item-subtasks__card">
      <div className="item-subtasks__row">
        <Checkbox
          checked={subtask.done}
          tone="neutral"
          label={subtask.done ? 'Mark subtask incomplete' : 'Mark subtask complete'}
          onToggle={() => toggleSubtask(parentTaskId, subtask.id)}
        />

        <div className="item-subtasks__content">
          <input
            className={`item-subtasks__title-input${subtask.done ? ' is-done' : ''}`}
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            onBlur={commitTitle}
            aria-label={`Subtask ${index + 1} title`}
          />

          <textarea
            className="item-subtasks__notes"
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
            onBlur={commitNotes}
            placeholder="Add notes or context"
            aria-label={`Subtask ${index + 1} notes`}
          />
        </div>

        <div className="item-subtasks__meta">
          <div className="item-subtasks__order">
            <IconButton
              label="Move subtask up"
              variant="ghost"
              size="sm"
              disabled={!canMoveUp}
              onClick={() => reorderSubtask(parentTaskId, subtask.id, index - 1)}
            >
              <span aria-hidden="true">↑</span>
            </IconButton>
            <IconButton
              label="Move subtask down"
              variant="ghost"
              size="sm"
              disabled={!canMoveDown}
              onClick={() => reorderSubtask(parentTaskId, subtask.id, index + 1)}
            >
              <span aria-hidden="true">↓</span>
            </IconButton>
          </div>

          <div className="item-subtasks__actions">
            <Button type="button" size="sm" variant="ghost" onClick={() => promoteSubtask(parentTaskId, subtask.id)}>
              Promote
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => removeSubtask(parentTaskId, subtask.id)}>
              Remove
            </Button>
          </div>
        </div>
      </div>

      {parentOptions.length > 0 && (
        <div className="item-subtasks__move">
          <select
            value={targetTaskId}
            onChange={(event) => setTargetTaskId(event.currentTarget.value)}
            aria-label={`Move subtask ${index + 1} into another task`}
          >
            <option value="">Move to task…</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={targetTaskId.length === 0}
            onClick={handleMoveTask}
          >
            Move
          </Button>
        </div>
      )}
    </li>
  );
}

export default function SubtaskList({ taskId, subtasks }: Props) {
  const [draft, setDraft] = useState('');
  const addSubtask = useAppStore((s) => s.addSubtask);
  const tasks = useAppStore((s) => s.tasks);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addSubtask(taskId, draft);
    setDraft('');
  }

  const parentOptions = tasks
    .filter((task) => task.id !== taskId)
    .map((task) => ({ id: task.id, title: task.title }));

  return (
    <div className="item-subtasks">
      <div className="item-subtasks__head">
        <span>Child items</span>
        <span>{subtasks.filter((subtask) => subtask.done).length}/{subtasks.length}</span>
      </div>

      {subtasks.length > 0 && (
        <ul className="item-subtasks__list">
          {subtasks.map((subtask, index) => (
            <SubtaskRow
              key={subtask.id}
              parentTaskId={taskId}
              subtask={subtask}
              index={index}
              canMoveUp={index > 0}
              canMoveDown={index < subtasks.length - 1}
              parentOptions={parentOptions}
            />
          ))}
        </ul>
      )}

      <form className="item-subtasks__form" onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          placeholder="Add child item"
          aria-label="Add child item"
        />
        <Button type="submit" size="sm" variant="ghost" disabled={draft.trim().length === 0}>
          Add child
        </Button>
      </form>
    </div>
  );
}
