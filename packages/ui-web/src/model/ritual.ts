/* Transition ritual instances — the timed 5/5/5 brain-dump (dump / plan next /
 * break). Each sub-block tracks done|skipped|postponed with a knock-on cost,
 * per docs/v2/accountability-and-scoring.md. Pure state + transitions. */

import { uid } from './ids';

export type RitualBlockKind = 'dump' | 'plan_next' | 'break';
export type RitualBlockStatus = 'pending' | 'active' | 'done' | 'skipped' | 'postponed';

export type RitualBlock = {
  kind: RitualBlockKind;
  label: string;
  hint: string;
  durationMinutes: number;
  status: RitualBlockStatus;
};

export type RitualInstance = {
  id: string;
  blocks: RitualBlock[];
  activeIndex: number;
  /** "Where to pick up from" when the ritual is resumed later. */
  resumeNote?: string;
  completedAt?: number;
};

export type RitualOutcome = 'done' | 'skipped' | 'postponed';

const DEFAULT_BLOCKS: RitualBlock[] = [
  { kind: 'dump', label: 'Brain dump', hint: 'Empty your head — everything on your mind, no filtering.', durationMinutes: 5, status: 'active' },
  { kind: 'plan_next', label: 'Plan the next move', hint: 'Pick the one thing to do next and when.', durationMinutes: 5, status: 'pending' },
  { kind: 'break', label: 'Reset', hint: 'Stand, breathe, look away from the screen.', durationMinutes: 5, status: 'pending' },
];

/** Fresh 5/5/5 ritual with the first block active. */
export function createRitual(): RitualInstance {
  return { id: uid('ritual'), blocks: DEFAULT_BLOCKS.map((b) => ({ ...b })), activeIndex: 0 };
}

/** Resolve the active block and advance to the next pending one. Skipping or
 * postponing the dump block carries a knock-on cost (see costOf). */
export function advanceRitual(ritual: RitualInstance, outcome: RitualOutcome): RitualInstance {
  const blocks = ritual.blocks.map((b) => ({ ...b }));
  const active = blocks[ritual.activeIndex];
  if (active) active.status = outcome;

  const nextIndex = blocks.findIndex((b, i) => i > ritual.activeIndex && b.status === 'pending');
  if (nextIndex >= 0) {
    const nextBlock = blocks[nextIndex];
    if (nextBlock) nextBlock.status = 'active';
    return { ...ritual, blocks, activeIndex: nextIndex };
  }
  // No more blocks — ritual complete.
  return { ...ritual, blocks, activeIndex: blocks.length, completedAt: Date.now() };
}

/** Knock-on cost (minutes of drift) for not completing a block. Skipping the
 * dump costs the most — it's the load-bearing step. */
export function costOf(block: RitualBlock, outcome: RitualOutcome): number {
  if (outcome === 'done') return 0;
  const base = outcome === 'skipped' ? 2 : 1;
  return block.kind === 'dump' ? base * 5 : base * 2;
}

export function ritualProgress(ritual: RitualInstance): { done: number; total: number } {
  return {
    done: ritual.blocks.filter((b) => b.status === 'done').length,
    total: ritual.blocks.length,
  };
}

export function isRitualComplete(ritual: RitualInstance): boolean {
  return ritual.activeIndex >= ritual.blocks.length;
}
