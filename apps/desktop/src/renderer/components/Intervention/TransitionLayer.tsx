import { useEffect, useMemo, useRef, useState } from 'react';
import {
  activeTransition,
  declineBlock,
  deriveTransitionBlocks,
  TransitionOverlay,
  type SystemBlock,
  type TodayData,
  type TransitionAnchor,
  type TransitionSession,
  type TransitionSettings,
} from '@needle/ui-web';
import './TransitionLayer.css';

type TransitionLayerProps = {
  data: TodayData;
  settings: TransitionSettings;
  now: Date;
  onCapture: (text: string) => void;
};

/** Derive transition anchors from the canonical Today model. Mirrors studio's
 * TransitionScreen.buildAnchors: events OR firm/unmissable items that have a
 * concrete start instant — an occurrence.startsAt, else an anchored plan's
 * startTime on today. travelMinutes is only set when known. */
function buildAnchors(data: TodayData, now: Date): TransitionAnchor[] {
  const anchors: TransitionAnchor[] = [];
  const todayPrefix = now.toISOString().slice(0, 10);

  for (const item of data.items) {
    if (item.kind !== 'event' && item.commitmentLevel === 'soft') continue;

    // Prefer a concrete scheduled occurrence.
    const occ = data.occurrences.find((o) => o.itemId === item.id);
    if (occ !== undefined) {
      const startsAt = new Date(occ.startsAt);
      if (startsAt.toISOString().slice(0, 10) === todayPrefix) {
        anchors.push({
          itemId: item.id,
          title: item.title,
          startsAt,
          commitmentLevel: item.commitmentLevel,
          // Unmissable commitments get a travel buffer so leave_by can fire.
          ...(item.commitmentLevel === 'unmissable' ? { travelMinutes: 15 } : {}),
        });
      }
      continue;
    }

    // Fall back to an anchor-mode plan with a startTime on today.
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

/** Seconds remaining in the active block relative to `now`. */
function secondsLeft(session: TransitionSession, now: Date): number {
  const block: SystemBlock | undefined =
    session.activeIndex >= 0 ? session.blocks[session.activeIndex] : undefined;
  if (block === undefined) return 0;
  return Math.max(0, Math.floor((block.endsAt.getTime() - now.getTime()) / 1000));
}

/**
 * The single, predictable transition overlay — rendered as a full-screen div in
 * the main window (Option A). Replaces the old InterventionLayer that raced two
 * Electron windows. Driven purely by the deterministic transition engine.
 */
export default function TransitionLayer({
  data,
  settings,
  now,
  onCapture,
}: TransitionLayerProps) {
  const anchors = useMemo(() => buildAnchors(data, now), [data, now]);
  const allBlocks = useMemo(
    () => deriveTransitionBlocks(anchors, settings, now),
    [anchors, settings, now],
  );

  // Local block copy so decline / advance re-pack without touching App state.
  const [decBlocks, setDecBlocks] = useState<SystemBlock[]>(() => allBlocks);
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

  // Anchors the user finished/closed: don't immediately re-open the same one.
  const [dismissedAnchorIds, setDismissedAnchorIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const rawSession = activeTransition(decBlocks, now);
  const session =
    rawSession !== null && !dismissedAnchorIds.has(rawSession.anchorItemId) ? rawSession : null;

  // Live countdown for the active block; reseeds when the active block changes.
  const activeBlockId =
    session !== null && session.activeIndex >= 0
      ? session.blocks[session.activeIndex]?.id
      : undefined;
  const [secsLeft, setSecsLeft] = useState<number>(() =>
    session !== null ? secondsLeft(session, now) : 0,
  );
  useEffect(() => {
    if (session === null) return;
    setSecsLeft(secondsLeft(session, now));
    const id = setInterval(() => {
      setSecsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
    // Reseed on active-block change (activeBlockId) and on clock jumps (now).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlockId, now]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBlockDone = (blockId: string) => {
    // Advance: decline the finished block so activeTransition moves to the next.
    setDecBlocks((prev) => declineBlock(prev, blockId));
  };

  const handleDecline = (blockId: string) => {
    setDecBlocks((prev) => declineBlock(prev, blockId));
  };

  const handleDumpCapture = (text: string) => {
    onCapture(text);
  };

  const handleFinish = () => {
    if (session === null) return;
    const anchorId = session.anchorItemId;
    setDismissedAnchorIds((prev) => {
      const next = new Set(prev);
      next.add(anchorId);
      return next;
    });
  };

  if (session === null) return null;

  return (
    <div className="transition-layer" role="dialog" aria-modal="true" aria-label="Transition">
      <div className="transition-layer__panel">
        <TransitionOverlay
          session={session}
          secondsLeftInBlock={secsLeft}
          onBlockDone={handleBlockDone}
          onDecline={handleDecline}
          onDumpCapture={handleDumpCapture}
          onFinish={handleFinish}
        />
      </div>
    </div>
  );
}
