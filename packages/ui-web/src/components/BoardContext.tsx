import { createContext, useContext } from 'react';
import type { ItemId } from '../model';
import type { TodayData } from '../model';
import type { Template } from '../model';
import type { DayTarget } from '../model';
import type { TagColor } from '../model';

/** Mutation handlers a board row can call. Implementations live in TodayBoard,
 * which threads them to onChange so the host owns the data. The first three are
 * required; the rest are optional so hosts adopt them incrementally (rows guard
 * with `?.`). */
export type BoardHandlers = {
  toggleDone: (itemId: ItemId) => void;
  setTitle: (itemId: ItemId, title: string) => void;
  addChild: (parentId: ItemId, title: string) => void;
  /** Delete an item (and its children). */
  removeItem?: (itemId: ItemId) => void;
  /** Re-target to today / tomorrow / a date / someday. */
  moveTo?: (itemId: ItemId, target: DayTarget) => void;
  /** Tag assignment. createAndAssignTag mints a new tag and attaches it. */
  assignTag?: (itemId: ItemId, tagId: string) => void;
  unassignTag?: (itemId: ItemId, tagId: string) => void;
  createAndAssignTag?: (itemId: ItemId, name: string, color: TagColor) => void;
};

export type BoardContextValue = {
  data: TodayData;
  now: Date;
  template: Template;
  handlers: BoardHandlers;
};

const BoardContext = createContext<BoardContextValue | null>(null);

export const BoardProvider = BoardContext.Provider;

export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoard must be used within a <TodayBoard>');
  return ctx;
}
