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
