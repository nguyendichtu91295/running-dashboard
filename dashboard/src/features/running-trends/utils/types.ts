export type MetricKey =
  | 'avgHr'
  | 'distanceKm'
  | 'effortScore'
  | 'paceMinPerKm'
  | 'temperatureC';

export type ChartMode = 'distanceKm' | 'effortScore' | 'runContext';

export type RawRunRecord = {
  'Activity Type': string;
  'Aerobic TE': string;
  'Avg HR': string;
  'Avg Pace': string;
  Date: string;
  Distance: string;
  'Max HR': string;
  'Max Temp': string;
  'Min Temp': string;
  'Moving Time': string;
  'Progression #': string;
  Time: string;
  Title: string;
  'Workout Group': string;
  'Workout Type': string;
};

export type RunDataPoint = {
  avgHr: number;
  date: string;
  distanceKm: number;
  effortScore: number;
  elapsedTime: string;
  group: string;
  paceLabel: string;
  paceMinPerKm: number;
  progression: number;
  temperatureC: number;
  temperatureLabel: string;
  title: string;
  type: string;
};

export type MetricSummary = {
  average: number;
  latest: number;
  trendDelta: number;
  wowDelta: number | null;
};

export type ChartGroupSummary = {
  chartId: string;
  dateRange: string;
  group: string;
  metrics: Record<MetricKey, MetricSummary>;
  points: RunDataPoint[];
  type: string;
};
