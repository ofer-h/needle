/* The coach/manager engine — the place that decides what to push the user next.
 * Given today's view + adherence signals + the chosen accountability mode, it
 * emits ranked, tone-matched nudges. Pure; no scheduling/side effects here.
 *
 * CoachNudge is Suggestion-shaped (reuses canonical SuggestionKind) so it can be
 * promoted to a real Suggestion once a backend exists. */

import { uid } from './ids';
import type { ItemId, SuggestionKind, TodayItemView } from './domain';
import { nextHardStop } from './countdown';

export type AccountabilityMode = 'gamified' | 'coached' | 'self';
export type NudgeTone = 'supportive' | 'firm' | 'playful';

export type CoachNudge = {
  id: string;
  kind: SuggestionKind;
  title: string;
  rationale?: string;
  itemId?: ItemId;
  tone: NudgeTone;
  mode: AccountabilityMode;
  /** Higher = more important; the panel sorts by this. */
  weight: number;
};

export type Adherence = {
  ritualsCompleted: number;
  missedHardStops: number;
};

const TONE_BY_MODE: Record<AccountabilityMode, NudgeTone> = {
  gamified: 'playful',
  coached: 'firm',
  self: 'supportive',
};

/** Mode-flavored microcopy for the same underlying signal. */
function phrase(mode: AccountabilityMode, variants: Record<AccountabilityMode, string>): string {
  return variants[mode];
}

export function coachEngine(
  views: TodayItemView[],
  adherence: Adherence,
  mode: AccountabilityMode,
  now: Date = new Date(),
): CoachNudge[] {
  const tone = TONE_BY_MODE[mode];
  const nudges: CoachNudge[] = [];
  const mk = (n: Omit<CoachNudge, 'id' | 'mode' | 'tone'>): CoachNudge => ({
    id: uid('nudge'),
    mode,
    tone,
    ...n,
  });

  const open = views.filter((v) => v.item.status !== 'done' && v.item.kind === 'task');
  const overdue = views.filter((v) => v.isOverdue && v.item.status !== 'done');
  const doneCount = views.filter((v) => v.item.status === 'done').length;
  const total = views.filter((v) => v.item.kind === 'task').length;

  // 1. Imminent hard stop → wrap-up nudge.
  const stop = nextHardStop(views, now);
  if (stop) {
    const mins = Math.round((stop.at.getTime() - now.getTime()) / 60000);
    if (mins <= 20) {
      nudges.push(
        mk({
          kind: 'nudge',
          itemId: stop.itemId,
          title: phrase(mode, {
            gamified: `⏱ ${mins}m to “${stop.title}” — beat the buzzer, wrap up now!`,
            coached: `${stop.title} starts in ${mins} min. Start closing down what you're on.`,
            self: `Heads up — ${stop.title} in ${mins} min. Find a stopping point.`,
          }),
          rationale: 'Approaching a hard stop',
          weight: 100 - mins,
        }),
      );
    }
  }

  // 2. Overdue items → reschedule.
  if (overdue.length > 0) {
    const first = overdue[0]!;
    nudges.push(
      mk({
        kind: 'reschedule',
        itemId: first.item.id,
        title: phrase(mode, {
          gamified: `${overdue.length} overdue — clear them to keep your streak alive.`,
          coached: `${overdue.length} item${overdue.length > 1 ? 's' : ''} slipped past. Reschedule or drop?`,
          self: `A few things drifted (${overdue.length}). Want to move them to tomorrow?`,
        }),
        rationale: 'Overdue work piling up',
        weight: 70,
      }),
    );
  }

  // 3. Overload → reduce scope.
  if (open.length >= 6) {
    nudges.push(
      mk({
        kind: 'reduce_scope',
        title: phrase(mode, {
          gamified: `${open.length} quests queued — pick your top 3 to actually win today.`,
          coached: `${open.length} open tasks is a lot. Choose the 3 that matter; stash the rest.`,
          self: `That's ${open.length} things. Be kind — what are the 3 that truly need you?`,
        }),
        rationale: 'Too many open items',
        weight: 50,
      }),
    );
  }

  // 4. Progress milestone → celebrate / reflect.
  if (total > 0 && doneCount > 0 && doneCount >= Math.ceil(total / 2)) {
    nudges.push(
      mk({
        kind: 'reflect',
        title: phrase(mode, {
          gamified: `🔥 ${doneCount}/${total} done — over halfway. Big day forming.`,
          coached: `${doneCount} of ${total} done. Solid. Keep the momentum.`,
          self: `You've cleared ${doneCount} of ${total}. That's real progress — notice it.`,
        }),
        rationale: 'Past the halfway mark',
        weight: 30,
      }),
    );
  }

  // 5. Missed hard stops earlier → gentle accountability.
  if (adherence.missedHardStops > 0) {
    nudges.push(
      mk({
        kind: 'reflect',
        title: phrase(mode, {
          gamified: `${adherence.missedHardStops} buzzer${adherence.missedHardStops > 1 ? 's' : ''} missed today — let's catch the next one.`,
          coached: `${adherence.missedHardStops} hard stop${adherence.missedHardStops > 1 ? 's' : ''} blew past. Tighten the lead time?`,
          self: `${adherence.missedHardStops} got away from you. No shame — adjust the warning window?`,
        }),
        rationale: 'Missed transitions',
        weight: 20,
      }),
    );
  }

  return nudges.sort((a, b) => b.weight - a.weight);
}
