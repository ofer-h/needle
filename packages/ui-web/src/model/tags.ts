/* User-created tags. The user-facing categorization (commitmentLevel stays
 * internal — see .cursor docs). Colors are CURATED SEMANTIC-TOKEN KEYS, never
 * raw hex (design-tokens.mdc): a Tag stores a `TagColor` key that resolves to
 * `var(--tag-<key>)` in CSS, light + dark.
 *
 * Tags don't fork the canonical Item — they live as a separate `tags` +
 * `itemTags` slice on TodayData and attach to a row via `tagsForItem`.
 *
 * Promote into @needle/domain once validated. Pure; no React, no I/O. */

import type { ItemId } from './domain';
import type { TodayData } from './today';
import { uid } from './ids';

export type TagId = string & { readonly __brand: 'TagId' };

/** The curated palette. Each maps to `--tag-<key>` / `--tag-<key>-soft` tokens. */
export type TagColor = 'rose' | 'amber' | 'green' | 'blue' | 'violet' | 'slate';

export const TAG_COLORS: readonly TagColor[] = [
  'rose',
  'amber',
  'green',
  'blue',
  'violet',
  'slate',
] as const;

/** Future tag-driven automation (modeled as rules later). Metadata hook now. */
export type TagAutomation = {
  /** e.g. selecting this tag could auto-create a follow-up task. Off by default. */
  onAssign?: 'create_followup';
  followupTitleTemplate?: string;
};

export type Tag = {
  id: TagId;
  name: string;
  color: TagColor;
  automation?: TagAutomation;
};

/** Link between an item and a tag (many-to-many). */
export type ItemTag = {
  itemId: ItemId;
  tagId: TagId;
};

/** The tag slice carried on TodayData (both optional for back-compat). */
export type TagSlice = {
  tags?: Tag[];
  itemTags?: ItemTag[];
};

export function makeTag(name: string, color: TagColor, automation?: TagAutomation): Tag {
  return {
    id: uid('tag') as TagId,
    name: name.trim(),
    color,
    ...(automation ? { automation } : {}),
  };
}

/** All tags currently attached to an item, in registry order. */
export function tagsForItem(data: TodayData, itemId: ItemId): Tag[] {
  const ids = (data.itemTags ?? []).filter((t) => t.itemId === itemId).map((t) => t.tagId);
  const set = new Set(ids);
  return (data.tags ?? []).filter((t) => set.has(t.id));
}

/** Create a tag in the registry. Returns new TodayData + the created tag. */
export function createTag(
  data: TodayData,
  name: string,
  color: TagColor,
): { data: TodayData; tag: Tag } {
  const tag = makeTag(name, color);
  return { data: { ...data, tags: [...(data.tags ?? []), tag] }, tag };
}

/** Attach a tag to an item (idempotent). */
export function assignTag(data: TodayData, itemId: ItemId, tagId: TagId): TodayData {
  const existing = data.itemTags ?? [];
  if (existing.some((t) => t.itemId === itemId && t.tagId === tagId)) return data;
  return { ...data, itemTags: [...existing, { itemId, tagId }] };
}

/** Detach a tag from an item. */
export function unassignTag(data: TodayData, itemId: ItemId, tagId: TagId): TodayData {
  return {
    ...data,
    itemTags: (data.itemTags ?? []).filter((t) => !(t.itemId === itemId && t.tagId === tagId)),
  };
}

/** Delete a tag from the registry and remove all its assignments. */
export function deleteTag(data: TodayData, tagId: TagId): TodayData {
  return {
    ...data,
    tags: (data.tags ?? []).filter((t) => t.id !== tagId),
    itemTags: (data.itemTags ?? []).filter((t) => t.tagId !== tagId),
  };
}
