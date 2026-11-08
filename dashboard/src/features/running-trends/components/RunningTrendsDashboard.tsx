import { Empty, Select, Spin } from '@douyinfe/semi-ui';

import { t } from '@/shared/i18n';

import { useRunningDataSources } from '../hooks/use-running-data-sources';
import { useRunningTrends } from '../hooks/use-running-trends';

import { RunningGroupSection } from './RunningGroupSection';

export const RunningTrendsDashboard = () => {
  const {
    error: sourcesError,
    isLoading: areSourcesLoading,
    selectedSourceId,
    selectedSourcePath,
    setSelectedSourceId,
    sources,
  } = useRunningDataSources();
  const { data, error, isLoading } = useRunningTrends(selectedSourcePath);

  if (areSourcesLoading || isLoading) {
    return (
      <div className="state-panel">
        <Spin size="large" />
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="state-panel">
        <Empty description={t(error)} title={t('Unable to load running data')} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="state-panel">
        <Empty description={t('No grouped running records found.')} />
      </div>
    );
  }

  return (
    <div className="dashboard-stack">
      <div className="data-source-toolbar">
        <div>
          <label className="toolbar-label" htmlFor="running-data-source-select">
            {t('Data source')}
          </label>
          {sourcesError && <span className="toolbar-warning">{t(sourcesError)}</span>}
        </div>
        <Select
          aria-label={t('Select running data source')}
          className="data-source-select"
          id="running-data-source-select"
          onChange={(value) => setSelectedSourceId(String(value))}
          optionList={sources.map((source) => ({
            label:
              source.rowCount === undefined
                ? source.label
                : `${source.label} · ${source.rowCount} rows`,
            value: source.id,
          }))}
          value={selectedSourceId}
        />
      </div>
      {data.map((summary) => (
        <RunningGroupSection key={summary.chartId} summary={summary} />
      ))}
    </div>
  );
};
