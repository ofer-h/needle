/* Notification config — how far ahead of a hard stop to nudge, quiet hours,
 * which alert styles are in rotation, sound, and brain-dump help. Mirrors the
 * canonical NotificationPreference; promote once validated. */

import { alertStylePool } from './countdown';

export type NotificationConfig = {
  /** Minutes before a hard stop to fire a nudge, e.g. [15, 5, 1]. */
  leadMinutes: number[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
  sound: boolean;
  /** Which alertStylePool ids are eligible for rotation. */
  rotatingStyleIds: string[];
  brainDumpHelp: boolean;
};

export const defaultNotificationConfig: NotificationConfig = {
  leadMinutes: [15, 5, 1],
  sound: true,
  rotatingStyleIds: alertStylePool.map((s) => s.id),
  brainDumpHelp: true,
};

/** Is `now` within configured quiet hours? Handles overnight ranges. */
export function inQuietHours(config: NotificationConfig, now: Date): boolean {
  if (!config.quietHoursStart || !config.quietHoursEnd) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const [sh = 0, sm = 0] = config.quietHoursStart.split(':').map(Number);
  const [eh = 0, em = 0] = config.quietHoursEnd.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return start <= end ? mins >= start && mins < end : mins >= start || mins < end;
}
