import { useMemo, useState } from 'react';

import { Empty, Select, Spin } from '@douyinfe/semi-ui';

import { t } from '@/shared/i18n';

import { useRunningDataSources } from '../hooks/use-running-data-sources';
import { useRunningTrends } from '../hooks/use-running-trends';
import { buildChartSummaries, defaultDateRange, filterRecordsByDate, isValidDateKey } from '../utils/running-data';

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
  const { data: records, error, isLoading } = useRunningTrends(selectedSourcePath);
  const [range, setRange] = useState(defaultDateRange);
  const rangeError = !isValidDateKey(range.start) || !isValidDateKey(range.end)
    ? 'Enter valid start and end dates.'
    : range.start > range.end ? 'Start date must be on or before end date.' : null;
  const data = useMemo(() => rangeError ? [] : buildChartSummaries(filterRecordsByDate(records, range.start, range.end)), [records, range.start, range.end, rangeError]);
  const populatedGroups = data.filter((summary) => summary.points.length > 0);

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
      <div className="date-range-toolbar" role="group" aria-label={t('Date range')}>
        <label>{t('Start date')}
          <input type="date" value={range.start} aria-invalid={Boolean(rangeError)} aria-describedby={rangeError ? 'date-range-error' : undefined} onChange={(event) => setRange((current) => ({ ...current, start: event.target.value }))} />
        </label>
        <label>{t('End date')}
          <input type="date" value={range.end} aria-invalid={Boolean(rangeError)} aria-describedby={rangeError ? 'date-range-error' : undefined} onChange={(event) => setRange((current) => ({ ...current, end: event.target.value }))} />
        </label>
        {rangeError && <span id="date-range-error" role="alert">{t(rangeError)}</span>}
      </div>
      {(areSourcesLoading || isLoading) ? <div className="state-panel"><Spin size="large" /></div>
        : error ? <div className="state-panel"><Empty description={t(error)} title={t('Unable to load running data')} /></div>
        : !rangeError && populatedGroups.length === 0 ? <div className="state-panel"><Empty description={t('No running records found in this date range.')} /></div>
        : null}
      {!isLoading && !areSourcesLoading && !error && populatedGroups.map((summary) => (
        <RunningGroupSection key={summary.chartId} summary={summary} />
      ))}
    </div>
  );
};
