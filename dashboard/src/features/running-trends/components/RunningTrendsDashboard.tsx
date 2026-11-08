import { useMemo, useState } from 'react';

import { Button, Empty, Spin } from '@douyinfe/semi-ui';

import { t } from '@/shared/i18n';

import { useRunningTrends } from '../hooks/use-running-trends';
import { buildChartSummaries, defaultDateRange, filterRecordsByDate, isValidDateKey } from '../utils/running-data';

import { RunningGroupSection } from './RunningGroupSection';

export const RunningTrendsDashboard = () => {
  const { data: records, error, isLoading, hasLoaded, refresh } = useRunningTrends();
  const [range, setRange] = useState(defaultDateRange);
  const rangeError = !isValidDateKey(range.start) || !isValidDateKey(range.end)
    ? 'Enter valid start and end dates.'
    : range.start > range.end ? 'Start date must be on or before end date.' : null;
  const data = useMemo(() => rangeError ? [] : buildChartSummaries(filterRecordsByDate(records, range.start, range.end)), [records, range.start, range.end, rangeError]);
  const populatedGroups = data.filter((summary) => summary.points.length > 0);

  return (
    <div className="dashboard-stack">
      <div className="data-source-toolbar">
        <Button onClick={refresh} disabled={isLoading}>{t(error ? 'Retry' : 'Refresh')}</Button>
        {hasLoaded && isLoading && <Spin size="small" />}
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
      {!hasLoaded && isLoading && <div className="state-panel"><Spin size="large" /></div>}
      {error && <div className="state-panel" role="alert"><Empty description={t(error)} title={t('Unable to load running data')} /></div>}
      {hasLoaded && !rangeError && records.length === 0 && <div className="state-panel"><Empty description={t('No running records found.')} /></div>}
      {hasLoaded && !rangeError && records.length > 0 && filterRecordsByDate(records, range.start, range.end).length === 0 && <div className="state-panel"><Empty description={t('No running records found in this date range.')} /></div>}
      {hasLoaded && populatedGroups.map((summary) => (
        <RunningGroupSection key={summary.chartId} summary={summary} />
      ))}
    </div>
  );
};
