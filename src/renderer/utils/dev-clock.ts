import { create } from 'zustand';
import { toISODate } from './date';
import type { ISODateTime } from '../../shared/domain-v2';

type DevClockState = {
  frozenIso: ISODateTime | null;
  setFrozen: (iso: ISODateTime | null) => void;
  jumpToTime: (hhmm: string) => void;
};

export const useDevClock = create<DevClockState>((set) => ({
  frozenIso: null,
  setFrozen: (iso) => set({ frozenIso: iso }),
  jumpToTime: (hhmm) => {
    const today = toISODate();
    const iso = `${today}T${hhmm}:00.000Z` as ISODateTime;
    set({ frozenIso: iso });
  },
}));

export function nowIso(): ISODateTime {
  const frozen = useDevClock.getState().frozenIso;
  if (frozen !== null) return frozen;
  return new Date().toISOString() as ISODateTime;
}

export function nowIsoFromState(frozenIso: ISODateTime | null): ISODateTime {
  if (frozenIso !== null) return frozenIso;
  return new Date().toISOString() as ISODateTime;
}
