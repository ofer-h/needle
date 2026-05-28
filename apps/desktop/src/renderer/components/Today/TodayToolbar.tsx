import { useEffect, useState } from 'react';
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

function getClockParts(): { main: string; ampm: string; seconds: string } {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const ampmMatch = /\s?(AM|PM)$/i.exec(timeStr);
  const main = ampmMatch ? timeStr.slice(0, ampmMatch.index).trim() : timeStr;
  const ampm = ampmMatch ? ampmMatch[0].trim() : '';
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return { main, ampm, seconds };
}

function LiveClock() {
  const [parts, setParts] = useState(getClockParts);

  useEffect(() => {
    const id = setInterval(() => setParts(getClockParts()), 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="today-clock" aria-label={`Current time: ${parts.main}${parts.ampm ? ' ' + parts.ampm : ''}`} aria-live="off">
      <span className="today-clock__main">{parts.main}</span>
      {parts.ampm !== '' && <span className="today-clock__ampm">{parts.ampm}</span>}
      <span className="today-clock__seconds" aria-hidden="true">:{parts.seconds}</span>
    </div>
  );
}

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

      <LiveClock />

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
