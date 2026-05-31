import { useEffect, useRef, useState } from 'react';
import {
  advanceRitual,
  costOf,
  createRitual,
  isRitualComplete,
  ritualProgress,
} from '../model/ritual';
import type { RitualInstance, RitualOutcome } from '../model/ritual';
import { Button, Icon, ProgressBar } from '../primitives';
import './BrainDump.css';

type Props = {
  onComplete?: (capture: string) => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BrainDump({ onComplete }: Props) {
  const [ritual, setRitual] = useState<RitualInstance>(createRitual);
  const [capture, setCapture] = useState('');

  const activeBlock = ritual.blocks[ritual.activeIndex];
  const durationSeconds = activeBlock ? activeBlock.durationMinutes * 60 : 0;
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  // Reset timer whenever activeIndex changes.
  useEffect(() => {
    const block = ritual.blocks[ritual.activeIndex];
    setSecondsLeft(block ? block.durationMinutes * 60 : 0);
  }, [ritual.activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown interval.
  useEffect(() => {
    if (isRitualComplete(ritual)) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [ritual.activeIndex, ritual.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire onComplete once when ritual becomes complete.
  const firedRef = useRef(false);
  useEffect(() => {
    if (isRitualComplete(ritual) && !firedRef.current) {
      firedRef.current = true;
      onComplete?.(capture);
    }
  }, [ritual, capture, onComplete]);

  function advance(outcome: RitualOutcome) {
    setRitual((r) => advanceRitual(r, outcome));
  }

  function reset() {
    firedRef.current = false;
    setRitual(createRitual());
    setCapture('');
  }

  const complete = isRitualComplete(ritual);
  const { done, total } = ritualProgress(ritual);

  if (complete) {
    return (
      <div className="bd" role="region" aria-label="Ritual complete">
        <div className="bd__complete-heading">Ritual complete</div>
        {capture && (
          <div className="bd__resume">
            <div className="bd__resume-label">Where you’ll pick up from</div>
            <div className="bd__resume-text">{capture}</div>
          </div>
        )}
        <Button variant="primary" onClick={reset} leadingIcon={<Icon name="play" size={14} />}>
          Start again
        </Button>
      </div>
    );
  }

  if (!activeBlock) return null;

  const skipCost = costOf(activeBlock, 'skipped');
  const postponeCost = costOf(activeBlock, 'postponed');
  const showTextarea = activeBlock.kind === 'dump' || activeBlock.kind === 'plan_next';
  const placeholder =
    activeBlock.kind === 'dump' ? 'Empty your head…' : 'Pick the one next move…';

  return (
    <div className="bd" role="region" aria-label="Transition ritual">
      {/* Progress */}
      <div className="bd__progress" aria-label={`Step ${done + 1} of ${total}`}>
        <div className="bd__dots">
          {ritual.blocks.map((block, i) => {
            const status =
              i < ritual.activeIndex
                ? 'done'
                : i === ritual.activeIndex
                  ? 'active'
                  : 'pending';
            return (
              <span
                key={block.kind}
                className={`bd__dot bd__dot--${status}`}
                aria-hidden="true"
              />
            );
          })}
        </div>
        <ProgressBar value={done} max={total} tone="upcoming" label={`${done} of ${total} steps done`} />
      </div>

      {/* Active block */}
      <div className="bd__block">
        <div className="bd__block-header">
          <span className="bd__label">{activeBlock.label}</span>
          <span className="bd__timer" aria-live="off" aria-label={`${formatTime(secondsLeft)} remaining`}>
            <Icon name="clock" size={12} tone="muted" />
            {formatTime(secondsLeft)}
          </span>
        </div>
        <p className="bd__hint">{activeBlock.hint}</p>

        {showTextarea ? (
          <textarea
            className="bd__textarea"
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            placeholder={placeholder}
            aria-label={activeBlock.label}
            rows={4}
          />
        ) : (
          <div className="bd__break-note" aria-live="polite">
            Take a full five minutes away.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bd__actions">
        <Button variant="primary" onClick={() => advance('done')} aria-label="Mark done and advance">
          Done
        </Button>
        <div className="bd__secondary-actions">
          <Button
            variant="ghost"
            onClick={() => advance('skipped')}
            aria-label={`Skip — adds ${skipCost} min drift`}
            trailing={<span className="bd__cost">+{skipCost}m drift</span>}
          >
            Skip
          </Button>
          <Button
            variant="ghost"
            onClick={() => advance('postponed')}
            aria-label={`Postpone — adds ${postponeCost} min drift`}
            trailing={<span className="bd__cost">+{postponeCost}m drift</span>}
          >
            Postpone
          </Button>
        </div>
      </div>
    </div>
  );
}
