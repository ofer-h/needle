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
  const setNotes = useAppStore((s) => s.setNotes);
  const setLeadTime = useAppStore((s) => s.setLeadTime);
  const planTaskForDate = useAppStore((s) => s.planTaskForDate);
  const changeBucket = useAppStore((s) => s.changeBucket);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const expandItem = useAppStore((s) => s.expandItem);

  if (task === undefined) return null;
  const currentTask = task;

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

  return (
    <div id={id} className="item-detail" role="region" aria-labelledby={labelledBy}>
      <div className="item-detail__grid">
        <div className="item-detail__section">
          <span className="item-detail__label">Original</span>
          <p>{currentTask.rawInput ?? currentTask.title}</p>
        </div>

        <div className="item-detail__section">
          <span className="item-detail__label">Reason</span>
          <p>{currentTask.aiReason ?? 'Captured as an Act item for today.'}</p>
        </div>

        <SubtaskList taskId={taskId} subtasks={currentTask.subtasks ?? []} />

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
