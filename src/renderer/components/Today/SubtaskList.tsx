import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Subtask } from '../../../shared/types';
import { useAppStore } from '../../state/store';
import { Checkbox } from '../primitives/Checkbox';
import { IconButton } from '../primitives/IconButton';
import './SubtaskList.css';

type Props = {
  taskId: string;
  subtasks: Subtask[];
};

export default function SubtaskList({ taskId, subtasks }: Props) {
  const [draft, setDraft] = useState('');
  const addSubtask = useAppStore((s) => s.addSubtask);
  const toggleSubtask = useAppStore((s) => s.toggleSubtask);
  const removeSubtask = useAppStore((s) => s.removeSubtask);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addSubtask(taskId, draft);
    setDraft('');
  }

  return (
    <div className="item-subtasks">
      <div className="item-subtasks__head">
        <span>Subtasks</span>
        <span>{subtasks.filter((subtask) => subtask.done).length}/{subtasks.length}</span>
      </div>

      {subtasks.length > 0 && (
        <ul className="item-subtasks__list">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="item-subtasks__row">
              <Checkbox
                checked={subtask.done}
                tone="neutral"
                label={subtask.done ? 'Mark subtask incomplete' : 'Mark subtask complete'}
                onToggle={() => toggleSubtask(taskId, subtask.id)}
              />
              <span className={subtask.done ? 'item-subtasks__title done' : 'item-subtasks__title'}>
                {subtask.title}
              </span>
              <IconButton
                label="Remove subtask"
                variant="ghost"
                size="sm"
                onClick={() => removeSubtask(taskId, subtask.id)}
              >
                <span aria-hidden="true">×</span>
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <form className="item-subtasks__form" onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          placeholder="Add subtask"
          aria-label="Add subtask"
        />
        <button type="submit" disabled={draft.trim().length === 0}>
          Add
        </button>
      </form>
    </div>
  );
}
