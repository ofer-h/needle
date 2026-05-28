import { useEffect, useRef, useState } from 'react';
import './SkipPanel.css';

export type SkipPanelProps = {
  correlationId: string;
  title: string;
  meetingStartTime?: string;
  isMeeting?: boolean;
  onConfirm: (reason: string, notes?: string) => void;
  onCancel: () => void;
};

const SKIP_HOLD_MS = 4_000;
const TICK_MS = 100;

const MEETING_REASONS = [
  'Meeting was cancelled',
  'Not attending',
  'Urgent interruption',
  'Running late',
  'Other',
];
const TASK_REASONS = ['Not relevant now', 'Blocked', 'Delegating', 'Rescheduling', 'Other'];

function getCountdownSecondsLabel(elapsed: number): number {
  return Math.max(1, Math.ceil((SKIP_HOLD_MS - elapsed) / 1_000));
}

function formatMeetingCountdown(meetingStartTime: string | undefined): string {
  if (!meetingStartTime) return '';
  const [hStr, mStr] = meetingStartTime.split(':');
  const now = new Date();
  const meetingMs = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Number(hStr),
    Number(mStr),
    0,
  ).getTime();
  const diffMs = meetingMs - Date.now();
  if (diffMs <= 0) return 'NOW';
  const diffMin = Math.ceil(diffMs / 60_000);
  return `in ${diffMin}m`;
}

export default function SkipPanel({
  correlationId,
  title,
  meetingStartTime,
  isMeeting = false,
  onConfirm,
  onCancel,
}: SkipPanelProps) {
  const reasons = isMeeting ? MEETING_REASONS : TASK_REASONS;
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0] ?? '');
  const [otherNotes, setOtherNotes] = useState('');
  // null = countdown not started; number = elapsed ms since countdown start
  const [countdownElapsed, setCountdownElapsed] = useState<number | null>(null);
  const [meetingCountdown, setMeetingCountdown] = useState(() =>
    formatMeetingCountdown(meetingStartTime),
  );
  const countdownStartRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live meeting countdown ticker
  useEffect(() => {
    if (!meetingStartTime) return;
    const id = setInterval(() => {
      setMeetingCountdown(formatMeetingCountdown(meetingStartTime));
    }, 5_000);
    return () => clearInterval(id);
  }, [meetingStartTime]);

  // Skip countdown ticker
  useEffect(() => {
    if (countdownElapsed === null) return;
    if (tickRef.current !== null) clearInterval(tickRef.current);
    countdownStartRef.current = Date.now() - countdownElapsed;
    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - (countdownStartRef.current ?? Date.now());
      if (elapsed >= SKIP_HOLD_MS) {
        clearInterval(tickRef.current!);
        tickRef.current = null;
        const reason = selectedReason === 'Other' ? 'Other' : selectedReason;
        const notes =
          selectedReason === 'Other' && otherNotes.trim() !== ''
            ? otherNotes.trim()
            : undefined;
        onConfirm(reason, notes);
      } else {
        setCountdownElapsed(elapsed);
      }
    }, TICK_MS);
    return () => {
      if (tickRef.current !== null) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownElapsed !== null]);

  function startCountdown() {
    setCountdownElapsed(0);
    countdownStartRef.current = Date.now();
  }

  function cancelCountdown() {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setCountdownElapsed(null);
    countdownStartRef.current = null;
  }

  const isCountingDown = countdownElapsed !== null;
  const countdownProgress = isCountingDown ? countdownElapsed / SKIP_HOLD_MS : 0;
  const secondsLeft = isCountingDown ? getCountdownSecondsLabel(countdownElapsed) : null;
  const circumference = 2 * Math.PI * 14; // radius=14, used in SVG ring

  void correlationId; // used by parent via onConfirm callback

  return (
    <div className="skip-panel" role="dialog" aria-modal="true" aria-label="Skip this event">
      <div className="skip-panel__card">
        {/* Header */}
        <div className="skip-panel__header">
          <span className="skip-panel__title">{title}</span>
          {meetingStartTime && (
            <span className="skip-panel__countdown">{meetingCountdown}</span>
          )}
        </div>

        <hr className="skip-panel__divider" />

        {/* Reason selection */}
        <p className="skip-panel__label">Why are you skipping?</p>
        <div className="skip-panel__reasons" role="radiogroup" aria-label="Skip reason">
          {reasons.map((r) => (
            <label key={r} className="skip-panel__reason">
              <input
                type="radio"
                name="skip-reason"
                value={r}
                checked={selectedReason === r}
                onChange={() => setSelectedReason(r)}
                className="skip-panel__radio"
              />
              <span>{r}</span>
            </label>
          ))}
          {selectedReason === 'Other' && (
            <input
              type="text"
              className="skip-panel__notes"
              placeholder="Add a note (optional)"
              value={otherNotes}
              onChange={(e) => setOtherNotes(e.target.value)}
              autoFocus
            />
          )}
        </div>

        <hr className="skip-panel__divider" />

        {/* Actions */}
        <div className="skip-panel__actions">
          <button
            type="button"
            className="skip-panel__btn skip-panel__btn--cancel"
            onClick={() => {
              cancelCountdown();
              onCancel();
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            className={`skip-panel__btn skip-panel__btn--skip${isCountingDown ? ' skip-panel__btn--counting' : ''}`}
            onClick={isCountingDown ? cancelCountdown : startCountdown}
            aria-label={
              isCountingDown
                ? `Skipping in ${secondsLeft} seconds — click to cancel`
                : 'Skip this event'
            }
          >
            {isCountingDown ? (
              <>
                <svg className="skip-panel__ring" viewBox="0 0 32 32" aria-hidden="true">
                  <circle
                    cx="16" cy="16" r="14"
                    fill="none"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="16" cy="16" r="14"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - countdownProgress)}
                    strokeLinecap="round"
                    transform="rotate(-90 16 16)"
                  />
                </svg>
                Skip ({secondsLeft})
              </>
            ) : (
              'Skip...'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
