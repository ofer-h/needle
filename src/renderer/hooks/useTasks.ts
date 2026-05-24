import { useCallback, useState } from 'react';
import type { Task, CaptureResult, ClassifiedItem } from '../../shared/types';

export function useTasks() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classify = useCallback(async (rawInput: string): Promise<CaptureResult> => {
    setIsLoading(true);
    setError(null);
    try {
      return await window.api.tasks.classify({ rawInput });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to classify capture';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirm = useCallback(
    async (rawInput: string, items: ClassifiedItem[]): Promise<Task[]> => {
      setIsLoading(true);
      setError(null);
      try {
        return await window.api.tasks.confirm({ rawInput, items });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save tasks';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const listToday = useCallback(async (): Promise<Task[]> => {
    setError(null);
    try {
      return await window.api.tasks.list({ scope: 'today' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
      throw err;
    }
  }, []);

  const setDone = useCallback(async (id: string, done: boolean): Promise<void> => {
    setError(null);
    try {
      await window.api.tasks.setDone({ id, done });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      setError(message);
      throw err;
    }
  }, []);

  return { classify, confirm, listToday, setDone, isLoading, error };
}
