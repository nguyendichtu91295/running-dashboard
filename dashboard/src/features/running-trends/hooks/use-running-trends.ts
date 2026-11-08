import { useEffect, useState } from 'react';

import { parseCsv } from '../utils/csv';

import type { RawRunRecord } from '../utils/types';

type RunningTrendsState = {
  data: RawRunRecord[];
  error: string | null;
  isLoading: boolean;
};

export const useRunningTrends = (csvPath: string): RunningTrendsState => {
  const [state, setState] = useState<RunningTrendsState>({
    data: [],
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    const abortController = new AbortController();

    const loadCsv = async (): Promise<void> => {
      setState((current) => ({ ...current, isLoading: true }));

      try {
        const response = await fetch(csvPath, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.status}`);
        }

        const csvText = await response.text();
        const records = parseCsv(csvText);

        setState({
          data: records,
          error: null,
          isLoading: false,
        });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setState({
          data: [],
          error: error instanceof Error ? error.message : 'Failed to load CSV',
          isLoading: false,
        });
      }
    };

    void loadCsv();

    return () => {
      abortController.abort();
    };
  }, [csvPath]);

  return state;
};
