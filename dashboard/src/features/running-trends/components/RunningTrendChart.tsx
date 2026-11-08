import { useState } from 'react';

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { METRIC_OPTIONS } from '../constants/metrics';
import { formatMetricValue } from '../utils/format';

import { RunningChartTooltip } from './RunningChartTooltip';

import type { ChartMode, MetricKey, RunDataPoint } from '../utils/types';

type RunningTrendChartProps = {
  mode: ChartMode;
  points: RunDataPoint[];
};

type ComboSeriesKey = 'avgHr' | 'paceMinPerKm' | 'temperatureC';

const COMBO_SERIES_KEYS: ComboSeriesKey[] = [
  'avgHr',
  'paceMinPerKm',
  'temperatureC',
];

const getMetricColor = (metric: MetricKey): string =>
  METRIC_OPTIONS.find((option) => option.key === metric)?.color ?? '#1662d4';

const COMBO_SERIES: Array<{
  color: string;
  key: ComboSeriesKey;
  label: string;
}> = [
  {
    color: getMetricColor('avgHr'),
    key: 'avgHr',
    label: 'HR',
  },
  {
    color: getMetricColor('paceMinPerKm'),
    key: 'paceMinPerKm',
    label: 'Pace',
  },
  {
    color: getMetricColor('temperatureC'),
    key: 'temperatureC',
    label: 'Temperature',
  },
];

export const RunningTrendChart = ({
  mode,
  points,
}: RunningTrendChartProps) => {
  const [hiddenSeries, setHiddenSeries] = useState<Set<ComboSeriesKey>>(
    () => new Set(),
  );
  const color = getMetricColor('distanceKm');
  const effortColor = getMetricColor('effortScore');
  const isEffort = mode === 'effortScore';
  const isRunContext = mode === 'runContext';
  const handleLegendClick = (key: ComboSeriesKey): void => {
    setHiddenSeries((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  return (
    <div className="chart-frame">
      {isRunContext && (
        <div className="combo-legend" aria-label="Toggle chart metrics">
          {COMBO_SERIES.map((series) => {
            const isHidden = hiddenSeries.has(series.key);

            return (
              <button
                aria-pressed={!isHidden}
                className={`combo-legend-button ${
                  isHidden ? 'is-hidden' : ''
                }`}
                key={series.key}
                onClick={() => handleLegendClick(series.key)}
                type="button"
              >
                <span
                  className="combo-legend-mark"
                  style={{ background: series.color }}
                />
                {series.label}
              </button>
            );
          })}
        </div>
      )}
      <ResponsiveContainer height={300} width="100%">
        <ComposedChart
          data={points}
          margin={{ bottom: 8, left: 4, right: isRunContext ? 46 : 12, top: 20 }}
        >
          <defs>
            <linearGradient id="fill-distanceKm" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.24} />
              <stop offset="95%" stopColor={color} stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="fill-effortScore" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={effortColor} stopOpacity={0.28} />
              <stop offset="95%" stopColor={effortColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#edf0f5" strokeDasharray="4 4" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="progression"
            tick={{ fill: '#8a8f98', fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            dataKey={
              isRunContext ? 'avgHr' : isEffort ? 'effortScore' : 'distanceKm'
            }
            domain={isRunContext ? ['dataMin - 6', 'dataMax + 6'] : undefined}
            label={
              isRunContext
                ? {
                    angle: -90,
                    fill: getMetricColor('avgHr'),
                    offset: 0,
                    position: 'insideLeft',
                    value: 'HR',
                  }
                : undefined
            }
            tick={{ fill: '#8a8f98', fontSize: 12 }}
            tickFormatter={(value: number) =>
              isRunContext
                ? `${Math.round(value)}`
                : formatMetricValue(isEffort ? 'effortScore' : 'distanceKm', value)
            }
            tickLine={false}
            width={62}
            yAxisId="left"
          />
          {isRunContext && (
            <>
              <YAxis
                axisLine={false}
                dataKey="paceMinPerKm"
                domain={['dataMin - 0.25', 'dataMax + 0.25']}
                label={{
                  angle: 90,
                  fill: getMetricColor('paceMinPerKm'),
                  offset: 6,
                  position: 'insideRight',
                  value: 'Pace',
                }}
                orientation="right"
                tick={{ fill: '#8a8f98', fontSize: 12 }}
                tickFormatter={(value: number) =>
                  formatMetricValue('paceMinPerKm', value)
                }
                tickLine={false}
                width={58}
                yAxisId="pace"
              />
              <YAxis
                axisLine={false}
                dataKey="temperatureC"
                domain={['dataMin - 1', 'dataMax + 1']}
                orientation="right"
                tick={{ fill: '#8a8f98', fontSize: 12 }}
                tickFormatter={(value: number) => `${value.toFixed(0)}°`}
                tickLine={false}
                width={40}
                yAxisId="temp"
              />
            </>
          )}
          <Tooltip content={<RunningChartTooltip mode={mode} />} />
          {isRunContext ? (
            <>
              {!hiddenSeries.has('avgHr') && (
                <Bar
                  barSize={8}
                  dataKey="avgHr"
                  fill={getMetricColor('avgHr')}
                  fillOpacity={0.78}
                  isAnimationActive={false}
                  maxBarSize={10}
                  name="HR"
                  radius={[3, 3, 0, 0]}
                  yAxisId="left"
                />
              )}
              {!hiddenSeries.has('paceMinPerKm') && (
                <Bar
                  barSize={8}
                  dataKey="paceMinPerKm"
                  fill={getMetricColor('paceMinPerKm')}
                  fillOpacity={0.78}
                  isAnimationActive={false}
                  maxBarSize={10}
                  name="Pace"
                  radius={[3, 3, 0, 0]}
                  yAxisId="pace"
                />
              )}
              {!hiddenSeries.has('temperatureC') && (
                <Line
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  dataKey="temperatureC"
                  dot={{ r: 3, stroke: '#ffffff', strokeWidth: 1.5 }}
                  isAnimationActive={false}
                  name="Temperature"
                  stroke={getMetricColor('temperatureC')}
                  strokeWidth={2.5}
                  type="monotone"
                  yAxisId="temp"
                />
              )}
            </>
          ) : isEffort ? (
            <Area
              activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              dataKey="effortScore"
              dot={{
                fill: effortColor,
                r: 3,
                stroke: '#ffffff',
                strokeWidth: 1.5,
              }}
              fill="url(#fill-effortScore)"
              isAnimationActive={false}
              stroke={effortColor}
              strokeWidth={3}
              type="monotone"
              yAxisId="left"
            />
          ) : (
            <Area
              activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              dataKey="distanceKm"
              dot={{ fill: color, r: 3, stroke: '#ffffff', strokeWidth: 1.5 }}
              fill="url(#fill-distanceKm)"
              isAnimationActive={false}
              stroke={color}
              strokeWidth={3}
              type="monotone"
              yAxisId="left"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
