import { useEffect, useMemo, useRef, useState } from 'react';
import {
  activeTransition,
  declineBlock,
  deriveTransitionBlocks,
  TransitionOverlay,
  type SystemBlock,
  type TransitionAnchor,
  type TransitionSession,
  type TransitionSettings,
} from '@needle/ui-web';
import type { TodayData } from '@needle/ui-web';
import './screens.css';

type TransitionScreenProps = {
  data: TodayData;
  now: Date;
  transitionSettings: TransitionSettings;
  onJumpClock: (minutes: number) => void;
};

/** Derive anchors from timed items in TodayData.
 * Includes occurrences with a startsAt, and anchor-mode plans with a startTime. */
function buildAnchors(data: TodayData, now: Date): TransitionAnchor[] {
  const anchors: TransitionAnchor[] = [];
  const todayPrefix = now.toISOString().slice(0, 10);

  for (const item of data.items) {
    if (item.kind !== 'event' && item.commitmentLevel === 'soft') continue;

    // Prefer occurrence start (concrete scheduled time).
    const occ = data.occurrences.find((o) => o.itemId === item.id);
    if (occ !== undefined) {
      const startsAt = new Date(occ.startsAt);
      if (startsAt.toISOString().slice(0, 10) === todayPrefix) {
        anchors.push({
          itemId: item.id,
          title: item.title,
          startsAt,
          commitmentLevel: item.commitmentLevel,
          // Give the kids-pickup a 15-min travel buffer so leave_by fires.
          ...(item.commitmentLevel === 'unmissable' ? { travelMinutes: 15 } : {}),
        });
      }
      continue;
    }

    // Fall back to anchor-mode plan with a startTime on today.
    const plan = data.plans.find((p) => p.itemId === item.id);
    if (plan?.mode === 'anchor' && plan.startTime !== undefined) {
      const [h = 0, m = 0] = plan.startTime.split(':').map(Number);
      const startsAt = new Date(now);
      startsAt.setHours(h, m, 0, 0);
      if (startsAt.toISOString().slice(0, 10) === todayPrefix) {
        anchors.push({
          itemId: item.id,
          title: item.title,
          startsAt,
          commitmentLevel: item.commitmentLevel,
          ...(item.commitmentLevel === 'unmissable' ? { travelMinutes: 15 } : {}),
        });
      }
    }
  }

  return anchors;
}

/** Format a Date as e.g. '2:45 PM'. */
function fmtTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Seconds remaining in the active block relative to `now`. */
function secondsLeft(session: TransitionSession, now: Date): number {
  const block: SystemBlock | undefined = session.activeIndex >= 0 ? session.blocks[session.activeIndex] : undefined;
  if (block === undefined) return 0;
  const rem = Math.max(0, Math.floor((block.endsAt.getTime() - now.getTime()) / 1000));
  return rem;
}

export function TransitionScreen({ data, now, transitionSettings, onJumpClock }: TransitionScreenProps) {
  const anchors = useMemo(() => buildAnchors(data, now), [data, now]);
  const allBlocks = useMemo(
    () => deriveTransitionBlocks(anchors, transitionSettings, now),
    [anchors, transitionSettings, now],
  );

  // Local copy of blocks so decline mutations are visible without touching App state.
  const [decBlocks, setDecBlocks] = useState<SystemBlock[]>(() => allBlocks);
  // Sync when upstream blocks change (new settings, or data changed).
  const prevBlocksKeyRef = useRef<string>('');
  const blocksKey = allBlocks.map((b) => b.id).join(',');
  useEffect(() => {
    if (prevBlocksKeyRef.current !== blocksKey) {
      prevBlocksKeyRef.current = blocksKey;
      setDecBlocks(allBlocks);
    }
    // allBlocks intentionally omitted — blocksKey is the stable identity signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocksKey]);

  const session = activeTransition(decBlocks, now);

  // Live countdown for the active block.
  const [secsLeft, setSecsLeft] = useState(() => (session !== null ? secondsLeft(session, now) : 0));
  useEffect(() => {
    if (session === null) return;
    setSecsLeft(secondsLeft(session, now));
    const id = setInterval(() => {
      setSecsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [session, now]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBlockDone = (blockId: string) => {
    // Advance: mark the block declined so activeTransition moves to the next.
    setDecBlocks((prev) => declineBlock(prev, blockId));
  };

  const handleDecline = (blockId: string) => {
    setDecBlocks((prev) => declineBlock(prev, blockId));
  };

  const handlePostpone = (_blockId: string) => {
    onJumpClock(5);
  };

  const handleDumpCapture = (_text: string) => {
    // Brain dump text noted — in production this writes to TodayData.
  };

  const handleFinish = () => {
    // Demo: reset local blocks so the screen shows the idle state again.
    setDecBlocks(allBlocks);
  };

  // ── Upcoming blocks list (idle view) ─────────────────────────────────────

  const upcoming = decBlocks
    .filter((b) => b.kind !== 'leave_by' && b.startsAt.getTime() > now.getTime())
    .slice(0, 6);

  // Find the earliest session window for the "preview" jump button.
  const nextSessionBlock = decBlocks
    .filter((b) => b.kind !== 'leave_by')
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];

  const jumpToSession = () => {
    if (nextSessionBlock === undefined) return;
    const diffMs = nextSessionBlock.startsAt.getTime() - now.getTime();
    const diffMin = Math.ceil(diffMs / 60000);
    if (diffMin > 0) onJumpClock(diffMin + 1);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (session !== null) {
    return (
      <div className="screen screen--transition">
        <TransitionOverlay
          session={session}
          secondsLeftInBlock={secsLeft}
          onBlockDone={handleBlockDone}
          onDecline={handleDecline}
          onPostpone={handlePostpone}
          onDumpCapture={handleDumpCapture}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  return (
    <div className="screen screen--transition">
      <h1 className="screen__title">Transition</h1>
      <p className="screen__lede">
        Before every commitment, Needle walks you through a configurable ritual — brain dump,
        plan the next move, reset. The overlay appears automatically when a session window
        opens. Use the clock controls above to fast-forward into a window, or press the
        button below.
      </p>

      {anchors.length === 0 && (
        <p className="screen__hint">
          No timed items found in seed data for today. Add events with an occurrence or an
          anchor-mode plan.
        </p>
      )}

      {upcoming.length > 0 && (
        <section className="transition-upcoming">
          <h2 className="screen__subtitle">Upcoming blocks</h2>
          <ol className="transition-upcoming__list">
            {upcoming.map((b) => (
              <li key={b.id} className="transition-upcoming__row">
                <span className="transition-upcoming__time">{fmtTime(b.startsAt)}</span>
                <span className="transition-upcoming__label">{b.label}</span>
                <span className="transition-upcoming__anchor">{b.anchorTitle}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {nextSessionBlock !== undefined && (
        <div className="transition-jump">
          <button
            type="button"
            className="transition-jump__btn"
            onClick={jumpToSession}
          >
            Preview — jump clock to next session window
          </button>
        </div>
      )}
    </div>
  );
}
