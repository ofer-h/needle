import { useState } from 'react';
import { addDaysISO, toISODate } from '../../utils/date';
import { useAppStore } from '../../state/store';
import { Button } from '../primitives/Button';
import SubtaskList from './SubtaskList';
import './ItemDetail.css';

type Props = {
  id: string;
  taskId: string;
  labelledBy: string;
};

export default function ItemDetail({ id, taskId, labelledBy }: Props) {
  const task = useAppStore((s) => s.tasks.find((item) => item.id === taskId));
  const tasks = useAppStore((s) => s.tasks);
  const setTaskTitle = useAppStore((s) => s.setTaskTitle);
  const setNotes = useAppStore((s) => s.setNotes);
  const setLeadTime = useAppStore((s) => s.setLeadTime);
  const planTaskForDate = useAppStore((s) => s.planTaskForDate);
  const changeBucket = useAppStore((s) => s.changeBucket);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const nestTask = useAppStore((s) => s.nestTask);
  const expandItem = useAppStore((s) => s.expandItem);
  const [targetTaskId, setTargetTaskId] = useState('');

  if (task === undefined) return null;
  const currentTask = task;
  const parentCandidates = tasks.filter((item) => item.id !== taskId && item.scheduleKind === 'flexible');

  function handlePlanTomorrow() {
    planTaskForDate(taskId, addDaysISO(toISODate(), 1), 'tomorrow', 'tomorrow');
    expandItem(null);
  }

  function handleChangeBucket() {
    changeBucket(taskId, currentTask.bucket === 'act' ? 'remember' : 'act');
  }

  function handleLeadTime() {
    setLeadTime(taskId, currentTask.leadTimeMins === undefined ? 30 : undefined);
  }

  function handleDelete() {
    deleteTask(taskId);
  }

  function handleNestTask() {
    if (targetTaskId.length === 0) return;
    nestTask(taskId, targetTaskId);
  }

  return (
    <div id={id} className="item-detail" role="region" aria-labelledby={labelledBy}>
      <div className="item-detail__grid">
        <label className="item-detail__section">
          <span className="item-detail__label">Task</span>
          <input
            className="item-detail__input"
            defaultValue={currentTask.title}
            onBlur={(event) => {
              const nextTitle = event.currentTarget.value.trim();
              if (nextTitle.length > 0 && nextTitle !== currentTask.title) {
                setTaskTitle(taskId, nextTitle);
              }
            }}
          />
        </label>

        <div className="item-detail__section">
          <span className="item-detail__label">Original</span>
          <p>{currentTask.rawInput ?? currentTask.title}</p>
        </div>

        <div className="item-detail__section">
          <span className="item-detail__label">Reason</span>
          <p>{currentTask.aiReason ?? 'Captured as an Act item for today.'}</p>
        </div>

        <SubtaskList taskId={taskId} subtasks={currentTask.subtasks ?? []} />

        {parentCandidates.length > 0 && (
          <div className="item-detail__section">
            <span className="item-detail__label">Make this a subtask</span>
            <div className="item-detail__inline-controls">
              <select
                value={targetTaskId}
                onChange={(event) => setTargetTaskId(event.currentTarget.value)}
                aria-label="Choose parent task"
              >
                <option value="">Choose parent…</option>
                {parentCandidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.title}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="ghost" disabled={targetTaskId.length === 0} onClick={handleNestTask}>
                Move under task
              </Button>
            </div>
          </div>
        )}

        <label className="item-detail__notes">
          <span className="item-detail__label">Notes</span>
          <textarea
            value={currentTask.notes ?? ''}
            onChange={(event) => setNotes(taskId, event.currentTarget.value)}
            placeholder="Add context"
          />
        </label>

        <div className="item-detail__actions" aria-label="Item actions">
          <Button size="sm" variant="ghost" onClick={handlePlanTomorrow}>
            Tomorrow
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLeadTime}>
            {currentTask.leadTimeMins === undefined ? '30 min lead' : 'Clear lead'}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleChangeBucket}>
            {currentTask.bucket === 'act' ? 'Move to Remember' : 'Move to Act'}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
