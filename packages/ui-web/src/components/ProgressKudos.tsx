import type { TodayItemView } from '../model';
import { ProgressBar } from '../primitives';
import './ProgressKudos.css';

/** "3 of 5 done" + supportive microcopy. Counts top-level tasks (events and
 * notes don't count toward "done"). Tone-guarded: encouraging at every level,
 * never shaming about what's left. */
function microcopy(done: number, total: number): string {
  if (total === 0) return 'Nothing due — a clear runway.';
  if (done === 0) return 'Fresh start. Pick one thing.';
  if (done === total) return 'All clear. That’s the whole list. 🎉';
  const frac = done / total;
  if (frac >= 0.75) return 'Almost there — strong finish in sight.';
  if (frac >= 0.5) return 'Past halfway. Momentum’s real.';
  return 'Good start — keep the thread going.';
}

export function ProgressKudos({ views }: { views: TodayItemView[] }) {
  const tasks = views.filter((v) => v.item.kind === 'task');
  const total = tasks.length;
  const done = tasks.filter((v) => v.item.status === 'done').length;

  return (
    <div className="kudos">
      <div className="kudos__head">
        <span className="kudos__count">
          <strong>{done}</strong> of {total} done
        </span>
        <span className="kudos__copy">{microcopy(done, total)}</span>
      </div>
      <ProgressBar value={done} max={total} tone={done === total && total > 0 ? 'accent' : 'upcoming'} />
    </div>
  );
}
