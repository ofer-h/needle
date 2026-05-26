import { useEffect, useState } from 'react';
import type { TorchShowPayload } from '../../../shared/ipc-contracts';
import './TorchBanner.css';

export type TorchBannerProps = {
  payload: TorchShowPayload;
  /** heroMode drives visibility — banner is hidden when a full-screen panel is active */
  visible: boolean;
};

function formatClock(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMeetingIn(meetingStartTime: string | undefined): string {
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

export default function TorchBanner({ payload, visible }: TorchBannerProps) {
  const [clock, setClock] = useState(formatClock);
  const [meetingIn, setMeetingIn] = useState(() => formatMeetingIn(payload.meetingStartTime));

  // Refresh clock + meeting countdown every 5s
  useEffect(() => {
    const id = setInterval(() => {
      setClock(formatClock());
      setMeetingIn(formatMeetingIn(payload.meetingStartTime));
    }, 5_000);
    return () => clearInterval(id);
  }, [payload.meetingStartTime]);

  // Reset when a new payload arrives (e.g. new intervention)
  useEffect(() => {
    setClock(formatClock());
    setMeetingIn(formatMeetingIn(payload.meetingStartTime));
  }, [payload.correlationId, payload.meetingStartTime]);

  function handleBrainDump() {
    window.api?.torch.brainDumpInit(payload.correlationId);
  }

  function handleSkip() {
    window.api?.torch.skipInit(payload.correlationId);
  }

  const label = meetingIn
    ? `${payload.title}  ·  ${meetingIn}  ·  ${clock}`
    : `${payload.title}  ·  ${clock}`;

  return (
    <div
      className={`torch-banner${visible ? '' : ' torch-banner--hidden'}`}
      role="status"
      aria-label={label}
    >
      <span className="torch-banner__label" title={payload.subtitle}>
        {label}
      </span>
      <div className="torch-banner__actions">
        <button
          type="button"
          className="torch-banner__btn torch-banner__btn--primary"
          onClick={handleBrainDump}
        >
          Brain dump
        </button>
        <button
          type="button"
          className="torch-banner__btn torch-banner__btn--skip"
          onClick={handleSkip}
        >
          Skip&hellip;
        </button>
      </div>
    </div>
  );
}
