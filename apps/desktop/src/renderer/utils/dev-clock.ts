import { create } from 'zustand';
import type { ISODateTime } from '@needle/domain/domain-v2';

type DevClockState = {
  frozenIso: ISODateTime | null;
  setFrozen: (iso: ISODateTime | null) => void;
  jumpToTime: (hhmm: string) => void;
};

// Build an ISO timestamp for `hh:mm` as LOCAL wall-clock time today. SQLite
// occurrences are local wall-clock (the board shows "3:00 PM"), so the dev
// clock must match — otherwise a UTC "15:00" lands at the wrong instant and the
// transition engine never sees the meeting window.
function localIsoForToday(hhmm: string): ISODateTime {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toISOString() as ISODateTime;
}

// Default the dev clock to inside the 3pm-meeting transition window so the
// unified overlay is visible on launch in dev. Use the presets to step around.
const INITIAL_FROZEN_ISO = localIsoForToday('14:54');

export const useDevClock = create<DevClockState>((set) => ({
  frozenIso: INITIAL_FROZEN_ISO,
  setFrozen: (iso) => set({ frozenIso: iso }),
  jumpToTime: (hhmm) => {
    set({ frozenIso: localIsoForToday(hhmm) });
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
