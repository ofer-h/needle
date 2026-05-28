import { useCallback, useEffect, useRef, useState } from 'react';

export type PendingOperationStatus = 'idle' | 'pending' | 'success' | 'error';

export type RunPendingOptions = {
  /** Max wait before failing with a timeout message (default 30s). */
  timeoutMs?: number;
};

export type PendingRunResult<T> =
  | { outcome: 'success'; value: T }
  | { outcome: 'error'; message: string }
  | { outcome: 'cancelled' };

export type PendingOperationState<T> = {
  status: PendingOperationStatus;
  error: string | null;
  data: T | null;
  elapsedMs: number;
  isSlow: boolean;
  run: (fn: () => Promise<T>, options?: RunPendingOptions) => Promise<PendingRunResult<T>>;
  cancel: () => void;
  reset: () => void;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const SLOW_THRESHOLD_MS = 3_000;
const TICK_MS = 200;

function toErrorMessage(err: unknown, timeoutMs: number): string {
  if (err instanceof Error && err.message === 'operation_timeout') {
    return `Timed out after ${Math.round(timeoutMs / 1000)}s — nothing came back. Check network or try again.`;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

/**
 * Finite-state helper for user-triggered async work (IPC, fetch).
 * Guarantees exit from `pending`: success, error, cancel, or timeout.
 * Ignores late results after cancel or a newer run.
 */
export function usePendingOperation<T>(): PendingOperationState<T> {
  const [status, setStatus] = useState<PendingOperationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const generationRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    generationRef.current += 1;
    clearTick();
    setStatus('idle');
    setError(null);
    setData(null);
    setElapsedMs(0);
  }, [clearTick]);

  const cancel = useCallback(() => {
    generationRef.current += 1;
    clearTick();
    setStatus('idle');
    setError(null);
    setData(null);
    setElapsedMs(0);
  }, [clearTick]);

  useEffect(() => () => clearTick(), [clearTick]);

  const run = useCallback(
    async (fn: () => Promise<T>, options?: RunPendingOptions): Promise<PendingRunResult<T>> => {
      const gen = ++generationRef.current;
      const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

      clearTick();
      setStatus('pending');
      setError(null);
      setData(null);
      setElapsedMs(0);
      startedAtRef.current = performance.now();

      tickRef.current = setInterval(() => {
        if (generationRef.current !== gen) return;
        setElapsedMs(performance.now() - startedAtRef.current);
      }, TICK_MS);

      try {
        const result = await Promise.race([
          fn(),
          new Promise<never>((_resolve, reject) => {
            setTimeout(() => reject(new Error('operation_timeout')), timeoutMs);
          }),
        ]);

        if (generationRef.current !== gen) {
          return { outcome: 'cancelled' };
        }

        setData(result);
        setStatus('success');
        return { outcome: 'success', value: result };
      } catch (err) {
        if (generationRef.current !== gen) {
          return { outcome: 'cancelled' };
        }
        const message = toErrorMessage(err, timeoutMs);
        setError(message);
        setStatus('error');
        return { outcome: 'error', message };
      } finally {
        clearTick();
        if (generationRef.current === gen) {
          setElapsedMs(performance.now() - startedAtRef.current);
        }
      }
    },
    [clearTick],
  );

  return {
    status,
    error,
    data,
    elapsedMs,
    isSlow: status === 'pending' && elapsedMs >= SLOW_THRESHOLD_MS,
    run,
    cancel,
    reset,
  };
}

export const PENDING_SLOW_THRESHOLD_MS = SLOW_THRESHOLD_MS;
export const PENDING_DEFAULT_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;
