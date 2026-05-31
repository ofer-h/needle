import { effectiveStart } from '../../model/today';
import { formatClock } from '../../model/time';
import { ItemLine } from '../ItemLine';
import type { LayoutProps } from './types';
import './TimelineLayout.css';

/** Vertical spine layout — one continuous time rail with a clock column on the
 * left and item rows on the right. Grouping is intentionally ignored; the day
 * is one ordered sequence. */
export function TimelineLayout({ groups }: LayoutProps) {
  const views = groups.flatMap((g) => g.views);

  if (views.length === 0) {
    return (
      <div className="timeline">
        <p className="timeline__empty">Nothing on the timeline.</p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="timeline">
      {views.map((view) => {
        const start = effectiveStart(view.plan, view.occurrence, now);
        const timeLabel = start !== null ? formatClock(start) : '—';
        const isUnscheduled = start === null;

        return (
          <div
            key={view.item.id}
            className={`timeline__row${view.isOverdue ? ' timeline__row--overdue' : ''}`}
          >
            <span
              className={`timeline__time${isUnscheduled ? ' timeline__time--muted' : ''}`}
              aria-label={isUnscheduled ? 'Unscheduled' : timeLabel}
            >
              {timeLabel}
            </span>

            <span className="timeline__rail" aria-hidden>
              <span
                className={`timeline__dot${view.isOverdue ? ' timeline__dot--overdue' : ''}`}
              />
            </span>

            <div className="timeline__item">
              <ItemLine view={view} hideTime />
            </div>
          </div>
        );
      })}
    </div>
  );
}
