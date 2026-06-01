/* Branding + id helpers for the prototype. The canonical model brands every id
 * (WorkspaceId, ItemId, …); these helpers let mock/seed data and factories
 * mint branded values without ceremony. */

/** Cast a plain string to a branded id type. */
export function brand<T>(value: string): T {
  return value as unknown as T;
}

let counter = 0;

/** Monotonic, prefix-tagged id for seed/runtime objects (deterministic order). */
export function uid<T = string>(prefix = 'id'): T {
  counter += 1;
  return brand<T>(`${prefix}-${counter.toString(36).padStart(4, '0')}`);
}

/** Reset the id counter — used by tests for determinism. */
export function resetIds(): void {
  counter = 0;
}

/** Advance the counter past every id already present in `ids`, so future
 * `uid()` calls can't collide with them. The counter is per-process and resets
 * to 0 on reload, so after loading persisted data (whose ids were minted in a
 * previous session) this MUST be called — otherwise a freshly minted id can
 * duplicate an existing one. Ids not matching the `prefix-<base36>` shape are
 * ignored. */
export function reserveIds(ids: Iterable<string>): void {
  for (const id of ids) {
    const match = /-([0-9a-z]+)$/.exec(id);
    if (!match) continue;
    const value = parseInt(match[1] as string, 36);
    if (Number.isFinite(value) && value > counter) counter = value;
  }
}
