/* Append-only revision log. Every mutation (especially AI-made ones) records a
 * before/after snapshot so any change is one-click revertible — the prototype's
 * stand-in for the canonical ActivityLog.before/after contract. */

import { uid } from './ids';
import type { TodayData } from './today';

export type RevisionActor = 'you' | 'ai';

export type Revision = {
  id: string;
  at: number;
  actor: RevisionActor;
  summary: string;
  /** Snapshot to restore on undo. */
  before: TodayData;
  /** Snapshot produced by the change (for redo / inspection). */
  after: TodayData;
  undone?: boolean;
};

export class RevisionLog {
  private revisions: Revision[] = [];

  /** Record a change. Returns the created revision. */
  push(input: { actor: RevisionActor; summary: string; before: TodayData; after: TodayData }): Revision {
    const rev: Revision = { id: uid('rev'), at: Date.now(), ...input };
    this.revisions.push(rev);
    return rev;
  }

  /** Newest first. */
  all(): Revision[] {
    return [...this.revisions].reverse();
  }

  get(id: string): Revision | undefined {
    return this.revisions.find((r) => r.id === id);
  }

  /** Mark a revision undone and return its `before` snapshot to restore, or
   * null if not found / already undone. */
  undo(id: string): TodayData | null {
    const rev = this.revisions.find((r) => r.id === id);
    if (!rev || rev.undone) return null;
    rev.undone = true;
    return rev.before;
  }
}
