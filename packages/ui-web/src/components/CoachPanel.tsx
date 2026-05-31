import { useMemo } from 'react';
import type { TodayItemView } from '../model';
import {
  type AccountabilityMode,
  type Adherence,
  type CoachNudge,
  coachEngine,
} from '../model/coach';
import type { SuggestionKind } from '../model/domain';
import { Icon } from '../primitives';
import type { IconName } from '../primitives';
import './CoachPanel.css';

const KIND_ICON: Partial<Record<SuggestionKind, IconName>> = {
  reschedule: 'undo',
  reduce_scope: 'arrow',
  reflect: 'spark',
  nudge: 'bell',
};

function iconForKind(kind: SuggestionKind): IconName {
  return KIND_ICON[kind] ?? 'coach';
}

const MODES: { value: AccountabilityMode; label: string }[] = [
  { value: 'gamified', label: 'Gamified' },
  { value: 'coached', label: 'Coached' },
  { value: 'self', label: 'Private' },
];

type Props = {
  views: TodayItemView[];
  now: Date;
  mode: AccountabilityMode;
  onModeChange: (mode: AccountabilityMode) => void;
  adherence?: Adherence;
};

function NudgeCard({ nudge }: { nudge: CoachNudge }) {
  return (
    <div className="coach-panel__card" data-tone={nudge.tone}>
      <span className="coach-panel__card-icon">
        <Icon name={iconForKind(nudge.kind)} size={14} tone="inherit" />
      </span>
      <div className="coach-panel__card-body">
        <p className="coach-panel__card-title">{nudge.title}</p>
        {nudge.rationale !== undefined && (
          <p className="coach-panel__card-rationale">{nudge.rationale}</p>
        )}
      </div>
    </div>
  );
}

export function CoachPanel({ views, now, mode, onModeChange, adherence }: Props) {
  const nudges = useMemo(
    () =>
      coachEngine(
        views,
        adherence ?? { ritualsCompleted: 0, missedHardStops: 0 },
        mode,
        now,
      ),
    [views, adherence, mode, now],
  );

  return (
    <section className="coach-panel" aria-label="Coach panel">
      <div className="coach-panel__segmented" role="group" aria-label="Accountability mode">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className="coach-panel__seg-btn"
            aria-pressed={mode === value}
            onClick={() => onModeChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="coach-panel__mode-caption">
        Gamified = streaks &amp; wins, Coached = a firm manager, Private = notes to your future
        self
      </p>

      <div className="coach-panel__nudges">
        {nudges.length === 0 ? (
          <div className="coach-panel__empty">
            <Icon name="coach" size={20} tone="muted" label="Coach" />
            <span>All calm — nothing to nudge right now.</span>
          </div>
        ) : (
          nudges.map((nudge) => <NudgeCard key={nudge.id} nudge={nudge} />)
        )}
      </div>
    </section>
  );
}
