import { useEffect, useMemo, useState } from 'react';

import {
  DATA_SOURCES_MANIFEST_PATH,
  RUNNING_TRENDS_CSV_PATH,
} from '../constants/chart-groups';

import type {
  RunningDataSource,
  RunningDataSourceManifest,
} from '../utils/types';

type RunningDataSourcesState = {
  error: string | null;
  isLoading: boolean;
  selectedSourceId: string;
  selectedSourcePath: string;
  setSelectedSourceId: (sourceId: string) => void;
  sources: RunningDataSource[];
};

const FALLBACK_SOURCE: RunningDataSource = {
  id: 'running-trends',
  label: 'Running Trends',
  path: RUNNING_TRENDS_CSV_PATH,
};

const isValidSource = (source: unknown): source is RunningDataSource => {
  if (!source || typeof source !== 'object') {
    return false;
  }

  const candidate = source as Partial<RunningDataSource>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.path === 'string'
  );
};

export const useRunningDataSources = (): RunningDataSourcesState => {
  const [sources, setSources] = useState<RunningDataSource[]>([FALLBACK_SOURCE]);
  const [selectedSourceId, setSelectedSourceId] = useState(FALLBACK_SOURCE.id);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    const loadManifest = async (): Promise<void> => {
      setIsLoading(true);

      try {
        const response = await fetch(DATA_SOURCES_MANIFEST_PATH, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load data sources: ${response.status}`);
        }

        const manifest = (await response.json()) as RunningDataSourceManifest;
        const manifestSources = Array.isArray(manifest.sources)
          ? manifest.sources.filter(isValidSource)
          : [];

        if (manifestSources.length === 0) {
          throw new Error('No running data sources found.');
        }

        const defaultSourceId = manifestSources.some(
          (source) => source.id === manifest.defaultSourceId,
        )
          ? manifest.defaultSourceId
          : manifestSources[0].id;

        setSources(manifestSources);
        setSelectedSourceId(defaultSourceId);
        setError(null);
      } catch (loadError) {
        if (abortController.signal.aborted) {
          return;
        }

        setSources([FALLBACK_SOURCE]);
        setSelectedSourceId(FALLBACK_SOURCE.id);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load data sources.',
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadManifest();

    return () => {
      abortController.abort();
    };
  }, []);

  const selectedSourcePath = useMemo(
    () =>
      sources.find((source) => source.id === selectedSourceId)?.path ??
      sources[0]?.path ??
      FALLBACK_SOURCE.path,
    [selectedSourceId, sources],
  );

  return {
    error,
    isLoading,
    selectedSourceId,
    selectedSourcePath,
    setSelectedSourceId,
    sources,
  };
};
