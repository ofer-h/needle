import { create } from 'zustand';
import { toISODate } from './date';
import type { ISODateTime } from '@needle/domain/domain-v2';

type DevClockState = {
  frozenIso: ISODateTime | null;
  setFrozen: (iso: ISODateTime | null) => void;
  jumpToTime: (hhmm: string) => void;
};

const TODAY = toISODate();
// Default the dev clock to before any seeded intervention so the slice starts
// in a clean state. Interventions only fire when the user advances the clock.
const INITIAL_FROZEN_ISO = `${TODAY}T14:54:00.000Z` as ISODateTime;

export const useDevClock = create<DevClockState>((set) => ({
  frozenIso: INITIAL_FROZEN_ISO,
  setFrozen: (iso) => set({ frozenIso: iso }),
  jumpToTime: (hhmm) => {
    const iso = `${TODAY}T${hhmm}:00.000Z` as ISODateTime;
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
