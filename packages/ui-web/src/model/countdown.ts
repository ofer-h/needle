/* Countdown to the next hard stop + the novelty-rotation alert kit.
 *
 * The ADHD brain habituates to a static badge, so the alert STYLE rotates
 * (color / motion / scale / sound / surface) as the deadline nears. All pure;
 * the rotation is deterministic given a seed so it's testable and demoable. */

import type { CommitmentLevel, ItemId, TodayItemView } from './domain';
import type { AccentName } from './template';
import { minutesBetween, toDate } from './time';

export type HardStop = {
  itemId: ItemId;
  title: string;
  /** When the thing actually starts. */
  at: Date;
  commitmentLevel: CommitmentLevel;
  /** Optional travel/prep buffer; the *effective* deadline is `at - leaveBy`. */
  leaveByMinutes?: number;
};

export type Urgency = 'calm' | 'soon' | 'imminent' | 'now';

export type AlertMotion = 'none' | 'pulse' | 'breathe' | 'shake';
export type AlertSound = 'none' | 'chime' | 'ping' | 'bell';
export type AlertSurface = 'inline' | 'banner' | 'takeover';

/** A single visual/auditory treatment. Maps loosely onto the canonical
 * InterventionStrategy / InterventionSurface / InterventionIntensity. */
export type AlertStyle = {
  id: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  color: AccentName;
  motion: AlertMotion;
  scale: number;
  sound: AlertSound;
  surface: AlertSurface;
};

/** A deliberately varied pool so consecutive nudges never look the same. */
export const alertStylePool: AlertStyle[] = [
  { id: 'calm-blue', intensity: 1, color: 'remember', motion: 'none', scale: 1, sound: 'none', surface: 'inline' },
  { id: 'calm-green', intensity: 1, color: 'upcoming', motion: 'breathe', scale: 1, sound: 'none', surface: 'inline' },
  { id: 'soon-gold', intensity: 2, color: 'accent', motion: 'breathe', scale: 1.05, sound: 'none', surface: 'inline' },
  { id: 'soon-amber', intensity: 3, color: 'accent', motion: 'pulse', scale: 1.08, sound: 'chime', surface: 'banner' },
  { id: 'near-orange', intensity: 4, color: 'urgent', motion: 'pulse', scale: 1.12, sound: 'ping', surface: 'banner' },
  { id: 'now-red', intensity: 5, color: 'urgent', motion: 'shake', scale: 1.18, sound: 'bell', surface: 'takeover' },
];

export type CountdownState = {
  hardStop: HardStop;
  /** Minutes until the effective deadline (`at - leaveBy`); may be negative. */
  minutesRemaining: number;
  urgency: Urgency;
  alert: AlertStyle;
};

const URGENCY_FLOOR: Record<Urgency, number> = { calm: 1, soon: 2, imminent: 4, now: 5 };

export function urgencyFor(minutesRemaining: number): Urgency {
  if (minutesRemaining <= 0) return 'now';
  if (minutesRemaining <= 15) return 'imminent';
  if (minutesRemaining <= 30) return 'soon';
  return 'calm';
}

/** Pick a style for an urgency, rotating among eligible styles by `seed` so the
 * treatment changes each time it fires (anti-habituation). */
export function rotateAlertStyle(urgency: Urgency, seed: number): AlertStyle {
  const floor = URGENCY_FLOOR[urgency];
  const eligible = alertStylePool.filter((s) => s.intensity >= floor);
  const pool = eligible.length > 0 ? eligible : alertStylePool;
  const idx = ((seed % pool.length) + pool.length) % pool.length;
  return pool[idx] as AlertStyle;
}

/** Derive the live countdown for a hard stop. `seed` advances the rotation. */
export function deriveCountdown(hardStop: HardStop, now: Date, seed = 0): CountdownState {
  const deadline = new Date(hardStop.at);
  if (hardStop.leaveByMinutes) deadline.setMinutes(deadline.getMinutes() - hardStop.leaveByMinutes);
  const minutesRemaining = minutesBetween(now, deadline);
  const urgency = urgencyFor(minutesRemaining);
  return { hardStop, minutesRemaining, urgency, alert: rotateAlertStyle(urgency, seed) };
}

/** Extract hard stops from today's views: fixed events plus firm/unmissable
 * commitments that have a start instant. Sorted ascending by start. */
export function deriveHardStops(views: TodayItemView[]): HardStop[] {
  const stops: HardStop[] = [];
  for (const v of views) {
    const isCommitted = v.item.commitmentLevel === 'firm' || v.item.commitmentLevel === 'unmissable';
    if (v.occurrence && (v.item.kind === 'event' || isCommitted)) {
      stops.push({
        itemId: v.item.id,
        title: v.item.title,
        at: toDate(v.occurrence.startsAt),
        commitmentLevel: v.item.commitmentLevel,
        ...(v.plan?.relativeTo ? { leaveByMinutes: Math.abs(v.plan.relativeTo.offsetMinutes) } : {}),
      });
    }
  }
  return stops.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** The next hard stop strictly after `now`, or null. */
export function nextHardStop(views: TodayItemView[], now: Date): HardStop | null {
  return deriveHardStops(views).find((s) => s.at.getTime() > now.getTime()) ?? null;
}
