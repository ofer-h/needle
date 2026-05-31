import { createContext, useContext } from 'react';
import type { ItemId } from '../model';
import type { TodayData } from '../model';
import type { Template } from '../model';

/** Mutation handlers a board row can call. Implementations live in TodayBoard,
 * which threads them to onChange so the host owns the data. */
export type BoardHandlers = {
  toggleDone: (itemId: ItemId) => void;
  setTitle: (itemId: ItemId, title: string) => void;
  addChild: (parentId: ItemId, title: string) => void;
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
