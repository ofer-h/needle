/* The Transition System engine — the heart of Needle.
 *
 * A *timed commitment* (an event/occurrence, or a fixed-start task) is an
 * ANCHOR. A set of configurable RULES (the 5/5/5 ritual + leave_by + prep)
 * deterministically derive scheduled SYSTEM BLOCKS around each anchor.
 *
 * The same derived blocks are consumed by BOTH:
 *   1. the Today timeline (shown in advance, editable, declinable), and
 *   2. the one unified Transition overlay at trigger time.
 *
 * `deriveTransitionBlocks(anchors, settings, now)` is PURE and DETERMINISTIC
 * (no Date.now / Math.random inside — `now` is passed). This is what lets the
 * engine move to the backend untouched and be driven/inspected by AI.
 *
 * Promote into @needle/domain once validated. No React, no I/O. */

import type { CommitmentLevel, ItemId } from './domain';

/** Kinds of derived block. Open enum — new kinds (travel, hydrate…) add later. */
export type SystemBlockKind = 'leave_by' | 'prep' | 'brain_dump' | 'plan_next' | 'break';

/** Commitment ranking so rules can match "at or above firm", etc. */
const COMMITMENT_RANK: Record<CommitmentLevel, number> = { soft: 0, firm: 1, unmissable: 2 };

export function commitmentAtLeast(level: CommitmentLevel, min: CommitmentLevel): boolean {
  return COMMITMENT_RANK[level] >= COMMITMENT_RANK[min];
}

/** A timed commitment the transition system schedules around. */
export type TransitionAnchor = {
  itemId: ItemId;
  title: string;
  /** When the commitment actually starts. */
  startsAt: Date;
  commitmentLevel: CommitmentLevel;
  /** Minutes needed to physically travel there (drives `leave_by`). */
  travelMinutes?: number;
};

/** One configurable rule. The 5/5/5 ritual is three of these (`brain_dump`,
 * `plan_next`, `break`); `prep` and `leave_by` are two more. Order is
 * user-configurable (Ofer: "any order we configured"). */
export type TransitionRule = {
  kind: SystemBlockKind;
  enabled: boolean;
  durationMinutes: number;
  /** Position in the pre-commitment sequence (lower = earlier). */
  order: number;
  /** Only apply to anchors at/above this commitment level. */
  minCommitment: CommitmentLevel;
  label: string;
  hint: string;
};

export type TransitionSettings = {
  /** The ordered rule set. Saved per-user; overridable per anchor later. */
  rules: TransitionRule[];
};

/** A derived, schedulable block. `id` is deterministic from anchor + kind so
 * regeneration is stable and the block is never orphaned. */
export type SystemBlock = {
  id: string;
  anchorItemId: ItemId;
  anchorTitle: string;
  kind: SystemBlockKind;
  label: string;
  hint: string;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  order: number;
  /** Declined in advance or fused away during the live transition. */
  declined: boolean;
};

/** The canonical default ritual: 5 dump → 5 plan-next → 5 break, plus prep and
 * leave_by. Order is editable in Settings; these are sensible defaults. */
export const DEFAULT_TRANSITION_RULES: TransitionRule[] = [
  {
    kind: 'leave_by',
    enabled: true,
    durationMinutes: 0,
    order: 0,
    minCommitment: 'unmissable',
    label: 'Leave by',
    hint: 'Time to physically head out so you arrive on time.',
  },
  {
    kind: 'brain_dump',
    enabled: true,
    durationMinutes: 5,
    order: 1,
    minCommitment: 'firm',
    label: 'Brain dump',
    hint: 'Empty your head — everything on your mind, no filtering.',
  },
  {
    kind: 'plan_next',
    enabled: true,
    durationMinutes: 5,
    order: 2,
    minCommitment: 'firm',
    label: 'Plan the next move',
    hint: 'Pick the one thing to do next and when.',
  },
  {
    kind: 'break',
    enabled: true,
    durationMinutes: 5,
    order: 3,
    minCommitment: 'firm',
    label: 'Reset',
    hint: 'Stand, breathe, look away from the screen.',
  },
  {
    kind: 'prep',
    enabled: false,
    durationMinutes: 10,
    order: 4,
    minCommitment: 'firm',
    label: 'Prep',
    hint: 'Get ready for what is about to start.',
  },
];

export const defaultTransitionSettings = (): TransitionSettings => ({
  rules: DEFAULT_TRANSITION_RULES.map((r) => ({ ...r })),
});

const MS_PER_MIN = 60_000;

function blockId(anchorItemId: ItemId, kind: SystemBlockKind): string {
  return `sys_${anchorItemId}_${kind}`;
}

/**
 * Derive every system block for the given anchors under the given settings.
 *
 * Packing model: the in-meeting prep sequence (`brain_dump`/`plan_next`/`break`/
 * `prep`, by `order`) is packed to END exactly at the anchor's start, so the
 * last block butts up against the meeting. `leave_by` is special: it sits at
 * `start - travelMinutes` (a hard stop to physically depart) and has zero
 * duration (it's a moment, not a span).
 *
 * Pure + deterministic: same inputs (incl. `now`) → identical output. `now` is
 * accepted for symmetry with consumers/tests; it does not affect derivation,
 * only callers' filtering (see `activeTransition`).
 */
export function deriveTransitionBlocks(
  anchors: TransitionAnchor[],
  settings: TransitionSettings,
  _now?: Date,
): SystemBlock[] {
  const blocks: SystemBlock[] = [];

  for (const anchor of anchors) {
    const applicable = settings.rules
      .filter((r) => r.enabled && commitmentAtLeast(anchor.commitmentLevel, r.minCommitment))
      .slice()
      .sort((a, b) => a.order - b.order);

    // Sequence (everything except leave_by) packs to end at the anchor start.
    const sequence = applicable.filter((r) => r.kind !== 'leave_by');
    const totalSeqMin = sequence.reduce((sum, r) => sum + r.durationMinutes, 0);
    let cursor = new Date(anchor.startsAt.getTime() - totalSeqMin * MS_PER_MIN);

    for (const rule of sequence) {
      const startsAt = new Date(cursor);
      const endsAt = new Date(cursor.getTime() + rule.durationMinutes * MS_PER_MIN);
      blocks.push({
        id: blockId(anchor.itemId, rule.kind),
        anchorItemId: anchor.itemId,
        anchorTitle: anchor.title,
        kind: rule.kind,
        label: rule.label,
        hint: rule.hint,
        startsAt,
        endsAt,
        durationMinutes: rule.durationMinutes,
        order: rule.order,
        declined: false,
      });
      cursor = endsAt;
    }

    // leave_by: a zero-length hard stop at start - travelMinutes.
    const leaveByRule = applicable.find((r) => r.kind === 'leave_by');
    if (leaveByRule && anchor.travelMinutes && anchor.travelMinutes > 0) {
      const at = new Date(anchor.startsAt.getTime() - anchor.travelMinutes * MS_PER_MIN);
      blocks.push({
        id: blockId(anchor.itemId, 'leave_by'),
        anchorItemId: anchor.itemId,
        anchorTitle: anchor.title,
        kind: 'leave_by',
        label: leaveByRule.label,
        hint: leaveByRule.hint,
        startsAt: at,
        endsAt: at,
        durationMinutes: 0,
        order: leaveByRule.order,
        declined: false,
      });
    }
  }

  return blocks.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** A live transition session: the run of blocks for one anchor, plus which one
 * is active right now. This is what the unified overlay renders. */
export type TransitionSession = {
  anchorItemId: ItemId;
  anchorTitle: string;
  anchorStartsAt: Date;
  blocks: SystemBlock[];
  /** Index of the block active at `now`, or -1 if none/over. */
  activeIndex: number;
};

/**
 * Find the transition session that should be on screen at `now`, if any.
 * A session is active from its first non-leave_by block's start until the
 * anchor's start. Returns the nearest such session (earliest start wins).
 */
export function activeTransition(blocks: SystemBlock[], now: Date): TransitionSession | null {
  const byAnchor = new Map<ItemId, SystemBlock[]>();
  for (const b of blocks) {
    if (b.kind === 'leave_by') continue;
    const arr = byAnchor.get(b.anchorItemId) ?? [];
    arr.push(b);
    byAnchor.set(b.anchorItemId, arr);
  }

  let best: TransitionSession | null = null;
  for (const [anchorItemId, anchorBlocks] of byAnchor) {
    const active = anchorBlocks.filter((b) => !b.declined).sort(
      (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    );
    if (active.length === 0) continue;
    const first = active[0]!;
    const last = active[active.length - 1]!;
    if (now.getTime() < first.startsAt.getTime() || now.getTime() >= last.endsAt.getTime()) continue;

    const activeIndex = active.findIndex(
      (b) => now.getTime() >= b.startsAt.getTime() && now.getTime() < b.endsAt.getTime(),
    );
    const session: TransitionSession = {
      anchorItemId,
      anchorTitle: first.anchorTitle,
      anchorStartsAt: last.endsAt,
      blocks: active,
      activeIndex,
    };
    if (!best || first.startsAt.getTime() < best.blocks[0]!.startsAt.getTime()) best = session;
  }
  return best;
}

/**
 * Decline a block ("skip the break, ping me in 5"). The block's minutes are
 * freed: it's marked declined with zero duration, and the remaining sequence is
 * re-packed so the surviving blocks still end at the anchor start. Pure —
 * returns a new array.
 */
export function declineBlock(blocks: SystemBlock[], blockId: string): SystemBlock[] {
  const target = blocks.find((b) => b.id === blockId);
  if (!target) return blocks;

  const anchorId = target.anchorItemId;
  const anchorStart = blocks
    .filter((b) => b.anchorItemId === anchorId && b.kind !== 'leave_by')
    .reduce((max, b) => Math.max(max, b.endsAt.getTime()), 0);

  const others = blocks.filter((b) => b.anchorItemId !== anchorId);
  const sequence = blocks
    .filter((b) => b.anchorItemId === anchorId && b.kind !== 'leave_by')
    .map((b) => (b.id === blockId ? { ...b, declined: true, durationMinutes: 0 } : { ...b }))
    .sort((a, b) => a.order - b.order);
  const leaveBy = blocks.filter((b) => b.anchorItemId === anchorId && b.kind === 'leave_by');

  const totalMin = sequence.reduce((sum, b) => sum + b.durationMinutes, 0);
  let cursor = anchorStart - totalMin * MS_PER_MIN;
  const repacked = sequence.map((b) => {
    const startsAt = new Date(cursor);
    const endsAt = new Date(cursor + b.durationMinutes * MS_PER_MIN);
    cursor = endsAt.getTime();
    return { ...b, startsAt, endsAt };
  });

  return [...others, ...repacked, ...leaveBy].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
}

/** Human label for a block kind (UI convenience). */
export function systemBlockKindLabel(kind: SystemBlockKind): string {
  switch (kind) {
    case 'leave_by':
      return 'Leave by';
    case 'prep':
      return 'Prep';
    case 'brain_dump':
      return 'Brain dump';
    case 'plan_next':
      return 'Plan next';
    case 'break':
      return 'Break';
  }
}
