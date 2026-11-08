import type { ChartMode, MetricKey } from '../utils/types';

export const METRIC_OPTIONS: Array<{
  color: string;
  key: MetricKey;
  label: string;
  unit: string;
}> = [
  {
    color: '#1662d4',
    key: 'distanceKm',
    label: 'Distance',
    unit: 'km',
  },
  {
    color: '#0f766e',
    key: 'effortScore',
    label: 'Effort',
    unit: 'pts',
  },
  {
    color: '#c2410c',
    key: 'avgHr',
    label: 'Avg HR',
    unit: 'bpm',
  },
  {
    color: '#047857',
    key: 'paceMinPerKm',
    label: 'Avg Pace',
    unit: '/km',
  },
  {
    color: '#7c3aed',
    key: 'temperatureC',
    label: 'Temperature',
    unit: '°C',
  },
];

export const CHART_MODE_OPTIONS: Array<{
  key: ChartMode;
  label: string;
}> = [
  {
    key: 'distanceKm',
    label: 'Distance',
  },
  {
    key: 'effortScore',
    label: 'Effort',
  },
  {
    key: 'runContext',
    label: 'Pace + HR + Temp',
  },
];
