import { liveNumberFormat } from '@byted-tiktok/live-platform-common';

import type { MetricKey } from './types';

export const formatPace = (paceMinPerKm: number): string => {
  const totalSeconds = Math.round(paceMinPerKm * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const formatMetricValue = (metric: MetricKey, value: number): string => {
  if (metric === 'paceMinPerKm') {
    return formatPace(value);
  }

  return liveNumberFormat(value, {
    maximumFractionDigits:
      metric === 'distanceKm' ||
      metric === 'effortScore' ||
      metric === 'temperatureC'
        ? 2
        : 0,
    minimumFractionDigits:
      metric === 'distanceKm' ||
      metric === 'effortScore' ||
      metric === 'temperatureC'
        ? 2
        : 0,
  });
};

export const formatDelta = (
  metric: MetricKey,
  value: number | null,
): string => {
  if (value === null) {
    return 'n/a';
  }

  const sign = value > 0 ? '+' : '';

  if (metric === 'paceMinPerKm') {
    const totalSeconds = Math.round(value * 60);
    const absoluteSeconds = Math.abs(totalSeconds);
    const signedPrefix = totalSeconds > 0 ? '+' : totalSeconds < 0 ? '-' : '';
    return `${signedPrefix}${Math.floor(absoluteSeconds / 60)}:${String(
      absoluteSeconds % 60,
    ).padStart(2, '0')}`;
  }

  return `${sign}${liveNumberFormat(value, {
    maximumFractionDigits:
      metric === 'distanceKm' ||
      metric === 'effortScore' ||
      metric === 'temperatureC'
        ? 2
        : 0,
    minimumFractionDigits:
      metric === 'distanceKm' ||
      metric === 'effortScore' ||
      metric === 'temperatureC'
        ? 2
        : 0,
  })}`;
};
