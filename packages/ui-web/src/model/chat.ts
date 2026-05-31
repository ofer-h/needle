/* Scripted AI chat. Deterministic intent parsing (no real LLM this round) that
 * mutates the board and returns a revertible Revision. Every assistant turn that
 * changes data references the revision it created, so the UI can show "↩ undo". */

import { mkItem, mkPlan } from './factory';
import { uid } from './ids';
import type { Item } from './domain';
import type { TodayData } from './today';
import type { Revision } from './revision';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  at: number;
  /** Set on assistant turns that produced a revertible change. */
  revisionId?: string;
};

export type ChatResult = {
  reply: string;
  data: TodayData;
  /** Present when the turn changed data. */
  revision?: Omit<Revision, 'id' | 'at' | 'undone'>;
};

const clone = (data: TodayData): TodayData => structuredClone(data);

const RE_REMEMBER = /^(remember|note)\s*:?\s*(.+)/i;
const RE_ADD = /^(add|remind me to|new task|todo)\s*:?\s*(.+)/i;
const RE_TICKET = /(?:set\s+)?ticket\s*(?:id)?\s*(?:to|=|:)?\s*([a-z]+-\d+)/i;
const RE_DONE = /^(done|complete|finish)\s*:?\s*(.+)/i;

const findItemByText = (items: Item[], q: string): Item | undefined => {
  const needle = q.trim().toLowerCase();
  return items.find((i) => i.title.toLowerCase().includes(needle));
};

/** Apply a user message to the board. Pure: returns new data + reply (+ maybe a
 * revision payload to log). */
export function applyChat(data: TodayData, text: string): ChatResult {
  const before = clone(data);
  const input = text.trim();

  const remember = input.match(RE_REMEMBER);
  if (remember) {
    const title = remember[2]!.trim();
    const next = clone(data);
    next.items.push(mkItem({ title, kind: 'note', bucket: 'remember' }));
    return {
      reply: `Filed that to remember: “${title}”.`,
      data: next,
      revision: { actor: 'ai', summary: `Remembered “${title}”`, before, after: clone(next) },
    };
  }

  const add = input.match(RE_ADD);
  if (add) {
    const title = add[2]!.trim();
    const next = clone(data);
    const item = mkItem({ title, kind: 'task' });
    next.items.push(item);
    next.plans.push(mkPlan(item.id, { mode: 'float' }));
    return {
      reply: `Added “${title}” to today.`,
      data: next,
      revision: { actor: 'ai', summary: `Added task “${title}”`, before, after: clone(next) },
    };
  }

  const ticket = input.match(RE_TICKET);
  if (ticket) {
    const ticketId = ticket[1]!;
    const next = clone(data);
    const target = next.items.find((i) => i.status !== 'done' && i.kind === 'task');
    if (target) {
      const oldTitle = target.title;
      target.title = `${target.title} ${ticketId}`;
      return {
        reply: `Linked ${ticketId} to “${oldTitle}”. (If that's the wrong one, undo and tell me which.)`,
        data: next,
        revision: { actor: 'ai', summary: `Set ticket ${ticketId} on “${oldTitle}”`, before, after: clone(next) },
      };
    }
  }

  const done = input.match(RE_DONE);
  if (done) {
    const next = clone(data);
    const target = findItemByText(next.items, done[2]!);
    if (target) {
      target.status = 'done';
      return {
        reply: `Marked “${target.title}” done. Nice.`,
        data: next,
        revision: { actor: 'ai', summary: `Completed “${target.title}”`, before, after: clone(next) },
      };
    }
  }

  // Fallback: treat the whole message as a new task.
  const title = input;
  const next = clone(data);
  const item = mkItem({ title, kind: 'task' });
  next.items.push(item);
  next.plans.push(mkPlan(item.id, { mode: 'float' }));
  return {
    reply: `Added “${title}”. Say “remember …” to file something instead.`,
    data: next,
    revision: { actor: 'ai', summary: `Added task “${title}”`, before, after: clone(next) },
  };
}

export function userMessage(text: string): ChatMessage {
  return { id: uid('msg'), role: 'user', text, at: Date.now() };
}

export function assistantMessage(text: string, revisionId?: string): ChatMessage {
  return { id: uid('msg'), role: 'assistant', text, at: Date.now(), ...(revisionId ? { revisionId } : {}) };
}
