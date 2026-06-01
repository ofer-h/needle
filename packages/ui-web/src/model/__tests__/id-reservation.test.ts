import { beforeEach, describe, expect, it } from 'vitest';
import {
  addChild,
  addItem,
  childrenOf,
  reserveIdsFromData,
  resetIds,
} from '../index';
import type { TodayData } from '../today';

/** A previous session's data: items A and B, with one child under B. After this
 * runs the id counter has advanced, but a reload resets it back to 0. */
function priorSessionData(): TodayData {
  resetIds();
  const empty: TodayData = { items: [], plans: [], occurrences: [], relations: [] };
  const a = addItem(empty, { title: 'A' });
  const b = addItem(a.data, { title: 'B' });
  const withChild = addChild(b.data, b.itemId, 'B-child');
  return withChild;
}

describe('runtime id reservation after reload', () => {
  beforeEach(() => resetIds());

  it('collides when ids are NOT reserved (documents the bug)', () => {
    const data = priorSessionData();
    const aId = data.items[0]!.id;

    // Simulate a reload: the per-process counter resets to 0, but `data` was
    // loaded from persistence and still holds the previous session's ids.
    resetIds();

    const next = addChild(data, aId, 'A-child');
    const ids = next.items.map((i) => i.id);
    // A freshly minted id duplicates an existing one.
    expect(new Set(ids).size).toBeLessThan(ids.length);
  });

  it('reserveIdsFromData prevents collisions after reload', () => {
    const data = priorSessionData();
    const aId = data.items[0]!.id;

    resetIds();
    reserveIdsFromData(data);

    const next = addChild(data, aId, 'A-child');
    const ids = next.items.map((i) => i.id);
    // Every id is unique…
    expect(new Set(ids).size).toBe(ids.length);
    // …and childrenOf(A) resolves to the real new child, not a pre-existing item.
    expect(childrenOf(next, aId).map((i) => i.title)).toEqual(['A-child']);
  });
});
