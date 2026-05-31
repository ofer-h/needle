import { useCallback, useEffect, useState } from 'react';

export type ScenarioClock = {
  now: Date;
  live: boolean;
  jump: (minutes: number) => void;
  reset: () => void;
  toggleLive: () => void;
};

/** Today at 09:00 — a deterministic demo start so the seeded 10:30 standup and
 * 14:00 pickup are always upcoming hard stops to count down to. */
function demoStart(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

/** A controllable "now" for the demo. Jump forward in 5/15/60-minute steps to
 * watch the countdown escalate and the alert style rotate; toggle live to let
 * it tick real seconds. Lifted to App so the board, countdown, and coach all
 * share one clock. */
export function useScenarioClock(): ScenarioClock {
  const [now, setNow] = useState(demoStart);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow((n) => new Date(n.getTime() + 1000)), 1000);
    return () => clearInterval(id);
  }, [live]);

  const jump = useCallback((minutes: number) => {
    setNow((n) => new Date(n.getTime() + minutes * 60000));
  }, []);

  const reset = useCallback(() => setNow(demoStart()), []);
  const toggleLive = useCallback(() => setLive((v) => !v), []);

  return { now, live, jump, reset, toggleLive };
}
