import { describe, expect, it } from 'vitest';
import {
  assignTag,
  createTag,
  deleteTag,
  makeTag,
  tagsForItem,
  unassignTag,
  type Tag,
} from '../tags';
import { brand } from '../ids';
import type { ItemId } from '../domain';
import type { TodayData } from '../today';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyData(): TodayData {
  return { items: [], plans: [], occurrences: [], relations: [] };
}

const ITEM_A = brand<ItemId>('item-a');
const ITEM_B = brand<ItemId>('item-b');

// ---------------------------------------------------------------------------
// makeTag
// ---------------------------------------------------------------------------

describe('makeTag', () => {
  it('returns a Tag with the given name and color', () => {
    const tag = makeTag('Focus', 'blue');
    expect(tag.name).toBe('Focus');
    expect(tag.color).toBe('blue');
  });

  it('trims whitespace from the name', () => {
    const tag = makeTag('  Admin  ', 'rose');
    expect(tag.name).toBe('Admin');
  });

  it('generates a non-empty id', () => {
    const tag = makeTag('Work', 'green');
    expect(tag.id).toBeTruthy();
  });

  it('attaches automation when provided', () => {
    const tag = makeTag('Follow-up', 'amber', { onAssign: 'create_followup' });
    expect(tag.automation?.onAssign).toBe('create_followup');
  });

  it('does NOT add an automation property when omitted', () => {
    const tag = makeTag('Simple', 'slate');
    expect('automation' in tag).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createTag
// ---------------------------------------------------------------------------

describe('createTag', () => {
  it('returns { data, tag } with the new tag appended to data.tags', () => {
    const data = emptyData();
    const { data: next, tag } = createTag(data, 'Urgent', 'rose');
    expect(tag.name).toBe('Urgent');
    expect(next.tags).toHaveLength(1);
    expect(next.tags![0]).toBe(tag);
  });

  it('does NOT mutate the original TodayData', () => {
    const data = emptyData();
    const originalTags = data.tags;
    createTag(data, 'New', 'blue');
    expect(data.tags).toBe(originalTags); // still undefined — same reference
  });

  it('accumulates tags across multiple calls', () => {
    let data = emptyData();
    const r1 = createTag(data, 'Alpha', 'green');
    const r2 = createTag(r1.data, 'Beta', 'violet');
    expect(r2.data.tags).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// assignTag / unassignTag
// ---------------------------------------------------------------------------

describe('assignTag', () => {
  it('links a tag to an item', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    expect(d2.itemTags).toHaveLength(1);
    expect(d2.itemTags![0]!.itemId).toBe(ITEM_A);
    expect(d2.itemTags![0]!.tagId).toBe(tag.id);
  });

  it('is idempotent — assigning twice yields one entry', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    const d3 = assignTag(d2, ITEM_A, tag.id);
    expect(d3.itemTags).toHaveLength(1);
  });

  it('returns the exact same TodayData reference on duplicate assign', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    const d3 = assignTag(d2, ITEM_A, tag.id);
    expect(d3).toBe(d2);
  });

  it('does NOT mutate the original TodayData', () => {
    const data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const originalItemTags = d1.itemTags;
    assignTag(d1, ITEM_A, tag.id);
    expect(d1.itemTags).toBe(originalItemTags);
  });
});

describe('unassignTag', () => {
  it('removes the link between item and tag', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    const d3 = unassignTag(d2, ITEM_A, tag.id);
    expect(d3.itemTags).toHaveLength(0);
  });

  it('only removes the specific item-tag pair (other assignments survive)', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    const d3 = assignTag(d2, ITEM_B, tag.id);
    const d4 = unassignTag(d3, ITEM_A, tag.id);
    expect(d4.itemTags).toHaveLength(1);
    expect(d4.itemTags![0]!.itemId).toBe(ITEM_B);
  });

  it('does NOT mutate the original TodayData', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    const originalItemTags = d2.itemTags;
    unassignTag(d2, ITEM_A, tag.id);
    expect(d2.itemTags).toBe(originalItemTags);
  });
});

// ---------------------------------------------------------------------------
// tagsForItem
// ---------------------------------------------------------------------------

describe('tagsForItem', () => {
  it('returns the tags attached to an item in registry order', () => {
    let data = emptyData();
    const r1 = createTag(data, 'Alpha', 'green');
    const r2 = createTag(r1.data, 'Beta', 'blue');
    let d = assignTag(r2.data, ITEM_A, r1.tag.id);
    d = assignTag(d, ITEM_A, r2.tag.id);

    const result = tagsForItem(d, ITEM_A);
    expect(result.map((t: Tag) => t.name)).toEqual(['Alpha', 'Beta']);
  });

  it('returns an empty array when item has no tags', () => {
    const data = emptyData();
    const { data: d } = createTag(data, 'Unused', 'slate');
    expect(tagsForItem(d, ITEM_A)).toHaveLength(0);
  });

  it('does not return tags assigned to a different item', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const d2 = assignTag(d1, ITEM_B, tag.id);
    expect(tagsForItem(d2, ITEM_A)).toHaveLength(0);
  });

  it('handles TodayData with no tags/itemTags fields (back-compat)', () => {
    const data = emptyData();
    expect(tagsForItem(data, ITEM_A)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// deleteTag
// ---------------------------------------------------------------------------

describe('deleteTag', () => {
  it('removes the tag from the registry', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const d2 = deleteTag(d1, tag.id);
    expect(d2.tags).toHaveLength(0);
  });

  it('removes ALL itemTags assignments for that tag', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    let d2 = assignTag(d1, ITEM_A, tag.id);
    d2 = assignTag(d2, ITEM_B, tag.id);
    const d3 = deleteTag(d2, tag.id);
    expect(d3.itemTags).toHaveLength(0);
  });

  it('leaves other tags and their assignments intact', () => {
    let data = emptyData();
    const r1 = createTag(data, 'Alpha', 'rose');
    const r2 = createTag(r1.data, 'Beta', 'green');
    let d = assignTag(r2.data, ITEM_A, r1.tag.id);
    d = assignTag(d, ITEM_A, r2.tag.id);

    const next = deleteTag(d, r1.tag.id);
    expect(next.tags).toHaveLength(1);
    expect(next.tags![0]!.name).toBe('Beta');
    expect(next.itemTags).toHaveLength(1);
    expect(next.itemTags![0]!.tagId).toBe(r2.tag.id);
  });

  it('does NOT mutate the original TodayData', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    const originalTags = d2.tags;
    const originalItemTags = d2.itemTags;
    deleteTag(d2, tag.id);
    expect(d2.tags).toBe(originalTags);
    expect(d2.itemTags).toBe(originalItemTags);
  });

  it('tagsForItem returns empty after the tag is deleted', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'Work', 'blue');
    let d2 = assignTag(d1, ITEM_A, tag.id);
    d2 = deleteTag(d2, tag.id);
    expect(tagsForItem(d2, ITEM_A)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Purity: original TodayData is never mutated
// ---------------------------------------------------------------------------

describe('purity — original TodayData never mutated', () => {
  it('createTag: original tags array is unchanged', () => {
    const data: TodayData = { ...emptyData(), tags: [] };
    const originalArray = data.tags;
    createTag(data, 'X', 'amber');
    expect(data.tags).toBe(originalArray);
    expect(data.tags).toHaveLength(0);
  });

  it('assignTag: original itemTags array is unchanged', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'X', 'amber');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    const snapshot = d2.itemTags!.slice();
    assignTag(d2, ITEM_B, tag.id);
    expect(d2.itemTags).toEqual(snapshot);
  });

  it('unassignTag: original itemTags array is unchanged', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'X', 'amber');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    const snapshot = d2.itemTags!.slice();
    unassignTag(d2, ITEM_A, tag.id);
    expect(d2.itemTags).toEqual(snapshot);
  });

  it('deleteTag: original tags and itemTags arrays are unchanged', () => {
    let data = emptyData();
    const { data: d1, tag } = createTag(data, 'X', 'amber');
    const d2 = assignTag(d1, ITEM_A, tag.id);
    const tagSnapshot = d2.tags!.slice();
    const itemTagSnapshot = d2.itemTags!.slice();
    deleteTag(d2, tag.id);
    expect(d2.tags).toEqual(tagSnapshot);
    expect(d2.itemTags).toEqual(itemTagSnapshot);
  });
});
