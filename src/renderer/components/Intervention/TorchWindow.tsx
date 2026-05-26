import { useEffect, useState } from 'react';
import type { TorchShowPayload } from '../../../shared/ipc-contracts';
import BrainDumpPanel from './BrainDumpPanel';
import SkipPanel from './SkipPanel';
import TorchBanner from './TorchBanner';
import Torchlight from './Torchlight';
import './TorchWindow.css';

const FALLBACK: TorchShowPayload = {
  correlationId: 'unknown',
  title: 'Time to move',
  subtitle: 'Acknowledge to continue.',
  durationMs: 30_000,
};

type HeroMode = 'normal' | 'skip' | 'brain-dump';

export default function TorchWindow() {
  const [payload, setPayload] = useState<TorchShowPayload | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [snoozed, setSnoozed] = useState(false);
  const [heroMode, setHeroMode] = useState<HeroMode>('normal');

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onPayload((next) => {
      setPayload(next);
      setSnoozed(false);
      setHeroMode('normal');
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onCursor(({ x, y }) => {
      const left = window.screenX;
      const top = window.screenY;
      const right = left + window.innerWidth;
      const bottom = top + window.innerHeight;
      if (x < left || x >= right || y < top || y >= bottom) {
        setCursor(null);
      } else {
        setCursor({ x: x - left, y: y - top });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onSnoozed(() => setSnoozed(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (window.api === undefined) return;
    const unsub = window.api.torch.onHero(({ mode }) => setHeroMode(mode));
    return unsub;
  }, []);

  const effective = payload ?? FALLBACK;
  const bannerVisible = heroMode === 'normal';

  function handleSkipConfirm(reason: string, notes?: string) {
    window.api?.torch.skipConfirm({
      correlationId: effective.correlationId,
      reason,
      ...(notes !== undefined ? { notes } : {}),
    });
  }

  function handleSkipCancel() {
    window.api?.torch.skipCancel(effective.correlationId);
  }

  function handleBrainDumpSubmit(text: string) {
    window.api?.torch.brainDumpSubmit({
      correlationId: effective.correlationId,
      text,
    });
  }

  function handleBrainDumpCancel() {
    window.api?.torch.brainDumpCancel(effective.correlationId);
  }

  return (
    <div className="torch-window">
      {/* Dimming backdrop + spotlight — only in normal mode; panels own the full screen */}
      {heroMode === 'normal' && (
        <Torchlight
          active
          title={effective.title}
          subtitle={effective.subtitle}
          targetRect={null}
          cursor={cursor === null ? null : { x: cursor.x, y: cursor.y, radius: 180 }}
          timeoutMs={effective.durationMs}
          cardVisible={false}
          snoozed={snoozed}
          onAcknowledge={() => undefined}
          onTimeout={() => undefined}
        />
      )}

      {/* Compact action banner — shown in normal mode on every display */}
      <TorchBanner payload={effective} visible={bannerVisible} />

      {/* Full-screen interactive panels — sit above torchlight (z-index 9100) */}
      {heroMode === 'skip' && (
        <SkipPanel
          correlationId={effective.correlationId}
          title={effective.title}
          {...(effective.meetingStartTime !== undefined ? { meetingStartTime: effective.meetingStartTime } : {})}
          {...(effective.isMeeting !== undefined ? { isMeeting: effective.isMeeting } : {})}
          onConfirm={handleSkipConfirm}
          onCancel={handleSkipCancel}
        />
      )}
      {heroMode === 'brain-dump' && (
        <BrainDumpPanel
          correlationId={effective.correlationId}
          title={effective.title}
          onSubmit={handleBrainDumpSubmit}
          onCancel={handleBrainDumpCancel}
        />
      )}
    </div>
  );
}
