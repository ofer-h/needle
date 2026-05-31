/* Factories that mint canonical @needle/domain entities with sensible defaults,
 * so mock/seed data stays concise while remaining genuinely canonical (every
 * workspaceId / actorId / timestamp is populated). */

import { brand, uid } from './ids';
import type {
  ActorId,
  ISODate,
  ISODateTime,
  Item,
  ItemId,
  ItemKind,
  ItemOccurrence,
  ItemOccurrenceId,
  ItemPlan,
  ItemPlanId,
  ItemRelation,
  ItemRelationId,
  ItemRelationType,
  LocalTime,
  TimeZone,
  WorkspaceId,
} from './domain';

export const DEMO_WORKSPACE = brand<WorkspaceId>('ws-demo');
export const YOU = brand<ActorId>('actor-you');
export const AI = brand<ActorId>('actor-ai');
export const DEMO_TZ = brand<TimeZone>('America/New_York');

export const isoNow = (): ISODateTime => brand<ISODateTime>(new Date().toISOString());
export const isoDate = (d: Date): ISODate => brand<ISODate>(d.toISOString().slice(0, 10));
export const localTime = (hhmm: string): LocalTime => brand<LocalTime>(hhmm);

type Stamped = { createdAt: ISODateTime; updatedAt: ISODateTime };
const stamp = (): Stamped => {
  const now = isoNow();
  return { createdAt: now, updatedAt: now };
};

export function mkItem(input: Partial<Item> & { title: string; kind: ItemKind }): Item {
  return {
    id: uid<ItemId>('item'),
    workspaceId: DEMO_WORKSPACE,
    bucket: 'act',
    status: 'open',
    visibility: 'private',
    commitmentLevel: 'soft',
    createdByActorId: YOU,
    updatedByActorId: YOU,
    ...stamp(),
    ...input,
  };
}

export function mkPlan(itemId: ItemId, input: Partial<ItemPlan> = {}): ItemPlan {
  return {
    id: uid<ItemPlanId>('plan'),
    workspaceId: DEMO_WORKSPACE,
    itemId,
    actorId: YOU,
    mode: 'float',
    timezone: DEMO_TZ,
    ...stamp(),
    ...input,
  };
}

export function mkOccurrence(
  itemId: ItemId,
  startsAt: ISODateTime,
  endsAt: ISODateTime,
  input: Partial<ItemOccurrence> = {},
): ItemOccurrence {
  return {
    id: uid<ItemOccurrenceId>('occ'),
    workspaceId: DEMO_WORKSPACE,
    itemId,
    startsAt,
    endsAt,
    timezone: DEMO_TZ,
    status: 'confirmed',
    ...stamp(),
    ...input,
  };
}

export function mkRelation(
  fromItemId: ItemId,
  toItemId: ItemId,
  relationType: ItemRelationType,
  sortOrder = 0,
): ItemRelation {
  return {
    id: uid<ItemRelationId>('rel'),
    workspaceId: DEMO_WORKSPACE,
    fromItemId,
    toItemId,
    relationType,
    sortOrder,
    createdByActorId: YOU,
    createdAt: isoNow(),
  };
}
