import { CHART_GROUPS } from '../constants/chart-groups';

import type {
  ChartGroupSummary,
  MetricKey,
  MetricSummary,
  RawRunRecord,
  RunDataPoint,
} from './types';

const parseNumber = (value: string): number | null => {
  const normalized = value.replaceAll(',', '').trim();
  if (!normalized || normalized === '--') {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePace = (value: string): number | null => {
  const parts = value.trim().split(':');
  if (parts.length !== 2) {
    return null;
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return null;
  }

  return minutes + seconds / 60;
};

const formatDate = (value: string): string => value.split(' ')[0] ?? value;

const parseDurationMinutes = (value: string): number | null => {
  const parts = value.trim().split(':');
  if (parts.length !== 3) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2]);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds)
  ) {
    return null;
  }

  return hours * 60 + minutes + seconds / 60;
};

const toDataPoint = (record: RawRunRecord): RunDataPoint | null => {
  const aerobicTe = parseNumber(record['Aerobic TE']);
  const distanceKm = parseNumber(record.Distance);
  const avgHr = parseNumber(record['Avg HR']);
  const maxHr = parseNumber(record['Max HR']);
  const movingTimeMinutes = parseDurationMinutes(record['Moving Time']);
  const paceMinPerKm = parsePace(record['Avg Pace']);
  const progression = parseNumber(record['Progression #']);
  const minTemp = parseNumber(record['Min Temp']);
  const maxTemp = parseNumber(record['Max Temp']);

  if (
    aerobicTe === null ||
    distanceKm === null ||
    avgHr === null ||
    maxHr === null ||
    movingTimeMinutes === null ||
    paceMinPerKm === null ||
    progression === null ||
    minTemp === null ||
    maxTemp === null
  ) {
    return null;
  }

  const effortScore = movingTimeMinutes * (avgHr / maxHr) ** 2 * aerobicTe;
  const temperatureC = (minTemp + maxTemp) / 2;

  return {
    avgHr,
    date: formatDate(record.Date),
    distanceKm,
    effortScore,
    elapsedTime: record.Time,
    group: record['Workout Group'],
    paceLabel: record['Avg Pace'],
    paceMinPerKm,
    progression,
    temperatureC,
    temperatureLabel: `${minTemp.toFixed(0)}-${maxTemp.toFixed(0)}°C`,
    title: record.Title,
    type: record['Workout Type'],
  };
};

const calculateMetricSummary = (
  points: RunDataPoint[],
  metric: MetricKey,
): MetricSummary => {
  const values = points.map((point) => point[metric]);
  if (values.length === 0) {
    return {
      average: 0,
      latest: 0,
      trendDelta: 0,
      wowDelta: null,
    };
  }

  const average = values.reduce((total, value) => total + value, 0) / values.length;
  const latest = values.at(-1) ?? 0;
  const previous = values.at(-2);
  const first = values[0] ?? latest;

  return {
    average,
    latest,
    trendDelta: latest - first,
    wowDelta: previous === undefined ? null : latest - previous,
  };
};

export const buildChartSummaries = (
  records: RawRunRecord[],
): ChartGroupSummary[] =>
  CHART_GROUPS.map(({ group, type }) => {
    const points = records
      .filter(
        (record) =>
          record['Workout Group'] === group && record['Workout Type'] === type,
      )
      .map(toDataPoint)
      .filter((point): point is RunDataPoint => point !== null)
      .sort((first, second) => first.progression - second.progression);

    const dateRange =
      points.length > 0
        ? `${points[0].date} to ${points[points.length - 1].date}`
        : 'No runs';

    return {
      chartId: `${group}-${type}`.toLowerCase().replaceAll(/\s+|\/+/g, '-'),
      dateRange,
      group,
      metrics: {
        avgHr: calculateMetricSummary(points, 'avgHr'),
        distanceKm: calculateMetricSummary(points, 'distanceKm'),
        effortScore: calculateMetricSummary(points, 'effortScore'),
        paceMinPerKm: calculateMetricSummary(points, 'paceMinPerKm'),
        temperatureC: calculateMetricSummary(points, 'temperatureC'),
      },
      points,
      type,
    };
  });
