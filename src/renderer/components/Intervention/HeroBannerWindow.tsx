import { useEffect, useState } from 'react';
import type { TorchShowPayload } from '../../../shared/ipc-contracts';
import './HeroBannerWindow.css';

const FALLBACK: TorchShowPayload = {
  correlationId: 'unknown',
  title: 'Heads up',
  subtitle: 'Time to move',
  durationMs: 30_000,
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

export default function HeroBannerWindow() {
  const [payload, setPayload] = useState<TorchShowPayload>(FALLBACK);
  const [clock, setClock] = useState(formatClock);
  const [meetingIn, setMeetingIn] = useState(() => formatMeetingIn(undefined));
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onPayload((next) => {
      setPayload(next);
      setMeetingIn(formatMeetingIn(next.meetingStartTime));
      setHidden(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onHero(({ mode }) => {
      // Banner hides when skip or brain-dump panel takes over the overlays.
      setHidden(mode === 'skip' || mode === 'brain-dump');
    });
    return unsub;
  }, []);

  // Update clock and meeting countdown every 5s
  useEffect(() => {
    const id = setInterval(() => {
      setClock(formatClock());
      setMeetingIn(formatMeetingIn(payload.meetingStartTime));
    }, 5_000);
    return () => clearInterval(id);
  }, [payload.meetingStartTime]);

  function openBrainDump() {
    window.api?.torch.brainDumpInit(payload.correlationId);
  }

  function initSkip() {
    window.api?.torch.skipInit(payload.correlationId);
  }

  const meetingLabel = meetingIn
    ? `${payload.title}  ·  ${meetingIn}  ·  ${clock}`
    : `${payload.title}  ·  ${clock}`;

  return (
    <div
      className={`hero-banner${hidden ? ' hero-banner--hidden' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="hero-banner__label" title={payload.subtitle}>
        {meetingLabel}
      </span>
      <div className="hero-banner__actions">
        <button
          type="button"
          className="hero-banner__btn hero-banner__btn--primary"
          onClick={openBrainDump}
        >
          Brain dump
        </button>
        <button
          type="button"
          className="hero-banner__btn hero-banner__btn--skip"
          onClick={initSkip}
        >
          Skip&hellip;
        </button>
      </div>
    </div>
  );
}
