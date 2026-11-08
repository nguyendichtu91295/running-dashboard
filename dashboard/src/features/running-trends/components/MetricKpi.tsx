import { IconArrowDown, IconArrowUp, IconMinus } from '@douyinfe/semi-icons';

import { t } from '@/shared/i18n';

import { formatDelta, formatMetricValue } from '../utils/format';

import type { MetricKey, MetricSummary } from '../utils/types';

type MetricKpiProps = {
  label: string;
  metric: MetricKey;
  summary: MetricSummary;
  unit: string;
};

const LOWER_IS_BETTER_METRICS = new Set<MetricKey>([
  'avgHr',
  'paceMinPerKm',
  'temperatureC',
]);

const getDeltaToneClass = (
  metric: MetricKey,
  value: number | null,
): 'bad' | 'flat' | 'good' => {
  if (value === null || value === 0) {
    return 'flat';
  }

  if (LOWER_IS_BETTER_METRICS.has(metric)) {
    return value < 0 ? 'good' : 'bad';
  }

  return value > 0 ? 'good' : 'bad';
};

export const MetricKpi = ({
  label,
  metric,
  summary,
  unit,
}: MetricKpiProps) => {
  const tone = getDeltaToneClass(metric, summary.wowDelta);
  const DeltaIcon =
    summary.wowDelta === null || summary.wowDelta === 0
      ? IconMinus
      : summary.wowDelta > 0
        ? IconArrowUp
        : IconArrowDown;

  return (
    <div className={`metric-kpi metric-kpi-${tone}`}>
      <span className="metric-kpi-label">{t(label)}</span>
      <div className="metric-kpi-row">
        <strong>{formatMetricValue(metric, summary.average)}</strong>
        <span className="metric-kpi-unit">{unit}</span>
        <span className="metric-kpi-delta">
          <DeltaIcon size="small" />
          {formatDelta(metric, summary.wowDelta)}
        </span>
      </div>
    </div>
  );
};
