import { useEffect, useState } from 'react';
import { parseWorkouts } from '../utils/workouts-api';
import type { RawRunRecord } from '../utils/types';

type RunningTrendsState = { data: RawRunRecord[]; error: string | null; isLoading: boolean; hasLoaded: boolean };

export const useRunningTrends = () => {
  const [state, setState] = useState<RunningTrendsState>({ data: [], error: null, isLoading: true, hasLoaded: false });
  const [request, setRequest] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState((current) => ({ ...current, isLoading: true, error: null }));
    const load = async () => {
      try {
        const response = await fetch('/api/workouts', { signal: controller.signal });
        if (!response.ok) throw new Error(`Failed to load workouts: ${response.status}`);
        const records = parseWorkouts(await response.json());
        if (active) setState({ data: records, error: null, isLoading: false, hasLoaded: true });
      } catch (error) {
        if (active && !controller.signal.aborted) setState((current) => ({ ...current, error: error instanceof Error ? error.message : 'Failed to load workouts', isLoading: false }));
      }
    };
    void load();
    return () => { active = false; controller.abort(); };
  }, [request]);
  return { ...state, refresh: () => setRequest((current) => current + 1) };
};
