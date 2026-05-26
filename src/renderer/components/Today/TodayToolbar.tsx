import { Icon } from '../primitives/Icon';
import { Kbd } from '../primitives/Kbd';
import { ProgressBar } from '../primitives/ProgressBar';
import './TodayToolbar.css';

type Props = {
  dateLabel: string;
  total: number;
  doneCount: number;
  onAddTask: () => void;
};

export default function TodayToolbar({ dateLabel, total, doneCount, onAddTask }: Props) {
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="today-toolbar">
      <div className="today-toolbar__head">
        <div className="today-toolbar__title t-display">Today</div>
        <div className="today-toolbar__meta">
          {dateLabel} · {total} tasks · {doneCount} done
        </div>
      </div>

      <div className="today-toolbar__spacer" />

      <div className="today-toolbar__progress">
        <ProgressBar
          value={progressPct}
          tone="upcoming"
          label={`${doneCount} of ${total} tasks done`}
        />
        <span className="today-toolbar__progress-count">
          {doneCount}/{total}
        </span>
      </div>

      <button
        type="button"
        className="today-toolbar__add"
        onClick={onAddTask}
        aria-keyshortcuts="Meta+N"
      >
        <Icon name="plus" size={11} tone="inherit" />
        <span>Add task</span>
        <span className="today-toolbar__add-divider" aria-hidden="true" />
        <Kbd size="sm" ghost>
          ⌘ N
        </Kbd>
      </button>
    </div>
  );
}
