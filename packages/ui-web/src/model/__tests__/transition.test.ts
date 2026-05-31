import { describe, expect, it } from 'vitest';
import {
  activeTransition,
  commitmentAtLeast,
  declineBlock,
  defaultTransitionSettings,
  deriveTransitionBlocks,
  type SystemBlock,
  type TransitionAnchor,
  type TransitionSettings,
} from '../transition';
import { brand } from '../ids';
import type { ItemId } from '../domain';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ANCHOR_START = new Date(2026, 4, 31, 15, 0, 0); // 15:00 local

function makeAnchor(overrides: Partial<TransitionAnchor> = {}): TransitionAnchor {
  return {
    itemId: brand<ItemId>('item-anchor'),
    title: 'Team standup',
    startsAt: ANCHOR_START,
    commitmentLevel: 'unmissable',
    ...overrides,
  };
}

/** Return only the blocks belonging to `anchorItemId`, sorted by startsAt. */
function blocksFor(blocks: SystemBlock[], anchorItemId: ItemId): SystemBlock[] {
  return blocks
    .filter((b) => b.anchorItemId === anchorItemId)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

// ---------------------------------------------------------------------------
// commitmentAtLeast
// ---------------------------------------------------------------------------

describe('commitmentAtLeast', () => {
  it('soft >= soft', () => expect(commitmentAtLeast('soft', 'soft')).toBe(true));
  it('firm >= soft', () => expect(commitmentAtLeast('firm', 'soft')).toBe(true));
  it('unmissable >= firm', () => expect(commitmentAtLeast('unmissable', 'firm')).toBe(true));
  it('soft is NOT >= firm', () => expect(commitmentAtLeast('soft', 'firm')).toBe(false));
  it('firm is NOT >= unmissable', () => expect(commitmentAtLeast('firm', 'unmissable')).toBe(false));
});

// ---------------------------------------------------------------------------
// deriveTransitionBlocks — unmissable anchor
// ---------------------------------------------------------------------------

describe('deriveTransitionBlocks — unmissable anchor at 15:00', () => {
  it('packs blocks to end exactly at anchor start (last block endsAt === 15:00)', () => {
    const settings = defaultTransitionSettings();
    const anchor = makeAnchor();
    const blocks = deriveTransitionBlocks([anchor], settings);
    const seq = blocksFor(blocks, anchor.itemId).filter((b) => b.kind !== 'leave_by');

    const last = seq[seq.length - 1];
    expect(last).toBeDefined();
    expect(last!.endsAt.getTime()).toBe(ANCHOR_START.getTime());
  });

  it('blocks are contiguous — each block starts where the previous ends', () => {
    const settings = defaultTransitionSettings();
    const blocks = deriveTransitionBlocks([makeAnchor()], settings);
    const seq = blocks.filter((b) => b.kind !== 'leave_by');

    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]!.startsAt.getTime()).toBe(seq[i - 1]!.endsAt.getTime());
    }
  });

  it('total sequence duration equals the sum of individual block durations', () => {
    const settings = defaultTransitionSettings();
    const anchor = makeAnchor();
    const blocks = deriveTransitionBlocks([anchor], settings);
    const seq = blocksFor(blocks, anchor.itemId).filter((b) => b.kind !== 'leave_by');

    const sumMin = seq.reduce((acc, b) => acc + b.durationMinutes, 0);
    const spanMin =
      (seq[seq.length - 1]!.endsAt.getTime() - seq[0]!.startsAt.getTime()) / 60_000;
    expect(sumMin).toBe(spanMin);
  });

  it('includes brain_dump, plan_next, and break blocks for unmissable', () => {
    const blocks = deriveTransitionBlocks([makeAnchor()], defaultTransitionSettings());
    const kinds = blocks.map((b) => b.kind);
    expect(kinds).toContain('brain_dump');
    expect(kinds).toContain('plan_next');
    expect(kinds).toContain('break');
  });

  it('does NOT include leave_by when travelMinutes is absent', () => {
    const blocks = deriveTransitionBlocks([makeAnchor()], defaultTransitionSettings());
    expect(blocks.some((b) => b.kind === 'leave_by')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// deriveTransitionBlocks — firm anchor
// ---------------------------------------------------------------------------

describe('deriveTransitionBlocks — firm anchor', () => {
  it('gets firm-level blocks (brain_dump, plan_next, break)', () => {
    const anchor = makeAnchor({ commitmentLevel: 'firm', itemId: brand<ItemId>('item-firm') });
    const blocks = deriveTransitionBlocks([anchor], defaultTransitionSettings());
    const seq = blocksFor(blocks, anchor.itemId);
    const kinds = seq.map((b) => b.kind);
    expect(kinds).toContain('brain_dump');
    expect(kinds).toContain('plan_next');
    expect(kinds).toContain('break');
  });

  it('does NOT include leave_by (minCommitment is unmissable) even with travelMinutes', () => {
    const anchor = makeAnchor({
      commitmentLevel: 'firm',
      itemId: brand<ItemId>('item-firm-travel'),
      travelMinutes: 20,
    });
    const blocks = deriveTransitionBlocks([anchor], defaultTransitionSettings());
    expect(blocks.some((b) => b.kind === 'leave_by')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// deriveTransitionBlocks — soft anchor
// ---------------------------------------------------------------------------

describe('deriveTransitionBlocks — soft anchor', () => {
  it('produces NO blocks (all enabled rules require at least firm)', () => {
    const anchor = makeAnchor({ commitmentLevel: 'soft', itemId: brand<ItemId>('item-soft') });
    const blocks = deriveTransitionBlocks([anchor], defaultTransitionSettings());
    expect(blocks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// deriveTransitionBlocks — leave_by
// ---------------------------------------------------------------------------

describe('deriveTransitionBlocks — leave_by', () => {
  it('appears when travelMinutes is set on an unmissable anchor', () => {
    const anchor = makeAnchor({ travelMinutes: 30 });
    const blocks = deriveTransitionBlocks([anchor], defaultTransitionSettings());
    const lb = blocks.find((b) => b.kind === 'leave_by');
    expect(lb).toBeDefined();
  });

  it('is placed at startsAt − travelMinutes', () => {
    const travel = 30;
    const anchor = makeAnchor({ travelMinutes: travel });
    const blocks = deriveTransitionBlocks([anchor], defaultTransitionSettings());
    const lb = blocks.find((b) => b.kind === 'leave_by')!;
    const expectedMs = ANCHOR_START.getTime() - travel * 60_000;
    expect(lb.startsAt.getTime()).toBe(expectedMs);
  });

  it('has duration 0 (it is a moment, not a span)', () => {
    const anchor = makeAnchor({ travelMinutes: 15 });
    const blocks = deriveTransitionBlocks([anchor], defaultTransitionSettings());
    const lb = blocks.find((b) => b.kind === 'leave_by')!;
    expect(lb.durationMinutes).toBe(0);
    expect(lb.endsAt.getTime()).toBe(lb.startsAt.getTime());
  });

  it('does NOT appear when travelMinutes is 0', () => {
    const anchor = makeAnchor({ travelMinutes: 0 });
    const blocks = deriveTransitionBlocks([anchor], defaultTransitionSettings());
    expect(blocks.some((b) => b.kind === 'leave_by')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Block id determinism
// ---------------------------------------------------------------------------

describe('block ids', () => {
  it('are deterministic: sys_<itemId>_<kind>', () => {
    const anchor = makeAnchor({ itemId: brand<ItemId>('item-x') });
    const blocks = deriveTransitionBlocks([anchor], defaultTransitionSettings());
    for (const b of blocks) {
      expect(b.id).toBe(`sys_${b.anchorItemId}_${b.kind}`);
    }
  });

  it('are stable across two independent calls with the same inputs', () => {
    const anchor = makeAnchor({ itemId: brand<ItemId>('item-stable') });
    const settings = defaultTransitionSettings();
    const first = deriveTransitionBlocks([anchor], settings).map((b) => b.id);
    const second = deriveTransitionBlocks([anchor], settings).map((b) => b.id);
    expect(first).toEqual(second);
  });
});

// ---------------------------------------------------------------------------
// activeTransition
// ---------------------------------------------------------------------------

describe('activeTransition', () => {
  // With default settings: 3 × 5-min blocks → session 14:45–15:00
  const anchor = makeAnchor({ itemId: brand<ItemId>('item-active') });
  const settings = defaultTransitionSettings();
  const blocks = deriveTransitionBlocks([anchor], settings);

  it('returns null before the first block starts', () => {
    const before = new Date(2026, 4, 31, 14, 44, 0); // 14:44
    expect(activeTransition(blocks, before)).toBeNull();
  });

  it('returns null at or after the anchor start (session is over)', () => {
    const atAnchor = new Date(2026, 4, 31, 15, 0, 0); // exactly 15:00
    expect(activeTransition(blocks, atAnchor)).toBeNull();
  });

  it('returns a session when now is inside the window', () => {
    const during = new Date(2026, 4, 31, 14, 50, 0); // 14:50 — inside brain_dump+plan_next
    const session = activeTransition(blocks, during);
    expect(session).not.toBeNull();
    expect(session!.anchorItemId).toBe(anchor.itemId);
  });

  it('activeIndex points at the block containing now', () => {
    // brain_dump: 14:45–14:50; plan_next: 14:50–14:55; break: 14:55–15:00
    const duringBreak = new Date(2026, 4, 31, 14, 57, 0); // 14:57 — in break
    const session = activeTransition(blocks, duringBreak);
    expect(session).not.toBeNull();
    const activeBlock = session!.blocks[session!.activeIndex];
    expect(activeBlock).toBeDefined();
    expect(activeBlock!.kind).toBe('break');
  });

  it('anchorStartsAt matches the anchor startsAt', () => {
    const during = new Date(2026, 4, 31, 14, 46, 0);
    const session = activeTransition(blocks, during);
    expect(session!.anchorStartsAt.getTime()).toBe(ANCHOR_START.getTime());
  });
});

// ---------------------------------------------------------------------------
// declineBlock
// ---------------------------------------------------------------------------

describe('declineBlock', () => {
  const anchor = makeAnchor({ itemId: brand<ItemId>('item-decline') });

  function freshBlocks(s: TransitionSettings = defaultTransitionSettings()): SystemBlock[] {
    return deriveTransitionBlocks([anchor], s);
  }

  it('returns a new array (input is not mutated)', () => {
    const original = freshBlocks();
    const originalIds = original.map((b) => b.id);
    const brainDump = original.find((b) => b.kind === 'brain_dump')!;
    const next = declineBlock(original, brainDump.id);
    expect(next).not.toBe(original);
    expect(original.map((b) => b.id)).toEqual(originalIds);
  });

  it('marks the declined block with declined=true and durationMinutes=0', () => {
    const original = freshBlocks();
    const brainDump = original.find((b) => b.kind === 'brain_dump')!;
    const next = declineBlock(original, brainDump.id);
    const declined = next.find((b) => b.id === brainDump.id)!;
    expect(declined.declined).toBe(true);
    expect(declined.durationMinutes).toBe(0);
  });

  it('surviving blocks still end at the anchor start', () => {
    const original = freshBlocks();
    const brainDump = original.find((b) => b.kind === 'brain_dump')!;
    const next = declineBlock(original, brainDump.id);
    const seq = next.filter((b) => b.anchorItemId === anchor.itemId && b.kind !== 'leave_by');
    const last = seq[seq.length - 1]!;
    expect(last.endsAt.getTime()).toBe(ANCHOR_START.getTime());
  });

  it('frees the declined minutes — session window starts 5 min later', () => {
    const original = freshBlocks();
    const brainDump = original.find((b) => b.kind === 'brain_dump')!;
    // brain_dump originally starts at anchorStart - 15min (14:45)
    const originalBrainDumpStart = brainDump.startsAt.getTime();
    const next = declineBlock(original, brainDump.id);
    const newBrainDump = next.find((b) => b.kind === 'brain_dump')!;
    // After decline: totalMin = 10 (plan_next + break), so cursor starts at
    // anchorStart - 10min (14:50). Declined block (0 dur) is at 14:50 — 5 min later.
    expect(newBrainDump.startsAt.getTime()).toBe(originalBrainDumpStart + 5 * 60_000);
  });

  it('ignores an unknown block id and returns the original array', () => {
    const original = freshBlocks();
    const result = declineBlock(original, 'sys_item-decline_nonexistent');
    expect(result).toBe(original);
  });

  it('re-packed blocks are still contiguous after decline', () => {
    const original = freshBlocks();
    const brainDump = original.find((b) => b.kind === 'brain_dump')!;
    const next = declineBlock(original, brainDump.id);
    // Filter only non-declined, non-leave_by blocks sorted by order.
    const active = next
      .filter((b) => b.anchorItemId === anchor.itemId && b.kind !== 'leave_by' && !b.declined)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    for (let i = 1; i < active.length; i++) {
      expect(active[i]!.startsAt.getTime()).toBe(active[i - 1]!.endsAt.getTime());
    }
  });
});
