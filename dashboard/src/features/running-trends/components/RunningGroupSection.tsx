import { Tag } from '@douyinfe/semi-ui';

import { t } from '@/shared/i18n';

import { METRIC_OPTIONS } from '../constants/metrics';
import { useRunningChartStore } from '../store/use-running-chart-store';

import { MetricKpi } from './MetricKpi';
import { MetricSelector } from './MetricSelector';
import { RunningTrendChart } from './RunningTrendChart';

import type { ChartGroupSummary, ChartMode } from '../utils/types';

type RunningGroupSectionProps = {
  summary: ChartGroupSummary;
};

export const RunningGroupSection = ({ summary }: RunningGroupSectionProps) => {
  const selectedMode =
    useRunningChartStore(
      (state) => state.selectedModeByGroup[summary.chartId],
    ) ?? 'distanceKm';
  const setSelectedMode = useRunningChartStore(
    (state) => state.setSelectedMode,
  );

  return (
    <section className="group-section">
      <div className="section-header">
        <div>
          <div className="section-title-row">
            <h2>
              {summary.group} / {summary.type}
            </h2>
            <Tag color="blue" shape="circle">
              {summary.points.length} {t('runs')}
            </Tag>
          </div>
          <p>{summary.dateRange}</p>
        </div>
        <MetricSelector
          onChange={(mode: ChartMode) => setSelectedMode(summary.chartId, mode)}
          selectedMode={selectedMode}
        />
      </div>
      <div className="metric-grid">
        {METRIC_OPTIONS.map((metric) => (
          <MetricKpi
            key={metric.key}
            label={metric.label}
            metric={metric.key}
            summary={summary.metrics[metric.key]}
            unit={metric.unit}
          />
        ))}
      </div>
      {selectedMode === 'effortScore' && (
        <div className="chart-note">
          {t('Moving Time × (Avg HR / Max HR)^2 × Aerobic TE')}
        </div>
      )}
      <RunningTrendChart mode={selectedMode} points={summary.points} />
    </section>
  );
};
