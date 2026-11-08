import { t } from '@/shared/i18n';

import { formatMetricValue } from '../utils/format';

import type { ChartMode, MetricKey, RunDataPoint } from '../utils/types';

type TooltipPayload = {
  payload?: RunDataPoint;
  value?: number;
};

type RunningChartTooltipProps = {
  active?: boolean;
  label?: string;
  mode: ChartMode;
  payload?: TooltipPayload[];
};

const METRIC_LABELS: Record<MetricKey, string> = {
  avgHr: 'Avg HR',
  distanceKm: 'Distance',
  effortScore: 'Effort',
  paceMinPerKm: 'Avg Pace',
  temperatureC: 'Temperature',
};

type TooltipRowProps = {
  label: string;
  value: string;
};

const TooltipRow = ({ label, value }: TooltipRowProps) => (
  <div className="chart-tooltip-row">
    <span>{t(label)}</span>
    <strong>{value}</strong>
  </div>
);

export const RunningChartTooltip = ({
  active,
  mode,
  payload,
}: RunningChartTooltipProps) => {
  if (!active || !payload?.[0]?.payload) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-header">
        <strong>{point.date}</strong>
        <span>{point.title}</span>
      </div>
      <div className="chart-tooltip-grid">
        <TooltipRow label="Run" value={`#${point.progression}`} />
        <TooltipRow
          label={METRIC_LABELS.distanceKm}
          value={`${formatMetricValue('distanceKm', point.distanceKm)} ${t('km')}`}
        />
        <TooltipRow
          label={METRIC_LABELS.effortScore}
          value={`${formatMetricValue('effortScore', point.effortScore)} ${t('pts')}`}
        />
        <TooltipRow
          label={METRIC_LABELS.avgHr}
          value={`${formatMetricValue('avgHr', point.avgHr)} ${t('bpm')}`}
        />
        <TooltipRow
          label={METRIC_LABELS.paceMinPerKm}
          value={`${point.paceLabel}/${t('km')}`}
        />
        <TooltipRow label={METRIC_LABELS.temperatureC} value={point.temperatureLabel} />
      </div>
    </div>
  );
};
