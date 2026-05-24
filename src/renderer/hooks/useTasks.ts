import { useCallback, useState } from 'react';
import type { Task, CaptureResult } from '../../shared/types';

type CreateResponse = {
  task: Task;
  result: CaptureResult;
};

export function useTasks() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (rawInput: string): Promise<CreateResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      return await window.api.tasks.create({ rawInput });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  return { create, listToday, setDone, isLoading, error };
}
