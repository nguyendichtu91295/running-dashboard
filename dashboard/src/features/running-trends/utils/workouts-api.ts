import { isValidDateKey } from './running-data';
import type { RawRunRecord } from './types';

const fields: (keyof RawRunRecord)[] = ['Activity Type', 'Aerobic TE', 'Avg HR', 'Avg Pace', 'Date', 'Distance', 'Max HR', 'Max Temp', 'Min Temp', 'Moving Time', 'Progression #', 'Time', 'Title', 'Workout Group', 'Workout Type'];
const types = new Set(['easy run', 'long run', 'interval', 'tempo', 'interval / tempo', 'race', 'uncategorized']);
const numericFields: (keyof RawRunRecord)[] = ['Aerobic TE', 'Avg HR', 'Distance', 'Max HR', 'Max Temp', 'Min Temp', 'Progression #'];
const number = (value: string): number => /^-?\d+(?:\.\d+)?$/.test(value) ? Number(value) : NaN;
const duration = (value: string): boolean => {
  const match = /^(\d+):([0-5]\d):([0-5]\d(?:\.\d+)?)$/.exec(value);
  if (!match) return false;
  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return Number.isFinite(seconds) && seconds > 0;
};
const pace = (value: string): boolean => {
  const match = /^(\d+):([0-5]\d)$/.exec(value);
  if (!match) return false;
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  return Number.isFinite(seconds) && seconds > 0;
};

export function parseWorkouts(value: unknown): RawRunRecord[] {
  if (!Array.isArray(value)) throw new Error('Invalid workouts response: expected an array.');
  return value.map((item: unknown, index) => {
    const fail = (): never => { throw new Error(`Invalid workout record ${index + 1}.`); };
    if (!item || typeof item !== 'object' || Array.isArray(item)) return fail();
    const record = item as Record<string, unknown>;
    if (Object.keys(record).length !== fields.length || fields.some((field) => typeof record[field] !== 'string' || !(record[field] as string).trim())) return fail();
    const row = record as RawRunRecord;
    if (!types.has(row['Workout Type']) || numericFields.some((field) => !Number.isFinite(number(row[field])))) return fail();
    if (number(row['Max HR']) <= 0 || number(row['Avg HR']) <= 0 || number(row.Distance) <= 0 || number(row['Progression #']) <= 0 || !Number.isSafeInteger(number(row['Progression #']))) return fail();
    const date = /^(\d{4}-\d{2}-\d{2})(?:[ T]([01]\d|2[0-3]):([0-5]\d):([0-5]\d))?$/.exec(row.Date);
    if (!date || !isValidDateKey(date[1]) || !duration(row.Time) || !duration(row['Moving Time']) || !pace(row['Avg Pace'])) return fail();
    const effort = (Number(row['Moving Time'].split(':')[0]) * 60 + Number(row['Moving Time'].split(':')[1]) + Number(row['Moving Time'].split(':')[2]) / 60) * (number(row['Avg HR']) / number(row['Max HR'])) ** 2 * number(row['Aerobic TE']);
    if (!Number.isFinite(effort) || !Number.isFinite((number(row['Min Temp']) + number(row['Max Temp'])) / 2)) return fail();
    return row;
  });
}
