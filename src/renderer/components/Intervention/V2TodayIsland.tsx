import type { ISODate, TodayItemView } from '../../../shared/domain-v2';
import { selectPendingCaptureEntries, selectTodayItems } from '../../state/selectors-v2';
import { useV2Store } from '../../state/store-v2';
import { nowIso } from '../../utils/dev-clock';
import { Pill } from '../primitives/Pill';
import './V2TodayIsland.css';

export default function V2TodayIsland() {
  const state = useV2Store();
  const today = new Date().toISOString().slice(0, 10) as ISODate;
  const views = selectTodayItems(state, state.meActorId, today, nowIso());
  const captures = selectPendingCaptureEntries(state, state.meActorId);

  if (views.length === 0 && captures.length === 0) return null;

  return (
    <section className="v2-island" aria-label="v2 vertical slice preview">
      <header className="v2-island__header">
        <span className="v2-island__eyebrow">v2 slice</span>
        <span className="v2-island__hint">use the dev clock to walk the scenario</span>
      </header>

      <ul className="v2-island__list">
        {views.map((view) => (
          <V2Row key={view.item.id} view={view} />
        ))}
      </ul>

      {captures.length > 0 && (
        <div className="v2-island__captures">
          <span className="v2-island__captures-label">Captured</span>
          <ul>
            {captures.map((entry) => (
              <li key={entry.id} className="v2-island__capture">
                {entry.body}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function V2Row({ view }: { view: TodayItemView }) {
  const isUnmissable = view.item.commitmentLevel === 'unmissable';
  const isEvent = view.item.kind === 'event';
  const hasPending = view.pendingInterventions.some(
    (i) => i.status === 'active' || i.status === 'scheduled',
  );

  return (
    <li
      className={`v2-row${isEvent ? ' v2-row--event' : ''}${isUnmissable ? ' v2-row--unmissable' : ''}`}
      data-v2-item-id={view.item.id}
    >
      <span className="v2-row__time">{view.dateLabel}</span>
      <span className="v2-row__title">{view.item.title}</span>
      <span className="v2-row__meta">
        {isUnmissable && (
          <Pill variant="urgent" size="sm">
            unmissable
          </Pill>
        )}
        {hasPending && (
          <Pill variant="neutral" size="sm">
            nudge scheduled
          </Pill>
        )}
      </span>
    </li>
  );
}
