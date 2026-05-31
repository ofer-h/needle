/* Small, pure time helpers. The prototype works in the browser's local zone;
 * canonical timezone fields are carried but not used for conversion here. */

import type { ISODateTime, LocalTime } from './domain';

export function parseLocalTime(t: LocalTime): { h: number; m: number } {
  const [h = '0', m = '0'] = String(t).split(':');
  return { h: Number(h), m: Number(m) };
}

/** Build a Date at `time` on the same calendar day as `day`. */
export function atTimeOnDay(day: Date, time: LocalTime): Date {
  const { h, m } = parseLocalTime(time);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

export function toDate(iso: ISODateTime): Date {
  return new Date(String(iso));
}

export function minutesBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 60000);
}

/** "2:30 PM" */
export function formatClock(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Minutes → "25 min", "1h", "1h 10m". */
export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Minutes → compact countdown, e.g. "25m", "1h 05m", "now". */
export function formatCountdown(mins: number): string {
  if (mins <= 0) return 'now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
